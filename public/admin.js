const $ = (s, root = document) => root.querySelector(s);
const loginView = $('#login-view');
const panelView = $('#panel-view');
const list = $('#property-list');
const editor = $('#property-editor');
const propertyForm = $('#property-form');
let properties = [];
let settings = {};
let demoProperties = [];

async function api(action, { method = 'GET', body, query = '' } = {}) {
  const response = await fetch(`/api/admin?action=${encodeURIComponent(action)}${query}`, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Falha na solicitação (${response.status}).`);
  return data;
}

function notice(target, message, error = false) {
  target.textContent = message;
  target.classList.toggle('error', error);
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function showPanel() {
  loginView.hidden = true;
  panelView.hidden = false;
}

function showLogin() {
  panelView.hidden = true;
  loginView.hidden = false;
}

function renderList() {
  list.innerHTML = properties.length ? properties.map((property) => {
    const status = property.publication_status;
    const label = status === 'published' ? 'Publicado' : status === 'unavailable' ? 'Indisponível' : 'Rascunho';
    return `<article class="property-row"><div><h3>${escapeHTML(property.data?.title || property.id)}</h3><p>${escapeHTML(property.code)} · ${escapeHTML(property.data?.city || 'Município não informado')} · ${escapeHTML(property.data?.purpose || 'Finalidade não informada')}</p></div><div class="property-row-actions"><span class="status-pill ${escapeHTML(status)}">${label}</span><button class="edit-button" type="button" data-edit="${escapeHTML(property.id)}">Editar</button></div></article>`;
  }).join('') : '<p class="empty-message">Nenhum imóvel cadastrado. Use “Novo imóvel” para criar o primeiro anúncio.</p>';
}

async function loadDemoPreview() {
  const target = $('#demo-property-list');
  const count = $('#demo-count');
  try {
    const response = await fetch('/demo-properties.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Vitrine indisponível.');
    demoProperties = await response.json();
    count.textContent = `(${demoProperties.length})`;
    target.innerHTML = demoProperties.map((property) => `<article class="property-row"><div><h3>${escapeHTML(property.title)}</h3><p>${escapeHTML(property.code)} · ${escapeHTML(property.city)} · ${escapeHTML(property.type)}</p></div><div class="property-row-actions"><span class="status-pill">DEMO</span><a class="edit-button" href="/imovel/${encodeURIComponent(property.slug)}?demo=1" target="_blank" rel="noreferrer">Prévia ↗</a></div></article>`).join('');
  } catch {
    target.innerHTML = '<p class="empty-message">Não foi possível carregar a vitrine demonstrativa.</p>';
  }
}

function hydrateSettings(data) {
  settings = data || {};
  for (const [key, value] of Object.entries(settings)) {
    const field = $('#settings-form').elements.namedItem(key);
    if (field) field.value = value ?? '';
  }
}

async function loadPanel() {
  const data = await api('admin');
  properties = Array.isArray(data.properties) ? data.properties : [];
  hydrateSettings(data.settings);
  renderList();
  showPanel();
}

function slugify(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
}

function editProperty(property) {
  editor.hidden = false;
  $('#editor-title').textContent = property ? 'Editar imóvel' : 'Novo imóvel';
  $('#delete-property').hidden = !property;
  propertyForm.reset();
  const d = property?.data || {};
  const values = {
    originalId: property?.id || '', slug: property?.slug || '', code: property?.code || '',
    publication_status: property?.publication_status || 'draft', featured: property?.featured || false,
    position: property?.position ?? properties.length + 1,
    title: d.title || '', type: d.type || '', purpose: d.purpose || 'Venda', city: d.city || '', state: d.state || 'RO',
    area: d.area ?? '', areaUnit: d.areaUnit || '', price: d.price ?? '', pricePerUnit: d.pricePerUnit ?? '',
    productiveArea: d.productiveArea ?? '', bedrooms: d.bedrooms ?? '', bathrooms: d.bathrooms ?? '', parking: d.parking ?? '',
    badge: d.badge || '', summary: d.summary || '', description: d.description || '', sourceNote: d.sourceNote || '', imageAlt: d.imageAlt || '',
    images: (d.images || []).join('\n'),
  };
  for (const [name, value] of Object.entries(values)) {
    const field = propertyForm.elements.namedItem(name);
    if (!field) continue;
    if (field.type === 'checkbox') field.checked = Boolean(value);
    else field.value = value;
  }
  notice($('#property-message'), '');
  editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function numberOrNull(value) {
  if (value === '' || value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

propertyForm.addEventListener('input', (event) => {
  if (event.target.name === 'title' && !propertyForm.elements.namedItem('originalId').value) {
    propertyForm.elements.namedItem('slug').value = slugify(event.target.value);
  }
});

$('#new-property').addEventListener('click', () => editProperty(null));
$('#close-editor').addEventListener('click', () => { editor.hidden = true; });
list.addEventListener('click', (event) => {
  const button = event.target.closest('[data-edit]');
  if (button) editProperty(properties.find((property) => property.id === button.dataset.edit));
});

propertyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = new FormData(propertyForm);
  const originalId = String(values.get('originalId') || '');
  const title = String(values.get('title') || '').trim();
  const id = originalId || slugify(String(values.get('slug') || title));
  const images = String(values.get('images') || '').split('\n').map((item) => item.trim()).filter(Boolean);
  if (!images.length) { notice($('#property-message'), 'Adicione pelo menos uma imagem ou caminho de imagem.', true); return; }
  const data = {
    title, type: String(values.get('type') || '').trim(), purpose: String(values.get('purpose') || 'Venda'),
    city: String(values.get('city') || '').trim(), state: String(values.get('state') || 'RO').toUpperCase().slice(0, 2),
    area: numberOrNull(values.get('area')), areaUnit: String(values.get('areaUnit') || '').trim(),
    price: numberOrNull(values.get('price')), pricePerUnit: numberOrNull(values.get('pricePerUnit')),
    productiveArea: numberOrNull(values.get('productiveArea')), bedrooms: numberOrNull(values.get('bedrooms')),
    bathrooms: numberOrNull(values.get('bathrooms')), parking: numberOrNull(values.get('parking')),
    badge: String(values.get('badge') || '').trim(), summary: String(values.get('summary') || '').trim(),
    description: String(values.get('description') || '').trim(), sourceNote: String(values.get('sourceNote') || '').trim(),
    imageAlt: String(values.get('imageAlt') || '').trim(), images,
  };
  const record = {
    id, slug: String(values.get('slug') || slugify(title)), code: String(values.get('code') || '').trim(),
    publication_status: String(values.get('publication_status')), featured: propertyForm.elements.namedItem('featured').checked,
    position: Number(values.get('position') || 0), data,
  };
  if (!/^[a-z0-9-]{3,90}$/.test(record.id) || !/^[a-z0-9-]{3,120}$/.test(record.slug)) { notice($('#property-message'), 'Use um identificador e slug com letras minúsculas, números e hífens.', true); return; }
  const button = propertyForm.querySelector('[type="submit"]'); button.disabled = true;
  try {
    await api('property', { method: originalId ? 'PUT' : 'POST', body: record });
    notice($('#property-message'), 'Imóvel salvo.');
    editor.hidden = true;
    await loadPanel();
  } catch (error) { notice($('#property-message'), error.message, true); }
  finally { button.disabled = false; }
});

$('#delete-property').addEventListener('click', async () => {
  const id = String(propertyForm.elements.namedItem('originalId').value || '');
  if (!id || !window.confirm('Excluir este imóvel e retirar o anúncio do catálogo?')) return;
  try { await api('property', { method: 'DELETE', query: `&id=${encodeURIComponent(id)}` }); editor.hidden = true; await loadPanel(); }
  catch (error) { notice($('#property-message'), error.message, true); }
});

$('#photo-upload').addEventListener('change', async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  if (file.size > 10 * 1024 * 1024) { notice($('#property-message'), 'A imagem precisa ter até 10 MB.', true); event.target.value = ''; return; }
  notice($('#property-message'), 'Enviando imagem…');
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const base64 = String(reader.result).split(',')[1];
      const result = await api('upload', { method: 'POST', body: { name: file.name, type: file.type, base64 } });
      const field = propertyForm.elements.namedItem('images');
      field.value = `${field.value.trim()}${field.value.trim() ? '\n' : ''}${result.path}`;
      const alt = propertyForm.elements.namedItem('imageAlt'); if (!alt.value) alt.value = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      notice($('#property-message'), 'Foto enviada. Salve o imóvel para publicar a alteração.');
    } catch (error) { notice($('#property-message'), error.message, true); }
    finally { event.target.value = ''; }
  };
  reader.onerror = () => notice($('#property-message'), 'Falha ao ler o arquivo da imagem.', true);
  reader.readAsDataURL(file);
});

$('#settings-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); const data = Object.fromEntries(values.entries());
  const phone = String(data.whatsapp || '').replace(/\D/g, '');
  if (phone.length < 10 || phone.length > 15) { notice($('#settings-message'), 'Informe um WhatsApp válido com DDI e DDD.', true); return; }
  data.whatsapp = phone;
  try { await api('settings', { method: 'PUT', body: data }); hydrateSettings(data); notice($('#settings-message'), 'Apresentação salva.'); }
  catch (error) { notice($('#settings-message'), error.message, true); }
});

$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button'); button.disabled = true;
  try { await api('login', { method: 'POST', body: Object.fromEntries(new FormData(form).entries()) }); form.reset(); await api('session'); await loadPanel(); }
  catch (error) { notice($('#login-message'), error.message, true); }
  finally { button.disabled = false; }
});

$('#logout').addEventListener('click', async () => { try { await api('logout', { method: 'POST' }); } finally { showLogin(); } });

async function start() {
  loadDemoPreview();
  try { await api('session'); await loadPanel(); }
  catch { showLogin(); }
}
start();
