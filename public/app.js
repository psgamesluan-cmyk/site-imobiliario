let CONTACT = '5569984823333';
let siteSettings = {};
const displayPhone = () => siteSettings.phoneDisplay || '(69) 98482-3333';
const phoneHref = () => `tel:+${String(CONTACT).replace(/\D/g, '')}`;
const creciText = () => siteSettings.creci || 'CRECI-RO 5610';
const MEDIA = '/media/';
let properties = [
  {
    id: 'rolim-85-alqueires',
    slug: 'propriedade-rural-85-alqueires-rolim-de-moura',
    title: 'Propriedade rural de 8,5 alqueires',
    type: 'Fazenda',
    purpose: 'Venda',
    city: 'Rolim de Moura',
    state: 'RO',
    area: 8.5,
    areaUnit: 'alqueires',
    price: null,
    pricePerUnit: null,
    images: ['property-art-rolim.jpeg', 'property-aerial-art.jpeg', 'illustrative-rolim-rural-lounge.png'],
    imageAlts: ['Área de lazer com piscina em propriedade rural anunciada em Rolim de Moura', 'Vista aérea da propriedade rural em Rolim de Moura', 'Ambiente de lazer rural ilustrativo, sem confirmação de que pertença ao imóvel anunciado'],
    imageAlt: 'Área de lazer com piscina em propriedade rural anunciada em Rolim de Moura',
    summary: 'Área de lazer com piscina em propriedade rural de 8,5 alqueires.',
    description: 'Propriedade rural com 8,5 alqueires em Rolim de Moura e área de lazer junto à piscina. Consulte o corretor sobre valores, documentação e condições de negociação.',
    sourceNote: 'Informações transcritas do material de divulgação enviado pelo cliente. Detalhes sujeitos à confirmação.',
    badge: 'ÁREA RURAL',
  },
  {
    id: 'vilhena-821-alqueires',
    slug: 'area-rural-821-alqueires-vilhena',
    title: 'Área rural de 821 alqueires',
    type: 'Área rural',
    purpose: 'Venda',
    city: 'Vilhena',
    state: 'RO',
    area: 821,
    areaUnit: 'alqueires',
    price: null,
    pricePerUnit: 40000,
    images: ['property-art-vilhena.jpeg', 'illustrative-vilhena-pasture-1.png', 'illustrative-vilhena-pasture-2.png'],
    imageAlts: ['Arte de divulgação de área rural em Vilhena, Rondônia', 'Pastagem rural ilustrativa para referência; não é uma fotografia confirmada da propriedade', 'Paisagem rural ilustrativa para referência; não é uma fotografia confirmada da propriedade'],
    imageAlt: 'Arte de divulgação de área rural em Vilhena, Rondônia',
    summary: 'Área rural de 821 alqueires, com 412 alqueires abertos para pecuária.',
    description: 'Área rural em Vilhena com 821 alqueires, sendo 412 alqueires abertos para pecuária. Valor divulgado: R$ 40.000 por alqueire. Consulte o corretor sobre documentação e condições de negociação.',
    sourceNote: 'Dados extraídos da arte de divulgação enviada pelo cliente; preço por alqueire e disponibilidade precisam ser confirmados antes da negociação.',
    badge: 'OPORTUNIDADE RURAL',
  },
];

const mediaDimensions = {
  'property-art-rolim.jpeg': [720, 932],
  'property-art-vilhena.jpeg': [720, 912],
  'property-aerial-art.jpeg': [618, 1023],
  'brand-portrait-art.jpeg': [720, 932],
  'demo-property-31.png': [1448, 1086],
};
const imageDimensions = (file) => mediaDimensions[file] || (file.includes('complement-') ? [760, 760] : file.startsWith('illustrative-') ? [1536, 1024] : [720, 932]);
const imagePath = (property, file) => property.demo ? `/demo-media/${encodeURIComponent(file)}` : (/^(https?:|\/)/i.test(file) ? file : `${MEDIA}${encodeURIComponent(file)}`);

const $ = (selector, root = document) => root.querySelector(selector);
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
const areaText = (property) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(property.area)} ${property.areaUnit}`;
const DEMO_MODE = new URLSearchParams(location.search).get('demo') === '1';
const priceText = (property) => property.pricePerUnit ? `${money(property.pricePerUnit)} / alqueire` : property.price ? `${money(property.price)}${property.pricePeriod ? ` ${property.pricePeriod}` : ''}` : 'Consulte valores';
const pathFor = (property) => `/imovel/${property.slug}${DEMO_MODE && property.demo ? '?demo=1' : ''}`;
const propertyCode = (property) => property.code || (property.id === 'rolim-85-alqueires' ? 'JM-RO-085' : 'JM-VH-821');
const propertyBySlug = (slug) => properties.find((property) => property.slug === slug);
let favoriteCache = null;
let activeObservers = [];

function presentationText(value, property) {
  let text = String(value || '');
  if (!property?.demo) return text;
  return text
    .replace(/Este anúncio é fictício e existe somente para demonstração visual\.?/gi, '')
    .replace(/Nenhum dado representa imóvel disponível\.?/gi, '')
    .replace(/Conteúdo e fotografia fictícios para demonstração local; não constitui anúncio\.?/gi, '')
    .replace(/Registro, valor e fotografia fictícios para demonstração local; não constitui anúncio real\.?/gi, '')
    .replace(/Exemplo fictício para apresentação\s*[·-]?\s*/gi, '')
    .replace(/Exemplo de\s+/gi, '')
    .replace(/Imagem(?: ilustrativa| fictícia)? de demonstração:\s*/gi, '')
    .replace(/preço ilustrativo/gi, 'preço informado')
    .replace(/valor demonstrativo/gi, 'valor informado')
    .replace(/área ilustrativa/gi, 'área')
    .replace(/\bdemonstrativ[oa]s?\b/gi, '')
    .replace(/\bfictíci[oa]s?\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .trim()
    .replace(/^./u, (initial) => initial.toLocaleUpperCase('pt-BR'));
}

const salePriceOptions = [['', 'Todos os valores'], ['up-to-500000', 'Até R$ 500.000'], ['500000-1000000', 'De R$ 500.000 a R$ 1.000.000'], ['1000000-2000000', 'De R$ 1.000.000 a R$ 2.000.000'], ['2000000-5000000', 'De R$ 2.000.000 a R$ 5.000.000'], ['above-5000000', 'Acima de R$ 5.000.000'], ['custom', 'Valor personalizado']];
const rentPriceOptions = [['', 'Todos os valores'], ['rent-up-to-2000', 'Até R$ 2.000/mês'], ['rent-2000-5000', 'De R$ 2.000 a R$ 5.000/mês'], ['rent-5000-10000', 'De R$ 5.000 a R$ 10.000/mês'], ['rent-above-10000', 'Acima de R$ 10.000/mês'], ['custom', 'Valor mensal personalizado']];
const priceOptionsFor = (purpose) => purpose === 'locação' ? rentPriceOptions : salePriceOptions;
function syncPriceOptions(form, purpose, preserve = true) {
  const select = form?.elements.namedItem('faixaPreco');
  if (!select) return;
  const previous = preserve ? select.value : '';
  select.innerHTML = priceOptionsFor(purpose).map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
  select.value = priceOptionsFor(purpose).some(([value]) => value === previous) ? previous : '';
  select.setAttribute('aria-label', purpose === 'locação' ? 'Valores mensais de aluguel' : 'Valores do imóvel');
  const custom = select.value === 'custom';
  const customFields = form.querySelector('.price-custom-fields');
  if (customFields) customFields.querySelectorAll('input').forEach((input) => {
    input.disabled = !custom;
    input.step = purpose === 'locação' ? '100' : '10000';
    input.placeholder = purpose === 'locação' ? 'Mínimo mensal (R$)' : input.name === 'precoMin' ? 'Mínimo (R$)' : 'Máximo (R$)';
    input.setAttribute('aria-label', purpose === 'locação' ? (input.name === 'precoMin' ? 'Aluguel mensal mínimo em reais' : 'Aluguel mensal máximo em reais') : (input.name === 'precoMin' ? 'Valor mínimo em reais' : 'Valor máximo em reais'));
  });
  if (customFields) customFields.hidden = !custom;
}

function readFavorites() {
  if (favoriteCache) return favoriteCache;
  try {
    const stored = JSON.parse(localStorage.getItem('jaques:favoritos') || '[]');
    const validIds = new Set(properties.map((property) => property.id));
    favoriteCache = Array.isArray(stored)
      ? [...new Set(stored.filter((id) => typeof id === 'string' && validIds.has(id)))]
      : [];
  } catch {
    favoriteCache = [];
  }
  return favoriteCache;
}

function whatsAppLink(message) {
  return `https://wa.me/${CONTACT}?text=${encodeURIComponent(message)}`;
}

