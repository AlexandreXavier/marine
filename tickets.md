# Tickets: VELA Marine v1

Recriação do MarineTraffic (mapa AIS live da costa ibérica + detalhe de navio + diretório) em Next.js + Convex + Clerk. Fonte: `specs/vela-marine-v1.md`.

Trabalha a **fronteira**: qualquer ticket cujos bloqueadores estejam todos concluídos. Depois do ticket 2, os tickets 3, 4 e 7 podem andar em paralelo.

## ✅ 1. Esqueleto andante: scaffold + deploy + auth — CONCLUÍDO 2026-07-12

Produção: https://vela-marine.vercel.app · Convex prod: elegant-seal-603 · Verificado em browser (MADMAX + modal Clerk).

**What to build:** O caminho completo stack→produção a funcionar com o mínimo de produto: um visitante abre o site em produção, vê uma página VELA Marine com um navio seed (MADMAX) vindo do Convex, e consegue criar conta/iniciar sessão com Clerk. Repo git inicializado na raiz.

**Blocked by:** None — can start immediately.

- [ ] `git init` feito; Next.js (App Router) + Convex + Clerk instalados e ligados (incl. `auth.config.ts` do Convex a aceitar tokens Clerk)
- [ ] Tabela `vessels` com o MADMAX como seed, mostrada numa página via query reativa
- [ ] Sign-up/sign-in Clerk funcionais; a página mostra o estado da sessão
- [ ] Deployado: Vercel + Convex production, acessível por URL público
- [ ] Interface em PT-PT desde já; branding VELA Marine básico (nome, cores da paleta capturada)

## 2. Ingestão AIS real

**What to build:** Navios reais do Atlântico ibérico a entrar no sistema continuamente. Um worker Node liga ao AISStream.io (bounding box Galiza→Gibraltar), normaliza as mensagens AIS e escreve em lotes no Convex; uma página de debug mostra a contagem e a lista de navios a atualizar ao vivo.

**Blocked by:** 1. Esqueleto andante.

- [ ] Função pura de normalização AIS (position reports 1/2/3/18/19 + static data 5/24 → payload de ingestão) com unit tests, incl. mensagens malformadas descartadas sem erro
- [ ] Mutation de ingestão em lote protegida por chave partilhada; cria/atualiza `vessels` in-place por MMSI (testes convex-test: posição atualiza, static data enriquece sem apagar posição)
- [ ] Worker com reconexão automática (backoff) quando a ligação cai
- [ ] Bandeira derivada dos dígitos MID do MMSI
- [ ] Página de debug com navios reais a aparecer/atualizar em tempo real, corrida contra o feed live

## 3. Mapa live

**What to build:** A página principal: mapa MapLibre full-screen onde um visitante vê os navios reais a mover-se em tempo real, coloridos por tipo e orientados pelo rumo, com popup ao clicar (nome, tipo, velocidade, rumo) e link para a página de detalhe. Inclui o shell da app: sidebar escura de ícones e barra de pesquisa no topo (visual, fiel à captura).

**Blocked by:** 2. Ingestão AIS real.

- [ ] Mapa MapLibre GL full-screen com tiles gratuitos, centrado na costa ibérica
- [ ] Marcadores alimentados por query reativa Convex — movem-se sem refresh
- [ ] Marcadores rodados por COG e coloridos por categoria de tipo de navio
- [ ] Popup ao clicar com nome, tipo, velocidade, rumo e link para `/vessel/<mmsi>`
- [ ] Shell da app: sidebar de ícones (`#1B252E`) + barra de pesquisa no topo, layout responsivo utilizável em telemóvel

## 4. Página de detalhe do navio

**What to build:** Um visitante abre a rota de um navio (por MMSI) e vê o retrato completo: última informação AIS (posição, SOG, COG, estado de navegação, destino, "recebido há X min"), características (MMSI, call sign, bandeira, tipo, dimensões) e silhueta placeholder por tipo — em layout de cards fiel à captura do MADMAX. O link do popup do mapa passa a aterrar aqui.

**Blocked by:** 2. Ingestão AIS real.

- [ ] Rota por MMSI com dados reativos; navios desconhecidos mostram estado vazio digno
- [ ] Card "Última informação AIS" com frescura da posição ("recebido há X minutos")
- [ ] Card "Características" com MMSI, call sign, bandeira (do MID), tipo e dimensões quando conhecidas
- [ ] Silhueta placeholder por categoria de tipo (sem fotos no v1)
- [ ] Layout de cards/tabs fiel aos screenshots capturados, em PT-PT

## 5. Histórico 48h + diretório pesquisável

**What to build:** As duas superfícies públicas sobre os dados acumulados: (a) na página de detalhe, um mini-mapa com o traçado das últimas 48h do navio; (b) uma página de diretório onde o visitante pesquisa navios por nome e filtra por tipo, com linhas que navegam para o detalhe. A barra de pesquisa do topo fica funcional.

**Blocked by:** 4. Página de detalhe do navio.

- [ ] Ingestão grava ponto em `positions` no máximo a cada ~5 min por navio (teste convex-test do intervalo de amostragem)
- [ ] Cron apaga posições >48h e preserva as recentes (teste de retenção)
- [ ] Mini-mapa no detalhe com polyline do traçado
- [ ] Diretório com pesquisa por nome (search index) e filtro por tipo; mostra nome, bandeira, tipo, MMSI e última posição
- [ ] Barra de pesquisa do topo devolve resultados e navega para o detalhe

## 6. A minha frota + notas

**What to build:** O que o login desbloqueia: na página de detalhe, um utilizador autenticado adiciona/remove o navio da sua frota e escreve notas privadas; uma vista "A minha frota" lista os seus navios com o estado atual de cada um. Visitantes anónimos veem os botões mas são convidados a iniciar sessão.

**Blocked by:** 4. Página de detalhe do navio.

- [ ] Adicionar/remover da frota a partir do detalhe; estado refletido imediatamente
- [ ] Notas privadas por navio: criar, editar, apagar
- [ ] Vista "A minha frota" com estado atual (posição, destino, frescura) de cada navio
- [ ] Testes de autorização convex-test: sem sessão as mutations falham; um utilizador nunca vê frota/notas de outro
- [ ] Anónimo que clica nos botões é levado ao sign-in do Clerk

## 7. Worker sempre ligado

**What to build:** O site em produção fica vivo 24/7: o worker de ingestão corre num serviço gerido (Railway ou Fly.io) com a API key do AISStream em env var, reconecta sozinho e sobrevive a restarts — sem depender da máquina local.

**Blocked by:** 2. Ingestão AIS real.

- [ ] Worker deployado (Railway/Fly.io) e a escrever no Convex production
- [ ] Keys (AISStream, chave de ingestão Convex) só em env vars do serviço
- [ ] Reconexão/restart automático verificado (matar o processo → dados retomam sozinhos)
- [ ] Site de produção mostra dados frescos com a máquina local desligada
