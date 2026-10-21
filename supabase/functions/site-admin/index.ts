import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEYS") ?? "";
const encoder = new TextEncoder();
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-admin-session, x-forwarded-for", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS" };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
const db = async (path: string, init: RequestInit = {}) => fetch(`${url}/rest/v1/${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers || {}) } });
let signingKey: CryptoKey | null = null;
async function secret() {
  if (!signingKey) {
    const r = await db("rpc/admin_session_secret", { method: "POST", body: "{}" });
    if (!r.ok) throw new Error("Session secret unavailable");
    const value = await r.json();
    signingKey = await crypto.subtle.importKey("raw", encoder.encode(value), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  }
  return signingKey;
}
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function sign(payload: string) { return b64(new Uint8Array(await crypto.subtle.sign("HMAC", await secret(), encoder.encode(payload)))); }
async function session(req: Request) {
  const token = req.headers.get("x-admin-session") || "";
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra) return false;
  const expected = await sign(payload);
  if (expected !== sig) return false;
  try { const data = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))); return data.u === "jasquesadm" && data.e > Date.now(); } catch { return false; }
}
const safeProperty = (value: any) => value && typeof value === "object" && typeof value.id === "string" && /^[a-z0-9-]{3,90}$/.test(value.id) && typeof value.slug === "string" && /^[a-z0-9-]{3,120}$/.test(value.slug) && typeof value.code === "string" && value.data && typeof value.data === "object" && ["draft", "published", "unavailable"].includes(value.publication_status);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const u = new URL(req.url), action = u.searchParams.get("action") || "public";
    if (action === "public" && req.method === "GET") {
      const [pr, sr] = await Promise.all([db("properties?select=id,slug,code,publication_status,featured,position,data&publication_status=eq.published&order=position.asc"), db("site_settings?select=data&id=eq.default&limit=1")]);
      if (!pr.ok || !sr.ok) return json({ error: "Não foi possível carregar o catálogo." }, 503);
      return json({ properties: (await pr.json()).map((p: any) => ({ ...p.data, id: p.id, slug: p.slug, code: p.code, featured: p.featured, position: p.position })), settings: (await sr.json())[0]?.data || {} });
    }
    if (action === "login" && req.method === "POST") {
      const body = await req.json();
      if (typeof body.username !== "string" || typeof body.password !== "string" || body.username.length > 80 || body.password.length > 128) return json({ error: "Credenciais inválidas." }, 400);
      const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
      const ipHash = await sign(`ip:${ip}`);
      const r = await db("rpc/admin_login", { method: "POST", body: JSON.stringify({ p_username: body.username, p_password: body.password, p_ip_hash: ipHash }) });
      if (!r.ok) return json({ error: "Falha ao validar acesso." }, 503);
      const result = await r.json();
      if (result === "locked") return json({ error: "Muitas tentativas. Aguarde 15 minutos." }, 429);
      if (result !== "ok") return json({ error: "Usuário ou senha incorretos." }, 401);
      const payload = btoa(JSON.stringify({ u: "jasquesadm", e: Date.now() + 8 * 60 * 60 * 1000 }));
      return json({ token: `${payload}.${await sign(payload)}` });
    }
    if (action === "session" && req.method === "GET") return await session(req) ? json({ authenticated: true }) : json({ authenticated: false }, 401);
    if (!(await session(req))) return json({ error: "Sessão inválida ou expirada." }, 401);
    if (action === "admin" && req.method === "GET") {
      const [pr, sr] = await Promise.all([db("properties?select=*&order=position.asc"), db("site_settings?select=data&id=eq.default&limit=1")]);
      if (!pr.ok || !sr.ok) return json({ error: "Falha ao carregar painel." }, 503);
      return json({ properties: await pr.json(), settings: (await sr.json())[0]?.data || {} });
    }
    if (action === "property" && req.method === "POST") {
      const p = await req.json(); if (!safeProperty(p)) return json({ error: "Dados do imóvel inválidos." }, 400);
      const r = await db("properties", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ id: p.id, slug: p.slug, code: p.code, publication_status: p.publication_status, featured: !!p.featured, position: Number(p.position) || 0, data: p.data }) });
      return json(r.ok ? await r.json() : { error: await r.text() }, r.ok ? 201 : 400);
    }
    if (action === "property" && req.method === "PUT") {
      const p = await req.json(); if (!safeProperty(p)) return json({ error: "Dados do imóvel inválidos." }, 400);
      const r = await db(`properties?id=eq.${encodeURIComponent(p.id)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ slug: p.slug, code: p.code, publication_status: p.publication_status, featured: !!p.featured, position: Number(p.position) || 0, data: p.data, updated_at: new Date().toISOString() }) });
      return json(r.ok ? await r.json() : { error: await r.text() }, r.ok ? 200 : 400);
    }
    if (action === "property" && req.method === "DELETE") {
      const id = u.searchParams.get("id") || ""; if (!/^[a-z0-9-]{3,90}$/.test(id)) return json({ error: "Identificador inválido." }, 400);
      const r = await db(`properties?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }); return json(r.ok ? { ok: true } : { error: await r.text() }, r.ok ? 200 : 400);
    }
    if (action === "settings" && req.method === "PUT") {
      const data = await req.json(); if (!data || typeof data !== "object" || JSON.stringify(data).length > 20000) return json({ error: "Configurações inválidas." }, 400);
      const r = await db("site_settings?id=eq.default", { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ data, updated_at: new Date().toISOString() }) }); return json(r.ok ? { ok: true } : { error: await r.text() }, r.ok ? 200 : 400);
    }
    if (action === "upload" && req.method === "POST") {
      const body = await req.json(); const name = String(body.name || "").replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120); const mime = String(body.type || "");
      if (!name || !["image/jpeg", "image/png", "image/webp"].includes(mime) || typeof body.base64 !== "string" || body.base64.length > 14_000_000) return json({ error: "Imagem inválida ou acima de 10 MB." }, 400);
      const bytes = Uint8Array.from(atob(body.base64), c => c.charCodeAt(0)); if (bytes.length > 10 * 1024 * 1024) return json({ error: "Imagem acima de 10 MB." }, 400);
      const path = `${crypto.randomUUID()}-${name}`; const r = await fetch(`${url}/storage/v1/object/property-images/${path}`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": mime, "x-upsert": "false" }, body: bytes });
      if (!r.ok) return json({ error: "Não foi possível salvar a imagem." }, 400);
      return json({ path: `${url}/storage/v1/object/public/property-images/${path}` }, 201);
    }
    return json({ error: "Ação não encontrada." }, 404);
  } catch (error) { console.error(error); return json({ error: "Erro interno no serviço administrativo." }, 500); }
});