function withDemoQuery(path) {
  if (!DEMO_MODE) return path;
  const url = new URL(path, location.origin);
  url.searchParams.set('demo', '1');
  return `${url.pathname}${url.search}${url.hash}`;
}

function header() {
  const count = readFavorites().length;
  return `
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="/" aria-label="Jaques Marcondes — início">
          <img src="${MEDIA}brand-logo-transparent.png" alt="Logo oficial Jaques Marcondes Corretor" width="78" height="78">
        </a>
        <a class="header-phone" href="${phoneHref()}"><span class="phone-mark" aria-hidden="true">↗</span><span>${escapeHTML(displayPhone())}</span></a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="Abrir menu"><span></span><span></span></button>
        <nav class="main-nav" id="main-nav" aria-label="Navegação principal">
          <a href="/imoveis">Imóveis</a>
          <a href="/imoveis?tipo=rural">Rurais</a>
          <a href="/anunciar">Anuncie</a>
          <a class="favorite-nav" href="/favoritos">Salvos <span class="favorite-count">${count}</span></a>
          <a class="nav-cta" href="/contato">Fale com Jaques <span aria-hidden="true">↗</span></a>
        </nav>
      </div>
    </header>`;
}

function footer() {
  return `
    <footer class="site-footer">
      <div class="footer-top">
        <a class="footer-brand" href="/"><img src="${MEDIA}brand-logo-transparent.png" alt="Logo oficial Jaques Marcondes Corretor" width="76" height="76"></a>
        <p>Terras, negócios<br>e novos caminhos.</p>
        <div class="footer-links"><a href="/imoveis">Ver imóveis</a><a href="/anunciar">Anunciar propriedade</a><a href="/contato">Contato</a></div>
        <a class="footer-contact" href="${whatsAppLink('Olá, Jaques. Gostaria de conversar sobre imóveis rurais.')}">Conversar no WhatsApp <span aria-hidden="true">↗</span></a>
      </div>
      <div class="footer-bottom"><span>Jaques Marcondes · Corretor de imóveis</span><span>${escapeHTML(creciText())}</span><span>© ${new Date().getFullYear()} · Rondônia, Brasil</span></div>
    </footer>`;
}

function propertyCard(property, index = 0) {
  const favorite = readFavorites().includes(property.id);
  const [imageWidth, imageHeight] = imageDimensions(property.images[0]);
  const code = propertyCode(property);
  const isDemo = Boolean(property.demo);
  return `
    <article class="property-card" style="--card-order:${index}">
      <div class="property-photo-wrap">
        <a class="property-photo" href="${pathFor(property)}" aria-label="Ver ${escapeHTML(property.title)}">
          <img src="${imagePath(property, property.images[0])}" alt="${escapeHTML(presentationText(property.imageAlt, property))}" width="${imageWidth}" height="${imageHeight}" loading="lazy" decoding="async">
        </a>
        ${!isDemo && property.badge ? `<span class="property-badge">${escapeHTML(property.badge)}</span>` : ''}
      </div>
      <div class="property-card-body">
        <div class="property-card-utility"><span class="property-code">${escapeHTML(code)}</span><div class="property-tool-stack">${isDemo ? '<span class="demo-chip" aria-label="Identificador interno">DEMO</span>' : ''}<div class="property-actions"><button class="icon-button share-button" type="button" data-share="${property.id}" aria-label="Compartilhar ${escapeHTML(presentationText(property.title, property))}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.6 6.6-4.2m-6.6 7 6.6 4"/></svg></button><button class="icon-button save-button ${favorite ? 'is-saved' : ''}" type="button" data-favorite="${property.id}" aria-label="${favorite ? 'Remover dos' : 'Adicionar aos'} favoritos" aria-pressed="${favorite}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z"/></svg></button></div></div></div>
        <p class="property-location"><span aria-hidden="true">⌖</span> ${escapeHTML(property.city)} <span>· ${property.state}</span></p>
        <h3><a href="${pathFor(property)}">${escapeHTML(presentationText(property.title, property))}</a></h3>
        <p class="card-summary">${escapeHTML(presentationText(property.summary, property))}</p>
        <div class="card-price-row"><strong>${escapeHTML(priceText(property))}</strong><a class="contact-circle" href="${isDemo ? pathFor(property) : whatsAppLink(`Olá! Tenho interesse no imóvel ${code}. Gostaria de receber mais informações: ${new URL(pathFor(property), location.origin).href}`)}" ${isDemo ? "aria-label=\"Abrir prévia demonstrativa de ${escapeHTML(presentationText(property.title, property))}\"" : "target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"Perguntar no WhatsApp sobre ${escapeHTML(presentationText(property.title, property))}\""}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.7a8.4 8.4 0 0 1-12.4 7.4L3 20.4l1.3-4.9A8.4 8.4 0 1 1 20.5 11.7Z"/><path d="M9 8.3c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.7c.1.2.1.4-.1.6l-.5.6c-.2.2-.2.4-.1.6.5.9 1.2 1.6 2.1 2.1.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.4.5 0 .3-.2 1-.6 1.4-.4.4-1.1.6-1.5.6-.4 0-1.7-.3-3.2-1.6-1.7-1.5-2.2-2.9-2.4-3.4-.2-.5 0-1.7.4-2.3Z"/></svg></a></div>
        <div class="property-meta"><span><small>Área</small>${escapeHTML(areaText(property))}</span><span><small>Vagas</small>${property.parking ?? '—'}</span><span><small>Quartos</small>${property.bedrooms ?? '—'}</span></div>
      </div>
    </article>`;
}

