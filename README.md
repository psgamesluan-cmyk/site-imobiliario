# Jaques Marcondes — imóveis rurais em Rondônia

Site de apresentação e consulta de imóveis com a identidade do corretor Jaques Marcondes.

## Execução local

- Requer Node.js 22 ou mais recente; não usa dependências npm.
- Execute `node server.mjs` e abra <http://127.0.0.1:4173>.
- O painel administrativo local fica em <http://127.0.0.1:4173/admin>.
- A demonstração isolada com 31 registros fictícios pode ser aberta em `/?demo=1` ou `/imoveis?demo=1`; existe apenas no servidor local.
- `HOST` e `PORT` podem ser definidos no ambiente.

## Páginas e conteúdo

- Início, catálogo com filtros combináveis, páginas individuais, favoritos, contato e formulário para anunciar.
- Favoritos ficam no `localStorage` deste navegador. Formulários de contato preparam uma mensagem contextualizada para WhatsApp.
- Os anúncios iniciais `JM-RO-085` e `JM-VH-821` são derivados das artes fornecidas. Preço, disponibilidade, documentação, localização precisa e características atuais ainda devem ser confirmados pelo corretor.
- Não há coordenadas verificadas, portanto o site não exibe mapa ou marcador.
- `public/media/` mantém a marca, imagens fornecidas e vídeos originais do cliente. O hero usa `hero-rural.mp4`; a apresentação do corretor usa `atendimento-interior.mp4`.
- Os anúncios fictícios do modo local são identificados como demonstração e não são publicados no catálogo público.

## Painel administrativo

`/admin` permite criar, editar, publicar, retirar e excluir anúncios, enviar imagens e atualizar a chamada principal e dados de contato. Rascunhos ficam privados; o catálogo público lê apenas anúncios publicados. A senha demonstrativa foi definida pelo proprietário e não deve ser incluída neste repositório nem em documentação pública.

Os registros e configurações são persistidos no Supabase. A Edge Function `site-admin` contém as operações administrativas e mantém a chave privilegiada no servidor. O navegador usa `api/admin.js` na Vercel ou o proxy equivalente em `server.mjs` local; a sessão é transportada em cookie HttpOnly. As tentativas de login têm limitação. As imagens carregadas pelo painel ficam no bucket Supabase `property-images`.

O SQLite anterior permanece preservado em `data/` e não alimenta o painel atual. O contato abre o domínio `wa.me`; o envio depende do WhatsApp e do navegador do visitante.

## Vercel

`vercel.json` publica `public/` sem etapa de build, reescreve `/admin` para o painel e mantém rotas públicas como `/imoveis` e `/imovel/<slug>`. A função serverless `api/admin.js` encaminha as operações para o Supabase. O modo `?demo=1` depende exclusivamente de endpoints do `server.mjs` e não é publicado.

Antes de divulgar, confirme os dados, valores, disponibilidade, telefone e autorização para exibir CRECI e marca, e verifique o deploy HTTPS na equipe Vercel desejada.

## Verificações

```powershell
node --check server.mjs
node --check public/app.js
node --check public/admin.js
node --check api/admin.js
node server.mjs
```
