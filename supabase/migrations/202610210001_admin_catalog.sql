create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;

create table if not exists public.properties (
  id text primary key,
  slug text not null unique,
  code text not null unique,
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published', 'unavailable')),
  featured boolean not null default false,
  position integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id text primary key default 'default' check (id = 'default'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.properties enable row level security;
alter table public.site_settings enable row level security;
revoke all on public.properties from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;

create table if not exists private.admin_credentials (
  id integer primary key default 1 check (id = 1),
  username text not null,
  password_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists private.app_secrets (
  key text primary key,
  value text not null
);

create table if not exists private.login_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  succeeded boolean not null,
  attempted_at timestamptz not null default now()
);

insert into private.admin_credentials (id, username, password_hash)
values (1, 'jaquesadm', extensions.crypt('0000', extensions.gen_salt('bf', 12)))
on conflict (id) do nothing;

insert into private.app_secrets (key, value)
values ('session_hmac', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

create or replace function public.admin_login(p_username text, p_password text, p_ip_hash text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions
as $$
declare
  recent_failures integer;
  is_valid boolean;
begin
  delete from private.login_attempts where attempted_at < now() - interval '48 hours';
  select count(*) into recent_failures
  from private.login_attempts
  where ip_hash = p_ip_hash and succeeded = false and attempted_at > now() - interval '15 minutes';
  if recent_failures >= 5 then return 'locked'; end if;

  select c.username = p_username and c.password_hash = extensions.crypt(p_password, c.password_hash)
    into is_valid
  from private.admin_credentials c where c.id = 1;

  insert into private.login_attempts (ip_hash, succeeded) values (p_ip_hash, coalesce(is_valid, false));
  if coalesce(is_valid, false) then return 'ok'; end if;
  return 'invalid';
end;
$$;

create or replace function public.admin_session_secret()
returns text
language sql
security definer
set search_path = pg_catalog, public, private
as $$
  select value from private.app_secrets where key = 'session_hmac';
$$;

revoke all on function public.admin_login(text, text, text) from public, anon, authenticated;
revoke all on function public.admin_session_secret() from public, anon, authenticated;
grant execute on function public.admin_login(text, text, text) to service_role;
grant execute on function public.admin_session_secret() to service_role;

insert into public.site_settings (id, data) values ('default', jsonb_build_object(
  'heroTitle', 'O próximo capítulo começa em casa.',
  'heroCopy', 'Encontre imóveis em Rondônia com orientação próxima em cada etapa.',
  'heroEyebrow', 'IMÓVEIS EM RONDÔNIA',
  'whatsapp', '5569984823333',
  'phoneDisplay', '(69) 98482-3333',
  'creci', 'CRECI-RO 5610'
)) on conflict (id) do nothing;

insert into public.properties (id, slug, code, publication_status, featured, position, data)
values
('rolim-85-alqueires', 'propriedade-rural-85-alqueires-rolim-de-moura', 'JM-RO-085', 'published', true, 1,
 '{"title":"Propriedade rural de 8,5 alqueires","type":"Fazenda","purpose":"Venda","city":"Rolim de Moura","state":"RO","area":8.5,"areaUnit":"alqueires","price":null,"pricePerUnit":null,"images":["property-art-rolim.jpeg","property-aerial-art.jpeg","illustrative-rolim-rural-lounge.png"],"imageAlts":["Área de lazer com piscina em propriedade rural anunciada em Rolim de Moura","Vista aérea da propriedade rural em Rolim de Moura","Ambiente de lazer rural ilustrativo, sem confirmação de que pertença ao imóvel anunciado"],"imageAlt":"Área de lazer com piscina em propriedade rural anunciada em Rolim de Moura","summary":"Área de lazer com piscina em propriedade rural de 8,5 alqueires.","description":"Propriedade rural com 8,5 alqueires em Rolim de Moura e área de lazer junto à piscina. Consulte o corretor sobre valores, documentação e condições de negociação.","sourceNote":"Informações transcritas do material de divulgação enviado pelo cliente. Detalhes sujeitos à confirmação.","badge":"ÁREA RURAL","bedrooms":null,"bathrooms":null,"parking":null}'::jsonb),
('vilhena-821-alqueires', 'area-rural-821-alqueires-vilhena', 'JM-VH-821', 'published', true, 2,
 '{"title":"Área rural de 821 alqueires","type":"Área rural","purpose":"Venda","city":"Vilhena","state":"RO","area":821,"areaUnit":"alqueires","price":null,"pricePerUnit":40000,"productiveArea":412,"images":["property-art-vilhena.jpeg","illustrative-vilhena-pasture-1.png","illustrative-vilhena-pasture-2.png"],"imageAlts":["Arte de divulgação de área rural em Vilhena, Rondônia","Pastagem rural ilustrativa para referência; não é uma fotografia confirmada da propriedade","Paisagem rural ilustrativa para referência; não é uma fotografia confirmada da propriedade"],"imageAlt":"Arte de divulgação de área rural em Vilhena, Rondônia","summary":"Área rural de 821 alqueires, com 412 alqueires abertos para pecuária.","description":"Área rural em Vilhena com 821 alqueires, sendo 412 alqueires abertos para pecuária. Valor divulgado: R$ 40.000 por alqueire. Consulte o corretor sobre documentação e condições de negociação.","sourceNote":"Dados extraídos da arte de divulgação enviada pelo cliente; preço por alqueire e disponibilidade precisam ser confirmados antes da negociação.","badge":"OPORTUNIDADE RURAL","bedrooms":null,"bathrooms":null,"parking":null}'::jsonb)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;