function searchForm({ compact = false } = {}) {
  const types = [...new Set(properties.map((property) => property.type))];
  const cities = [...new Set(properties.map((property) => property.city))];
  const priceOptions = salePriceOptions;
  return `
    <form class="search-panel ${compact ? 'search-panel-compact' : ''}" data-search-form>
      <label class="search-field"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9 20v-6h6v6"/></svg>Tipo de imóvel</span><select name="tipo"><option value="">Todos os tipos de imóveis</option>${types.map((type) => `<option value="${escapeHTML(type.toLocaleLowerCase('pt-BR'))}">${escapeHTML(type)}</option>`).join('')}</select></label>
      <label class="search-field"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span class="visually-hidden">Localização</span></span><select name="cidade" aria-label="Selecione bairros ou cidades"><option value="">Selecione bairros ou cidades</option>${cities.map((city) => `<option value="${escapeHTML(city)}">${escapeHTML(city)}</option>`).join('')}</select></label>
      <div class="search-field price-picker"><select id="price-range-select" name="faixaPreco" aria-label="Valores do imóvel">${priceOptions.map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select><div class="price-custom-fields" hidden><input name="precoMin" type="number" min="0" step="10000" inputmode="numeric" placeholder="Mínimo (R$)" aria-label="Valor mínimo em reais"><input name="precoMax" type="number" min="0" step="10000" inputmode="numeric" placeholder="Máximo (R$)" aria-label="Valor máximo em reais"></div></div>
      ${compact ? `<label class="search-field"><span>Finalidade</span><select name="finalidade"><option value="">Todas as finalidades</option><option value="venda">Venda</option><option value="locação">Locação</option></select></label>` : `<input type="hidden" name="finalidade" value="venda">`}
      <button class="button button-dark search-submit" type="submit"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 5 5"/></svg> Buscar</button>
    </form>`;
}

function homePage() {
  return `
    <main id="conteudo">
      <section class="hero">
        <div class="hero-image" aria-hidden="true"></div>
        <div class="hero-video-wrap">
          <video class="hero-video" muted autoplay loop playsinline preload="auto" poster="${MEDIA}hero-rural-editorial.png" aria-label="Vídeo aéreo de uma propriedade rural com casa em Rondônia">
            <source src="${MEDIA}hero-design-original.mp4" type="video/mp4">
          </video>
        </div>
        <div class="hero-shade" aria-hidden="true"></div>
        <div class="hero-inner">
          <p class="hero-eyebrow"><span></span> ${escapeHTML(siteSettings.heroEyebrow || 'IMÓVEIS EM RONDÔNIA')}</p>
          <h1>${escapeHTML(siteSettings.heroTitle || 'O próximo capítulo começa em casa.')}</h1>
          <p class="hero-copy">${escapeHTML(siteSettings.heroCopy || 'Encontre imóveis em Rondônia com orientação próxima em cada etapa.')}</p>
          <div class="hero-search" aria-label="Busca de imóveis"><div class="search-intents" role="group" aria-label="Finalidade da busca"><button type="button" class="search-intent is-active" data-search-intent="venda" aria-pressed="true">Comprar</button><button type="button" class="search-intent" data-search-intent="locação" aria-pressed="false">Alugar</button></div>${searchForm()}<div class="hero-search-links"><a href="/imoveis">Explorar imóveis <span aria-hidden="true">↗</span></a><a href="/favoritos">Favoritos salvos <span aria-hidden="true">♡</span></a></div></div>
        </div>
        <div class="hero-side-note" aria-hidden="true"><span>${escapeHTML(creciText())}</span><i></i><span>IMÓVEIS RURAIS</span></div>
        <div class="hero-bottom"><span>01 — PRESENÇA LOCAL</span><span>RO · BRASIL</span></div>
      </section>

      <section class="featured-section content-wrap">
        <div class="section-heading"><div><p class="eyebrow">SELEÇÃO JAQUES MARCONDES</p><h2>Imóveis à venda</h2></div></div>
        <div class="featured-carousel"><button type="button" class="rail-arrow" data-rail-scroll="prev" aria-label="Imóveis anteriores">←</button><div class="property-rail ${properties.filter((property) => property.purpose === 'Venda').length >= 4 ? 'has-four-plus' : ''}" data-property-rail tabindex="0" aria-label="Imóveis à venda. Use as setas esquerda e direita para navegar.">${properties.filter((property) => property.purpose === 'Venda').map(propertyCard).join('')}</div><button type="button" class="rail-arrow" data-rail-scroll="next" aria-label="Próximos imóveis">→</button></div>
        <div class="rail-footer"><p>${properties.filter((property) => property.purpose === 'Venda').length} imóveis à venda</p><a class="text-link" href="/imoveis?finalidade=venda">Ver todos os imóveis à venda <span aria-hidden="true">↗</span></a></div>
      </section>

      <section class="advisor-editorial" aria-label="Apresentação do corretor Jaques Marcondes">
        <div class="advisor-editorial-inner content-wrap">
          <figure class="advisor-portrait"><img src="${MEDIA}brand-portrait-art.jpeg" alt="Peça de divulgação de Jaques Marcondes com texto de apresentação e retrato" loading="lazy"><figcaption>JAQUES MARCONDES · CORRETOR</figcaption></figure>
          <div class="advisor-editorial-copy"><p class="eyebrow">ATENDIMENTO DIRETO · ${escapeHTML(creciText())}</p><h2>Encontrar o lugar certo pede uma boa <em>conversa.</em></h2><p>Conheça as propriedades anunciadas em Rondônia e converse diretamente com Jaques para tirar dúvidas, confirmar os detalhes e entender as condições de cada oportunidade.</p><a class="button button-light" href="${whatsAppLink('Olá, Jaques. Gostaria de conversar sobre os imóveis anunciados em Rondônia.') }" target="_blank" rel="noopener noreferrer">Falar com Jaques <span aria-hidden="true">↗</span></a></div>
          <figure class="advisor-video"><video loop playsinline preload="none" controlslist="nodownload noplaybackrate noremoteplayback" disablepictureinpicture disableremoteplayback poster="${MEDIA}brand-portrait-art.jpeg" aria-label="Vídeo de apresentação do atendimento imobiliário"><source src="${MEDIA}atendimento-interior.mp4" type="video/mp4"></video><figcaption>CONVERSA DIRETA · RONDÔNIA</figcaption><div class="advisor-video-controls" role="group" aria-label="Controles do vídeo de apresentação"><button class="advisor-video-control" type="button" data-video-play aria-label="Reproduzir vídeo" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg></button><button class="advisor-video-control" type="button" data-video-sound aria-label="Ativar som" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="m17 9 4 6m0-6-4 6"/></svg></button></div><p class="advisor-video-status visually-hidden" aria-live="polite"></p></figure>
        </div>
      </section>

      <section class="announce-strip content-wrap"><div><p class="eyebrow">TEM UMA PROPRIEDADE?</p><h2>Vamos apresentar<br><em>seu próximo capítulo.</em></h2></div><a class="button button-dark" href="/anunciar">Anunciar propriedade <span aria-hidden="true">↗</span></a></section>
    </main>`;
}

