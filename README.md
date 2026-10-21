# Jaques Marcondes — imóveis rurais em Rondônia

Site local de apresentação e consulta de imóveis. A interface usa a identidade do Jaques Marcondes e referências de navegação imobiliária fornecidas pelo cliente. Não usa marca ou imóveis da Alfa.

## Requisitos e execução

- Node.js 22 ou mais recente.
- Sem dependências npm.
- Inicie com `node server.mjs` e acesse <http://127.0.0.1:4173>.
- O servidor escuta em `127.0.0.1`; `HOST` e `PORT` podem ser definidos no ambiente.
- A demonstração isolada com 31 exemplos fictícios pode ser aberta em `/?demo=1` ou `/imoveis?demo=1`. Ela só é servida pelo host local; os registros e as imagens de demonstração ficam fora de `public/`, e os anúncios são identificados como demonstração.

## Páginas e recursos locais

- Início, catálogo com filtros combináveis, páginas individuais, favoritos, contato e formulário para anunciar.
- Favoritos são armazenados no `localStorage` deste navegador.
- Os códigos `JM-RO-085` e `JM-VH-821` são referências estáticas dos dois registros disponíveis nesta versão local; não estão conectados a um painel administrativo ou banco de dados.
- Os formulários preparam mensagens contextualizadas no WhatsApp; os dados não são enviados nem salvos pelo site.
- A galeria da página individual abre a imagem em uma caixa de visualização.
- `public/media/` mantém a marca, as imagens fornecidas e os vídeos originais do cliente. O hero usa exclusivamente o vídeo aéreo `hero-rural.mp4`; a apresentação do corretor usa `atendimento-interior.mp4`.
- A vitrine horizontal tem navegação independente e não prende a rolagem vertical. O vídeo do hero é pausável, os vídeos fora da área visível são pausados e a preferência por movimento reduzido é respeitada. O servidor local aceita solicitações de faixa de bytes para reprodução e busca nos vídeos.

## Dados de imóveis e limites

O site normal apresenta somente dois anúncios derivados das artes enviadas: 8,5 alqueires em Rolim de Moura; e 821 alqueires em Vilhena, com 412 alqueires de abertura na pecuária e R$ 40.000 por alqueire conforme a arte. `?demo=1` carrega, somente no servidor local, 31 registros explicitamente fictícios para revisar catálogo, filtros e páginas, incluindo casa para aluguel com preço mensal; eles não são publicados nem inseridos no SQLite. Cada anúncio tem uma foto principal e dois complementos ilustrativos associados localmente em `data/demo-media/`. Nos dois anúncios reais, as fotos principais fornecidas foram preservadas e as imagens complementares geradas estão identificadas como ilustrativas. Preço, disponibilidade, documentação, localização precisa e características atuais dos dois anúncios existentes precisam ser confirmados pelo corretor. Não há coordenadas verificadas, portanto não há mapa ou marcador.

O contato `(69) 98482-3333` e o registro `CRECI-RO 5610` foram transcritos do material fornecido. A atividade do número e a autorização de publicação devem ser confirmadas antes de publicar o site.

## Banco e serviços

O SQLite anterior está preservado em `data/`, mas não é conectado a esta versão. Não há serviço de banco remoto, geocodificação, armazenamento remoto ou painel administrativo configurado. O contato abre o domínio `wa.me` com o número informado no material; a entrega da mensagem depende do WhatsApp e do navegador do visitante.

## Antes de publicar

1. Confirmar os dados, valores, disponibilidade, documentação, município e fotos de cada imóvel.
2. Confirmar o telefone/WhatsApp e a autorização para exibição do CRECI e da marca.
3. Fornecer política de privacidade e canal de contato oficial, se necessário.
4. Definir domínio, hospedagem HTTPS, monitoramento e processo de atualização.
5. Caso seja necessário administrar anúncios pelo site, escolher e configurar autenticação, armazenamento e banco para a nova implementação.

## Hospedagem estática na Vercel

`vercel.json` publica o conteúdo de `public/` sem etapa de build e envia rotas sem arquivo correspondente para `index.html`, para que páginas como `/imoveis` e `/imovel/<slug>` abram diretamente. Esta configuração cobre somente o site público. Esta versão não contém rota `/admin`, autenticação, API administrativa ou persistência de alterações; não configure credenciais administrativas até essa funcionalidade existir.

Os registros e arquivos da demonstração local continuam fora do diretório publicado. O modo `?demo=1` depende de endpoints que existem apenas no `server.mjs` local e não está disponível no deploy estático.

## Verificações locais

```powershell
node --check server.mjs
node --check public/app.js
node server.mjs
```

Não há build, lint ou suíte automatizada configurados neste scaffold. Os MP4 originais somam aproximadamente 28 MB; o hero tem cerca de 3,5 MB. Os vídeos da seção não são pré-carregados em conjunto.