function catalogPage() {
  const query = new URLSearchParams(location.search);
  const cities = [...new Set(properties.map((property) => property.city))];
  const types = [...new Set(properties.map((property) => property.type))];
  const purpose = query.get('finalidade') || '';
  const priceOptions = priceOptionsFor(purpose);
  const currentRange = query.get('precoMin') || query.get('precoMax') ? 'custom' : '';
  return `
    <main id="conteudo" class="page-shell">
      <section class="page-intro catalog-intro"><div><p class="eyebrow">PORTFÓLIO · RONDÔNIA</p><h1>${purpose === 'locação' ? 'Imóveis para alugar' : purpose === 'venda' ? 'Imóveis à venda' : 'Imóveis em Rondônia'}</h1></div><p>Explore as propriedades anunciadas e converse diretamente com Jaques para confirmar detalhes, condições e disponibilidade.</p></section>
      <div class="catalog-tools"><div class="catalog-tools-top"><div class="catalog-count"><strong id="result-count">${properties.length}</strong> imóveis encontrados</div></div><form class="catalog-filters" data-filter-form>
        <label><span>Localização</span><select name="cidade" aria-label="Selecione bairros ou cidades"><option value="">Selecione bairros ou cidades</option>${cities.map((city) => `<option value="${escapeHTML(city)}" ${query.get('cidade') === city ? 'selected' : ''}>${escapeHTML(city)}</option>`).join('')}</select></label>
        <label><span>Tipo</span><select name="tipo"><option value="">Todos os tipos</option>${types.map((type) => `<option value="${escapeHTML(type.toLocaleLowerCase('pt-BR'))}" ${query.get('tipo') === type.toLocaleLowerCase('pt-BR') ? 'selected' : ''}>${escapeHTML(type)}</option>`).join('')}</select></label>
        <label><span>Finalidade</span><select name="finalidade"><option value="">Todas</option><option value="venda" ${query.get('finalidade') === 'venda' ? 'selected' : ''}>Venda</option><option value="locação" ${query.get('finalidade') === 'locação' ? 'selected' : ''}>Locação</option></select></label>
        <label class="catalog-price-picker"><span class="visually-hidden">Valores</span><select name="faixaPreco" aria-label="${purpose === 'locação' ? 'Valores mensais de aluguel' : 'Valores do imóvel'}">${priceOptions.map(([value, label]) => `<option value="${value}" ${(currentRange === 'custom' ? value === 'custom' : !query.has('precoMin') && !query.has('precoMax') && value === '') ? 'selected' : ''}>${label}</option>`).join('')}</select><span class="price-custom-fields" ${currentRange === 'custom' ? '' : 'hidden'}><input name="precoMin" type="number" min="0" step="${purpose === 'locação' ? '100' : '10000'}" value="${escapeHTML(query.get('precoMin') || '')}" placeholder="${purpose === 'locação' ? 'Mínimo mensal' : 'Mínimo'}"><input name="precoMax" type="number" min="0" step="${purpose === 'locação' ? '100' : '10000'}" value="${escapeHTML(query.get('precoMax') || '')}" placeholder="${purpose === 'locação' ? 'Máximo mensal' : 'Máximo'}"></span></label><button class="filter-apply" type="submit">Aplicar filtros</button><button class="filter-reset" type="reset">Limpar filtros</button>
      </form><nav class="catalog-type-chips" aria-label="Filtrar por tipo"><a href="/imoveis" class="${!query.get('tipo') ? 'is-active' : ''}">Todos</a>${[...new Set(properties.map((property) => property.type))].map((type) => `<a href="/imoveis?tipo=${encodeURIComponent(type.toLocaleLowerCase('pt-BR'))}" class="${query.get('tipo') === type.toLocaleLowerCase('pt-BR') ? 'is-active' : ''}">${escapeHTML(type)}</a>`).join('')}</nav></div>
      <div class="property-grid catalog-grid" id="catalog-results">${properties.map(propertyCard).join('')}</div>
      <p class="catalog-disclaimer">Consulte o corretor para confirmar valores, disponibilidade e condições de negociação.</p>
    </main>`;
}

function detailPage(property) {
  const photos = property.images;
  return `
    <main id="conteudo" class="page-shell detail-shell">
      <nav class="breadcrumbs" aria-label="Trilha de navegação"><a href="/">Início</a><span>›</span><a href="/imoveis">Imóveis</a><span>›</span><span>${escapeHTML(property.city)}</span></nav>
      <section id="galeria" class="detail-gallery ${photos.length > 1 ? 'gallery-multiple' : ''}" aria-label="Galeria de fotos do imóvel">
        ${photos.map((photo, index) => { const [width, height] = imageDimensions(photo); const alt = property.imageAlts?.[index] || (index === 0 ? property.imageAlt : `Imagem complementar ilustrativa da propriedade em ${property.city}`); return `<button class="gallery-photo gallery-photo-${index + 1}" type="button" data-gallery-image="${imagePath(property, photo)}" aria-label="Ampliar foto ${index + 1} de ${photos.length}"><img src="${imagePath(property, photo)}" alt="${escapeHTML(presentationText(alt, property))}" width="${width}" height="${height}" ${index ? 'loading="lazy"' : ''} decoding="async"></button>`; }).join('')}
        <span class="gallery-count">${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'}</span>
        <div class="detail-gallery-actions"><button type="button" data-share="${property.id}" aria-label="Compartilhar este imóvel"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.6 6.6-4.2m-6.6 7 6.6 4"/></svg></button><button type="button" data-favorite="${property.id}" aria-label="${readFavorites().includes(property.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" aria-pressed="${readFavorites().includes(property.id)}">${readFavorites().includes(property.id) ? '♥' : '♡'}</button></div>
      </section>
      ${photos.length > 1 ? '<p class="gallery-disclosure">As imagens complementares são ilustrativas.</p>' : ''}
      <nav class="detail-quick-links" aria-label="Atalhos do imóvel"><a href="#galeria">▧ <span>${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'}</span></a><a href="#dados-imovel">⌖ <span>Dados da propriedade</span></a><a href="${whatsAppLink(`Olá, Jaques. Gostaria de consultar o imóvel ${property.title}.`)}" target="_blank" rel="noopener noreferrer">↗ <span>Falar com Jaques</span></a></nav>
      <div class="detail-layout">
        <div class="detail-main">
          <section class="detail-title-card"><span class="property-badge property-badge-light">${propertyCode(property)}</span><p class="property-location">⌖ ${escapeHTML(property.city)} · ${property.state}</p><h1>${escapeHTML(presentationText(property.title, property))}</h1><p>${escapeHTML(presentationText(property.summary, property))}</p></section>
          <section id="dados-imovel" class="detail-section"><p class="eyebrow">DETALHES DO IMÓVEL</p><h2>Características</h2><div class="detail-facts">${[['Área', areaText(property)], ['Quartos', property.bedrooms > 0 ? property.bedrooms : null], ['Banheiros', property.bathrooms > 0 ? property.bathrooms : null], ['Vagas', property.parking > 0 ? property.parking : null], ['Tipo', property.type], ['Finalidade', property.purpose], ['Município', `${property.city} · ${property.state}`]].filter(([, value]) => value !== null && value !== undefined && value !== '').map(([label, value]) => `<div><small>${escapeHTML(label)}</small><strong>${escapeHTML(value)}</strong></div>`).join('')}</div></section>
          ${property.id === 'vilhena-821-alqueires' ? '<section class="detail-section productive-note"><p class="eyebrow">PECUÁRIA</p><h2>Área aberta</h2><p class="productive-number"><strong>412</strong> alqueires</p></section>' : ''}
          <section class="detail-section"><p class="eyebrow">DESCRIÇÃO</p><h2>${escapeHTML(presentationText(property.title, property))}</h2><p class="detail-description">${escapeHTML(presentationText(property.description, property))}</p></section>
          <section class="detail-section location-section"><p class="eyebrow">LOCALIZAÇÃO</p><h2>${escapeHTML(property.city)} <em>· ${property.state}</em></h2></section>
        </div>
        <aside class="detail-aside"><div class="contact-card"><p class="eyebrow">VALOR / CONDIÇÃO</p><strong class="detail-price">${escapeHTML(priceText(property))}</strong><div class="contact-card-line"><span>Tipo</span><strong>${escapeHTML(property.type)}</strong></div><div class="contact-card-line"><span>Região</span><strong>${escapeHTML(property.city)} · ${property.state}</strong></div>${property.demo ? '<p class="demo-detail-note">Prévia ilustrativa: este imóvel não está disponível para negociação. Dados e condições são fictícios.</p>' : `<a class="button button-dark button-wide" href="${whatsAppLink(`Olá, Jaques. Tenho interesse em ${property.title}, em ${property.city}. Pode me passar as condições atualizadas?`)}" target="_blank" rel="noopener noreferrer">Consultar no WhatsApp <span aria-hidden="true">↗</span></a><a class="button button-whatsapp button-wide" href="${phoneHref()}">Ligar para ${escapeHTML(displayPhone())}</a><p class="contact-note">Condições e disponibilidade devem ser confirmadas com o corretor.</p>`}</div><button class="save-detail" type="button" data-favorite="${property.id}" aria-pressed="${readFavorites().includes(property.id)}">${readFavorites().includes(property.id) ? '♥ Salvo nos favoritos' : '♡ Salvar nos favoritos'}</button></aside>
      </div>
      <section class="related-section"><div class="section-heading"><div><p class="eyebrow">CONTINUE EXPLORANDO</p><h2>Outras oportunidades.</h2></div><a class="text-link" href="/imoveis">Ver portfólio <span aria-hidden="true">↗</span></a></div><div class="property-grid">${properties.filter((item) => item.id !== property.id).map(propertyCard).join('')}</div></section>
    </main>`;
}

function favoritesPage() {
  const favoriteIds = readFavorites();
  const saved = properties.filter((property) => favoriteIds.includes(property.id));
  return `<main id="conteudo" class="page-shell"><section class="page-intro"><div><p class="eyebrow">SUA SELEÇÃO</p><h1>Imóveis<br><em>salvos.</em></h1></div><p>Seus favoritos ficam armazenados apenas neste navegador.</p></section>${saved.length ? `<div class="property-grid">${saved.map(propertyCard).join('')}</div>` : `<div class="empty-state"><span>♡</span><h2>Seu espaço está aberto.</h2><p>Salve as propriedades que chamarem sua atenção para encontrá-las por aqui.</p><a class="button button-dark" href="/imoveis">Explorar imóveis <span aria-hidden="true">↗</span></a></div>`}</main>`;
}

function contactPage() {
  return `<main id="conteudo" class="page-shell contact-page"><section class="page-intro"><div><p class="eyebrow">CONVERSA DIRETA</p><h1>Vamos falar<br><em>de oportunidades.</em></h1></div><p>Entre em contato para consultar disponibilidade, condições e informações de uma propriedade.</p></section><div class="contact-page-grid"><div class="contact-portrait"><img src="${MEDIA}brand-portrait-art.jpeg" alt="Jaques Marcondes, corretor de imóveis" loading="lazy"><span>JAQUES MARCONDES · CORRETOR</span></div><div class="contact-options"><p class="eyebrow">ESCOLHA SEU CANAL</p><h2>Atendimento<br><em>com quem anuncia.</em></h2><a class="contact-option" href="${whatsAppLink('Olá, Jaques. Gostaria de conversar sobre imóveis em Rondônia.')}" target="_blank" rel="noopener noreferrer"><span>WhatsApp</span><strong>${escapeHTML(displayPhone())}</strong><i aria-hidden="true">↗</i></a><a class="contact-option" href="${phoneHref()}"><span>Telefone</span><strong>${escapeHTML(displayPhone())}</strong><i aria-hidden="true">↗</i></a><p class="source-note">Contato transcrito do material de divulgação fornecido.</p><p class="credential-line">Corretor de imóveis <strong>${escapeHTML(creciText())}</strong></p></div></div></main>`;
}

function announcePage() {
  return `<main id="conteudo" class="page-shell announce-page"><section class="page-intro"><div><p class="eyebrow">NOVOS NEGÓCIOS</p><h1>Apresente sua<br><em>propriedade.</em></h1></div><p>Conte o essencial sobre o imóvel. A mensagem será preparada para você revisar e enviar pelo WhatsApp.</p></section><div class="announce-layout"><div class="announce-points"><div><span>01</span><h2>Uma conversa<br><em>direta.</em></h2><p>Fale com o corretor responsável para entender os próximos passos.</p></div><div><span>02</span><h2>Informações<br><em>claras.</em></h2><p>Descreva o imóvel com os dados que você já possui. Não precisa preencher informações que ainda não confirmou.</p></div></div><form class="announce-form" data-contact-form><p class="eyebrow">DADOS INICIAIS</p><h2>Sobre o imóvel</h2><label>Seu nome<input name="nome" autocomplete="name" required maxlength="80" placeholder="Como podemos chamar você?"></label><div class="form-row"><label>Telefone / WhatsApp<input name="telefone" autocomplete="tel" required inputmode="tel" maxlength="24" placeholder="(00) 00000-0000"></label><label>Município<input name="cidade" required maxlength="80" placeholder="Ex.: Vilhena, RO"></label></div><label>Tipo de propriedade<select name="tipo" required><option value="">Selecione</option><option>Fazenda</option><option>Chácara</option><option>Sítio</option><option>Área rural</option><option>Outro</option></select></label><label>Conte um pouco mais<textarea name="detalhes" rows="4" maxlength="700" placeholder="Área, benfeitorias ou informações que deseja compartilhar"></textarea></label><label class="consent-check"><input type="checkbox" name="consentimento" required><span>Concordo em abrir uma conversa no WhatsApp com os dados acima. O site não salva este formulário.</span></label><button class="button button-dark button-wide" type="submit">Preparar mensagem <span aria-hidden="true">↗</span></button><p class="form-feedback" aria-live="polite"></p></form></div></main>`;
}

function notFoundPage() {
  return `<main id="conteudo" class="page-shell"><div class="empty-state"><span>404</span><h1>Esta página não está por aqui.</h1><a class="button button-dark" href="/imoveis">Ver propriedades <span aria-hidden="true">↗</span></a></div></main>`;
}

function render() {
  const segments = decodeURIComponent(location.pathname).split('/').filter(Boolean);
  let content;
  let title = 'Jaques Marcondes | Imóveis com propósito';
  if (!segments.length) content = homePage();
  else if (segments[0] === 'imoveis') { content = catalogPage(); title = 'Propriedades | Jaques Marcondes'; }
  else if (segments[0] === 'imovel') {
    const property = propertyBySlug(segments[1]);
    content = property ? detailPage(property) : notFoundPage();
    title = property ? `${property.title} | Jaques Marcondes` : 'Página não encontrada | Jaques Marcondes';
  }
  else if (segments[0] === 'favoritos') { content = favoritesPage(); title = 'Imóveis salvos | Jaques Marcondes'; }
  else if (segments[0] === 'contato') { content = contactPage(); title = 'Contato | Jaques Marcondes'; }
  else if (segments[0] === 'anunciar') { content = announcePage(); title = 'Anuncie sua propriedade | Jaques Marcondes'; }
  else { content = notFoundPage(); title = 'Página não encontrada | Jaques Marcondes'; }

  activeObservers.forEach((observer) => observer.disconnect());
  activeObservers = [];
  $('#app').querySelectorAll('video').forEach((video) => video.pause());
  const demoNotice = DEMO_MODE ? '<aside class="showcase-notice" role="note"><strong>Modo de demonstração · 31 imóveis ilustrativos</strong><span>Valores, descrições e imagens podem ser fictícios. Não são ofertas reais; confirme qualquer informação com o corretor.</span></aside>' : '';
  $('#app').innerHTML = `${header()}${demoNotice}${content}${footer()}<div class="toast" role="status" aria-live="polite"></div><dialog class="lightbox" aria-label="Imagem ampliada"><button class="lightbox-close" type="button" aria-label="Fechar imagem">×</button><img alt="Imagem ampliada da propriedade"></dialog>`;
  document.title = title;
  bindInteractions();
}

function notify(message) {
  const toast = $('.toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(notify.timeout);
  notify.timeout = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function navigate(path) {
  path = withDemoQuery(path);
  history.pushState({}, '', path);
  window.scrollTo({ top: 0, behavior: 'instant' });
  render();
}

function updateFavorite(id) {
  if (!properties.some((property) => property.id === id)) return;
  const favorites = readFavorites();
  const adding = !favorites.includes(id);
  const next = adding ? [...favorites, id] : favorites.filter((item) => item !== id);
  try {
    localStorage.setItem('jaques:favoritos', JSON.stringify(next));
    favoriteCache = next;
  } catch {
    notify('Não foi possível atualizar os favoritos neste navegador.');
    return;
  }
  if (location.pathname === '/favoritos') render();
  else {
    document.querySelectorAll(`[data-favorite="${CSS.escape(id)}"]`).forEach((button) => {
      button.setAttribute('aria-pressed', String(adding));
      button.setAttribute('aria-label', adding ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
      button.classList.toggle('is-saved', adding);
      if (button.classList.contains('save-detail')) button.textContent = adding ? '♥ Salvo nos favoritos' : '♡ Salvar nos favoritos';
      else button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z"/></svg>';
    });
    const count = $('.favorite-count');
    if (count) count.textContent = String(next.length);
  }
  notify(adding ? 'Imóvel salvo nos seus favoritos.' : 'Imóvel removido dos favoritos.');
}

function filterProperties(form) {
  const values = new FormData(form);
  const city = String(values.get('cidade') || '').toLocaleLowerCase('pt-BR').trim();
  const type = String(values.get('tipo') || '').toLocaleLowerCase('pt-BR').trim();
  const purpose = String(values.get('finalidade') || '').toLocaleLowerCase('pt-BR').trim();
  const priceMin = Number(values.get('precoMin') || 0);
  const priceMax = Number(values.get('precoMax') || 0);
  if (priceMin < 0 || priceMax < 0 || (priceMin && priceMax && priceMin > priceMax)) {
    const minInput = form.elements.namedItem('precoMin');
    const maxInput = form.elements.namedItem('precoMax');
    (priceMin && priceMax && priceMin > priceMax ? minInput : priceMin < 0 ? minInput : maxInput)?.setCustomValidity('Informe uma faixa de valores válida.');
    (priceMin && priceMax && priceMin > priceMax ? minInput : priceMin < 0 ? minInput : maxInput)?.reportValidity();
    return;
  }
  form.elements.namedItem('precoMin')?.setCustomValidity('');
  form.elements.namedItem('precoMax')?.setCustomValidity('');
  const filtered = properties.filter((property) => {
    const matchesCity = !city || property.city.toLocaleLowerCase('pt-BR').includes(city);
    const matchesType = !type || property.type.toLocaleLowerCase('pt-BR').includes(type) || (type === 'rural' && /rural|fazenda|área/i.test(property.type));
    const matchesPurpose = !purpose || property.purpose.toLocaleLowerCase('pt-BR') === purpose;
    const matchesPrice = (!priceMin && !priceMax) || (Number.isFinite(property.price) && property.price > 0 && (!priceMin || property.price >= priceMin) && (!priceMax || property.price <= priceMax));
    return matchesCity && matchesType && matchesPurpose && matchesPrice;
  });
  const result = $('#catalog-results');
  if (!result) return;
  result.innerHTML = filtered.length ? filtered.map(propertyCard).join('') : '<div class="empty-state filter-empty"><span>⌕</span><h2>Nenhuma oportunidade com esses filtros.</h2><p>Experimente limpar um filtro ou consultar diretamente com Jaques.</p><a class="button button-outline" href="/contato">Pedir ajuda na busca <span aria-hidden="true">↗</span></a></div>';
  $('#result-count').textContent = filtered.length;
}

function bindInteractions() {
  const menu = $('.menu-toggle');
  menu.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!expanded));
    menu.setAttribute('aria-label', expanded ? 'Abrir menu' : 'Fechar menu');
    $('#main-nav').classList.toggle('is-open', !expanded);
  });

  document.querySelectorAll('[data-search-intent]').forEach((button) => button.addEventListener('click', () => {
    const form = button.closest('[data-search-form]') || button.closest('.hero-search')?.querySelector('[data-search-form]');
    if (!form) return;
    const purpose = button.dataset.searchIntent;
    form.elements.namedItem('finalidade').value = purpose;
    syncPriceOptions(form, purpose, false);
    button.closest('.hero-search')?.querySelectorAll('[data-search-intent]').forEach((choice) => {
      const active = choice === button;
      choice.classList.toggle('is-active', active);
      choice.setAttribute('aria-pressed', String(active));
    });
  }));

  const heroVideo = $('.hero-video');
  const heroToggle = $('[data-hero-video-toggle]');
  if (heroVideo && heroToggle) {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const syncHeroToggle = () => {
      heroToggle.textContent = heroVideo.paused ? 'Reproduzir vídeo' : 'Pausar vídeo';
      heroToggle.setAttribute('aria-pressed', String(!heroVideo.paused));
    };
    if (reducedMotion) heroVideo.pause();
    else heroVideo.play().catch(() => {});
    heroToggle.addEventListener('click', () => heroVideo.paused ? heroVideo.play().catch(() => {}) : heroVideo.pause());
    heroVideo.addEventListener('play', syncHeroToggle);
    heroVideo.addEventListener('pause', syncHeroToggle);
    heroVideo.addEventListener('error', () => { heroToggle.hidden = true; });
    syncHeroToggle();
  }

    const sectionVideos = [...document.querySelectorAll('.advisor-video video')];
  sectionVideos.forEach((video) => {
    const figure = video.closest('.advisor-video');
    const playButton = figure.querySelector('[data-video-play]');
    const soundButton = figure.querySelector('[data-video-sound]');
    const status = figure.querySelector('.advisor-video-status');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let userPaused = false;
    let userEnabledSound = true;
    let playRequestPending = false;

    video.controls = false;
    video.muted = false;
    video.defaultMuted = false;
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true;
    video.setAttribute('controlslist', 'nodownload noplaybackrate noremoteplayback');

    const syncControls = () => {
      const playing = !video.paused && !video.ended;
      const audible = !video.muted && video.volume > 0;
      playButton.setAttribute('aria-label', playing ? 'Pausar vídeo' : 'Reproduzir vídeo');
      playButton.setAttribute('aria-pressed', String(playing));
      playButton.innerHTML = playing
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg>';
      soundButton.setAttribute('aria-label', audible ? 'Desativar som' : 'Ativar som');
      soundButton.setAttribute('aria-pressed', String(audible));
      soundButton.innerHTML = audible
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="M16 9a5 5 0 0 1 0 6m2-8a8 8 0 0 1 0 10"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="m17 9 4 6m0-6-4 6"/></svg>';
    };

    const playWithSoundFallback = async () => {
      if (userPaused || playRequestPending || reducedMotion) return;
      playRequestPending = true;
      status.textContent = '';
      if (userEnabledSound) {
        video.muted = false;
        try {
          await video.play();
          if (video.muted || video.volume === 0) {
            status.textContent = 'O navegador iniciou o vídeo sem som. Toque em Ativar som para ouvir.';
          }
        } catch {
          video.muted = true;
          try {
            await video.play();
            status.textContent = 'O navegador iniciou o vídeo sem som. Toque em Ativar som para ouvir.';
          } catch {
            status.textContent = 'Não foi possível iniciar o vídeo. Use o botão reproduzir para tentar novamente.';
          }
        }
      } else {
        video.muted = true;
        try {
          await video.play();
        } catch {
          status.textContent = 'Não foi possível iniciar o vídeo. Use o botão reproduzir para tentar novamente.';
        }
      }
      playRequestPending = false;
      syncControls();
    };

    playButton.addEventListener('click', async () => {
      if (!video.paused) {
        userPaused = true;
        video.pause();
        status.textContent = 'Vídeo pausado.';
      } else {
        userPaused = false;
        await playWithSoundFallback();
      }
      syncControls();
    });

    soundButton.addEventListener('click', async () => {
      if (!video.muted && video.volume > 0) {
        userEnabledSound = false;
        video.muted = true;
        status.textContent = 'Som desativado.';
      } else {
        userEnabledSound = true;
        video.muted = false;
        if (video.paused && !userPaused && !reducedMotion) {
          await playWithSoundFallback();
        } else {
          status.textContent = 'Som ativado.';
        }
      }
      syncControls();
    });

    video.addEventListener('play', () => {
      sectionVideos.filter((other) => other !== video).forEach((other) => other.pause());
      if (heroVideo) heroVideo.pause();
      status.textContent = '';
      syncControls();
    });
    ['pause', 'volumechange', 'ended'].forEach((eventName) => video.addEventListener(eventName, syncControls));
    video.addEventListener('error', () => {
      status.textContent = 'O vídeo não pôde ser carregado. Tente novamente mais tarde.';
      playButton.disabled = true;
      soundButton.disabled = true;
    });

    const section = video.closest('.advisor-editorial');
    if ('IntersectionObserver' in window && section) {
      const videoObserver = new IntersectionObserver((entries) => entries.forEach(({ isIntersecting }) => {
        if (isIntersecting) playWithSoundFallback();
        else video.pause();
      }), { threshold: .2, rootMargin: '-8% 0px -8% 0px' });
      activeObservers.push(videoObserver);
      videoObserver.observe(section);
    }
    syncControls();
  });
  document.querySelectorAll('a[href^="/"]').forEach((link) => link.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const destination = new URL(link.href);
    if (destination.origin !== location.origin) return;
    event.preventDefault();
    navigate(`${destination.pathname}${destination.search}${destination.hash}`);
  }));

  document.querySelectorAll('[data-search-form]').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = new FormData(form);
    const params = new URLSearchParams();
    const range = String(values.get('faixaPreco') || '');
    const purpose = String(values.get('finalidade') || 'venda');
    const ranges = purpose === 'locação'
      ? { 'rent-up-to-2000': [0, 2000], 'rent-2000-5000': [2001, 5000], 'rent-5000-10000': [5001, 10000], 'rent-above-10000': [10001, ''] }
      : { 'up-to-500000': [0, 500000], '500000-1000000': [500001, 1000000], '1000000-2000000': [1000001, 2000000], '2000000-5000000': [2000001, 5000000], 'above-5000000': [5000001, ''] };
    for (const key of ['tipo', 'cidade', 'finalidade']) if (values.get(key)) params.set(key, String(values.get(key)));
    if (ranges[range]) {
      const [minimum, maximum] = ranges[range];
      if (minimum) params.set('precoMin', String(minimum));
      if (maximum) params.set('precoMax', String(maximum));
    } else if (range === 'custom') {
      const minimum = Number(values.get('precoMin') || 0);
      const maximum = Number(values.get('precoMax') || 0);
      if ((minimum && minimum < 0) || (maximum && maximum < 0) || (minimum && maximum && minimum > maximum)) {
        form.elements.namedItem('precoMin')?.setCustomValidity('O valor mínimo não pode superar o máximo e ambos devem ser positivos.');
        form.elements.namedItem('precoMin')?.reportValidity();
        return;
      }
      if (minimum) params.set('precoMin', String(minimum));
      if (maximum) params.set('precoMax', String(maximum));
    }
    navigate(`/imoveis${params.size ? `?${params}` : ''}`);
  }));

  document.querySelectorAll('.price-picker,.catalog-price-picker').forEach((picker) => {
    const select = $('select[name="faixaPreco"]', picker);
    const customFields = $('.price-custom-fields', picker);
    const sync = () => {
      const custom = select?.value === 'custom';
      if (customFields) customFields.hidden = !custom;
      customFields?.querySelectorAll('input').forEach((input) => { input.disabled = !custom; });
    };
    select?.addEventListener('change', sync);
    sync();
  });

  const propertyRail = $('[data-property-rail]');
  const carousel = propertyRail?.closest('.featured-carousel');
  const railButtons = [...(carousel?.querySelectorAll('[data-rail-scroll]') || [])];
  const syncRailButtons = () => railButtons.forEach((button) => {
    const overflow = propertyRail && propertyRail.scrollWidth > propertyRail.clientWidth + 2;
    button.disabled = !overflow || (button.dataset.railScroll === 'prev' ? propertyRail.scrollLeft <= 2 : propertyRail.scrollLeft + propertyRail.clientWidth >= propertyRail.scrollWidth - 2);
  });
  syncRailButtons();
  propertyRail?.addEventListener('scroll', syncRailButtons, { passive: true });
  if (propertyRail && 'ResizeObserver' in window) {
    const railResizeObserver = new ResizeObserver(syncRailButtons);
    railResizeObserver.observe(propertyRail);
    activeObservers.push(railResizeObserver);
  }
  railButtons.forEach((button) => button.addEventListener('click', () => {
    const rail = button.closest('.featured-carousel')?.querySelector('[data-property-rail]');
    const card = $('.property-card', rail);
    if (rail && card) {
      const styles = getComputedStyle(rail);
      const gap = parseFloat(styles.columnGap || styles.gap || '0');
      rail.scrollBy({ left: (card.getBoundingClientRect().width + gap) * (button.dataset.railScroll === 'next' ? 1 : -1), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }));
  $('[data-property-rail]')?.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const card = $('.property-card', event.currentTarget);
    if (card) {
      const rail = event.currentTarget;
      const gap = parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap || '0');
      rail.scrollBy({ left: (card.getBoundingClientRect().width + gap) * (event.key === 'ArrowRight' ? 1 : -1), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  });

  const filterForm = $('[data-filter-form]');
  if (filterForm) {
    syncPriceOptions(filterForm, filterForm.elements.namedItem('finalidade').value, true);
    filterForm.elements.namedItem('finalidade')?.addEventListener('change', (event) => syncPriceOptions(filterForm, event.currentTarget.value, false));
    filterForm.addEventListener('change', () => filterProperties(filterForm));
    filterForm.addEventListener('reset', (event) => { event.preventDefault(); navigate('/imoveis'); });
    filterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = new FormData(filterForm);
      const params = new URLSearchParams();
      for (const key of ['cidade', 'tipo', 'finalidade']) if (values.get(key)) params.set(key, String(values.get(key)));
      const selectedRange = String(values.get('faixaPreco') || '');
      const purpose = String(values.get('finalidade') || '');
      const ranges = purpose === 'locação'
        ? { 'rent-up-to-2000': [0, 2000], 'rent-2000-5000': [2001, 5000], 'rent-5000-10000': [5001, 10000], 'rent-above-10000': [10001, ''] }
        : { 'up-to-500000': [0, 500000], '500000-1000000': [500001, 1000000], '1000000-2000000': [1000001, 2000000], '2000000-5000000': [2000001, 5000000], 'above-5000000': [5000001, ''] };
      if (ranges[selectedRange]) {
        const [minimum, maximum] = ranges[selectedRange];
        if (minimum) params.set('precoMin', String(minimum));
        if (maximum) params.set('precoMax', String(maximum));
      } else if (selectedRange === 'custom') {
        const minimum = Number(values.get('precoMin') || 0);
        const maximum = Number(values.get('precoMax') || 0);
        if (minimum < 0 || maximum < 0 || (minimum && maximum && minimum > maximum)) {
          filterForm.elements.namedItem('precoMin')?.setCustomValidity('Informe valores positivos e um mínimo menor ou igual ao máximo.');
          filterForm.elements.namedItem('precoMin')?.reportValidity();
          return;
        }
        filterForm.elements.namedItem('precoMin')?.setCustomValidity('');
        if (minimum) params.set('precoMin', String(minimum));
        if (maximum) params.set('precoMax', String(maximum));
      }
      navigate(`/imoveis${params.size ? `?${params}` : ''}`);
    });
    for (const [key, value] of new URLSearchParams(location.search)) {
      const field = filterForm.elements.namedItem(key);
      if (field) field.value = key === 'cidade' ? value : value.toLocaleLowerCase('pt-BR');
    }
    filterProperties(filterForm);
  }

  document.querySelectorAll('[data-gallery-image]').forEach((button) => button.addEventListener('click', () => {
    const dialog = $('.lightbox');
    const image = $('img', dialog);
    image.src = button.dataset.galleryImage;
    image.alt = $('img', button).alt;
    dialog.showModal();
  }));
  $('.lightbox-close').addEventListener('click', () => $('.lightbox').close());
  $('.lightbox').addEventListener('click', (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });

  const contactForm = $('[data-contact-form]');
  if (contactForm) contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    const values = new FormData(contactForm);
    const details = String(values.get('detalhes') || '').trim();
    const message = [
      `Olá, Jaques. Meu nome é ${String(values.get('nome')).trim()}.`,
      `Tenho uma propriedade do tipo ${String(values.get('tipo'))} em ${String(values.get('cidade')).trim()}.`,
      `Meu telefone/WhatsApp: ${String(values.get('telefone')).trim()}.`,
      details ? `Detalhes: ${details}` : '',
    ].filter(Boolean).join('\n');
    window.open(whatsAppLink(message), '_blank', 'noopener,noreferrer');
    $('.form-feedback').textContent = 'A conversa foi preparada em uma nova aba. Revise os dados antes de enviar.';
  });
}

function handleAppClick(event) {
  const share = event.target.closest('[data-share]');
  if (share) {
    const property = properties.find((item) => item.id === share.dataset.share);
    if (!property) return;
    const url = new URL(pathFor(property), location.origin).href;
    const shareData = { title: property.title, text: `${property.title} · ${property.city} – ${property.state}`, url };
    if (navigator.share) navigator.share(shareData).catch((error) => { if (error.name !== 'AbortError') copyShareLink(url); });
    else copyShareLink(url);
    return;
  }
  const button = event.target.closest('[data-favorite]');
  if (!button || !$('#app').contains(button)) return;
  event.preventDefault();
  event.stopPropagation();
  updateFavorite(button.dataset.favorite);
}

async function copyShareLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    notify('Link do imóvel copiado.');
  } catch {
    const field = document.createElement('textarea');
    field.value = url;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    document.execCommand('copy');
    field.remove();
    notify('Link do imóvel copiado.');
  }
}

$('#app').addEventListener('click', handleAppClick);
window.addEventListener('popstate', render);
window.addEventListener('storage', (event) => {
  if (event.key !== 'jaques:favoritos' && event.key !== null) return;
  favoriteCache = null;
  render();
});
async function startApp() {
  try {
    const response = await fetch('/api/admin?action=public', { cache: 'no-store' });
    if (!response.ok) throw new Error('Remote catalog unavailable');
    const publicData = await response.json();
    if (Array.isArray(publicData.properties)) properties = publicData.properties;
    siteSettings = publicData.settings || {};
    if (siteSettings.whatsapp) CONTACT = String(siteSettings.whatsapp).replace(/\D/g, '');
  } catch {
    // Keep the checked-in public listings available if the remote catalog is temporarily unavailable.
  }
  if (DEMO_MODE) {
    try {
      const response = await fetch('/demo-properties.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Demo data is unavailable');
      const demoProperties = await response.json();
      if (Array.isArray(demoProperties) && demoProperties.length >= 30) properties.push(...demoProperties.filter((demo) => !properties.some((property) => property.id === demo.id)));
    } catch {
      document.body.insertAdjacentHTML('afterbegin', '<p class="demo-error">A demonstração local não está disponível neste servidor.</p>');
    }
  }
  render();
}
startApp();
