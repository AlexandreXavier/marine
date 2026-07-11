---
title: "VELA Marine v1 — recriação do MarineTraffic (Next.js + Convex + Clerk)"
labels: [ready-for-agent]
status: ready
created: 2026-07-11
---

# VELA Marine v1

## Problem Statement

Quero um site de tracking de navios ao estilo MarineTraffic, mas meu: construído num stack moderno que controlo (Next.js, Convex, Clerk), com dados AIS reais, focado na costa ibérica. O MarineTraffic real esconde dados essenciais atrás de paywalls e login (os diretórios de dados redirecionam para SSO da Kpler), e não me serve como base para experimentação ou produto próprio. Tenho uma captura completa do site original em `marinetraffic-capture/` (conteúdo, HTML, design system extraído, screenshots full-page) que serve de referência funcional e visual.

## Solution

**VELA Marine** — uma aplicação web pública com três páginas nucleares que replicam o layout e os padrões de UI do MarineTraffic (sidebar de ícones, cards, tabs, mapa full-screen, paleta náutica azul) sob marca própria e interface em português (PT-PT):

1. **Mapa live** full-screen com navios reais do Atlântico ibérico (Galiza → Gibraltar), atualizados em tempo real via feed AIS do AISStream.io, coloridos por tipo de navio.
2. **Página de detalhe de navio** com viagem atual, última informação AIS, características do navio e traçado das últimas 48h.
3. **Diretório de navios** pesquisável.

Utilizadores autenticados (Clerk) podem adicionar navios à sua frota pessoal ("A minha frota") e escrever notas privadas por navio. Tudo o resto é público — sem paywall. Deploy em produção desde o dia 1.

## User Stories

1. Como visitante, quero ver um mapa full-screen com as posições em tempo real dos navios na costa ibérica, para perceber o tráfego marítimo à minha volta.
2. Como visitante, quero que os marcadores dos navios estejam orientados segundo o rumo (COG) e coloridos por tipo de navio, para distinguir cargueiros, tanques, pesca e recreio num relance.
3. Como visitante, quero que o mapa se atualize automaticamente sem refresh (reatividade Convex), para ver os navios a mover-se.
4. Como visitante, quero fazer zoom e pan no mapa livremente, para explorar zonas específicas da costa.
5. Como visitante, quero clicar num navio no mapa e ver um popup com nome, tipo, velocidade e rumo, para obter contexto imediato sem sair do mapa.
6. Como visitante, quero navegar do popup para a página de detalhe do navio, para ver toda a informação disponível.
7. Como visitante, quero pesquisar navios por nome na barra de pesquisa do topo, para encontrar um navio específico rapidamente.
8. Como visitante, quero uma página de detalhe por navio com a última informação AIS (posição, velocidade, rumo, estado de navegação, destino, hora local do navio), para conhecer o estado atual do navio.
9. Como visitante, quero ver na página de detalhe as características do navio (MMSI, call sign, bandeira, tipo, dimensões), para o identificar formalmente.
10. Como visitante, quero ver um mini-mapa na página de detalhe com o traçado das últimas 48h do navio, para perceber a viagem em curso.
11. Como visitante, quero ver há quanto tempo foi recebida a última posição ("recebido há X minutos"), para saber quão fresca é a informação.
12. Como visitante, quero um diretório de navios pesquisável e filtrável por tipo, para explorar todos os navios conhecidos pelo sistema.
13. Como visitante, quero que o diretório mostre nome, bandeira, tipo, MMSI e última posição conhecida de cada navio, para comparar navios na lista.
14. Como visitante, quero criar conta e iniciar sessão (email ou social login via Clerk), para desbloquear funcionalidades pessoais.
15. Como utilizador autenticado, quero adicionar/remover navios à minha frota a partir da página de detalhe, para acompanhar os navios que me interessam.
16. Como utilizador autenticado, quero ver a minha frota numa vista própria com o estado atual de cada navio, para os acompanhar todos num sítio só.
17. Como utilizador autenticado, quero escrever, editar e apagar notas privadas por navio, para registar observações minhas.
18. Como utilizador autenticado, quero que as minhas notas e frota sejam privadas (invisíveis para outros utilizadores), para manter a minha informação pessoal segura.
19. Como visitante, quero que a interface esteja em português de Portugal, para usar o site na minha língua.
20. Como visitante, quero uma sidebar de ícones à esquerda e navegação clara entre mapa, diretório e frota, para me orientar como no MarineTraffic original.
21. Como visitante num telemóvel, quero que o mapa e as páginas sejam utilizáveis em ecrã pequeno, para consultar o site em qualquer lado.
22. Como operador do sistema, quero um worker que mantém a ligação WebSocket ao AISStream e escreve posições no Convex em lotes, para alimentar o site com dados reais continuamente.
23. Como operador do sistema, quero que o worker se reconecte automaticamente quando a ligação cai, para não haver buracos prolongados nos dados.
24. Como operador do sistema, quero que o histórico de posições seja amostrado (~1 ponto/5 min/navio) e limpo após 48h por cron, para manter o armazenamento e os custos controlados.
25. Como operador do sistema, quero o site deployado (Vercel + Convex production + worker sempre ligado), para que esteja vivo 24/7 sem depender da minha máquina.
26. Como dono do produto, quero que o site use marca própria (VELA Marine) e não imite a identidade da MarineTraffic/Kpler, para evitar problemas de marca registada.

## Implementation Decisions

**Stack**: Next.js (App Router) + Convex (BD reativa + funções) + Clerk (auth) + MapLibre GL JS com tiles gratuitos (OpenFreeMap/Carto). Repo único na raiz de `LAB/marine/` com `convex/` e `worker/` lado a lado; `git init` no arranque.

**Fonte de dados**: AISStream.io (conta gratuita, WebSocket). Subscrição limitada a uma bounding box do Atlântico ibérico (aprox. Galiza → Gibraltar). A API key vive em env var do worker, nunca no cliente.

**Worker de ingestão** (`worker/`, Node): mantém o WebSocket, normaliza mensagens AIS (position reports tipo 1/2/3/18/19 + static data tipo 5/24) com uma função pura, agrega em lotes (janela de poucos segundos) e envia para uma mutation de ingestão do Convex autenticada por chave partilhada. Reconexão automática com backoff. Deploy em Railway ou Fly.io (o que for mais simples para processos WebSocket persistentes).

**Schema Convex**:
- `vessels` — um doc por MMSI, atualizado in-place: última posição (lat/lng), SOG, COG, heading, estado de navegação, destino, ETA, mais dados estáticos quando chegam (nome, call sign, tipo, dimensões, bandeira derivada do MID do MMSI). Índices por MMSI e search index por nome.
- `positions` — histórico amostrado: grava novo ponto apenas se passaram ≥5 min desde o último ponto do navio. Índice por (vesselId, timestamp). Cron de limpeza apaga pontos com >48h.
- `fleets` — (userId, vesselId), índice por userId.
- `notes` — (userId, vesselId, texto, timestamps), índice por (userId, vesselId).

**Autorização**: identidade Clerk via `ctx.auth` nas funções Convex; `fleets` e `notes` filtradas sempre pelo userId autenticado. Queries públicas (mapa, detalhe, diretório) não exigem sessão.

**Mapa**: MapLibre GL com camada de símbolos alimentada por uma query reativa Convex (todas as últimas posições na viewport/da bounding box). Marcadores orientados por COG, cor por categoria de tipo de navio (paleta consistente com o original: verde carga, vermelho tanker, etc.).

**UI/branding**: layout fiel aos screenshots capturados — sidebar escura de ícones (`#1B252E`), pesquisa no topo, cards brancos, tabs na página de detalhe. Paleta: primário `#00ADEE`, accent/CTA `#136FD5`, botões primários pill. Tipografia Roboto. Nome e logo próprios (VELA Marine). Tokens completos em `marinetraffic-capture/vessel-madmax/branding.json`.

**Deploy**: Vercel (Next.js) + Convex production + worker Railway/Fly.io desde o dia 1. Clerk em instância de development sobre domínio vercel.app; instância production/domínio próprio fica para depois.

## Testing Decisions

Um bom teste exercita **comportamento externo** através do seam, nunca detalhes de implementação — dá-se um input no seam e verifica-se o resultado observável, sem espreitar estruturas internas.

**Seam 1 — camada de funções Convex** (principal, via `convex-test`):
- Ingestão: um lote de posições cria/atualiza `vessels`; pontos de histórico só são gravados respeitando o intervalo de amostragem; dados estáticos (tipo 5) enriquecem o navio sem apagar a posição.
- Retenção: o cron remove posições >48h e preserva as recentes.
- Consulta: pesquisa por nome devolve os navios certos; query do mapa devolve últimas posições.
- Autorização: frota e notas exigem identidade; um utilizador nunca vê frota/notas de outro; mutations sem sessão falham.

**Seam 2 — normalização AIS** (unit tests puros): mensagens brutas AISStream de cada tipo suportado → payload de ingestão esperado; mensagens malformadas/irrelevantes são descartadas sem erro.

Sem testes E2E de UI no v1 (decisão explícita). Prior art: não existe (greenfield); estes testes estabelecem o padrão do projeto.

## Out of Scope

- Diretórios de portos, faróis e empresas; notícias marítimas; páginas de planos/preços.
- Replicação do paywall/gating freemium ("Upgrade to unlock").
- Fotografias de navios (upload ou galeria) — usa-se silhueta placeholder por tipo.
- Notificações, alertas, port call log, performance insights, compliance, route forecast.
- Cobertura AIS fora da bounding box ibérica; escalabilidade para volume global.
- Infraestrutura i18n (o v1 é PT-PT hardcoded).
- Instância Clerk de produção e domínio próprio.
- Testes E2E de browser.

## Further Notes

- Referência funcional e visual completa em `marinetraffic-capture/` (README com análise, screenshots full-page de 7 páginas, HTML renderizado, design system extraído).
- O utilizador precisa de criar contas gratuitas: AISStream.io, Clerk, Convex, Vercel e Railway/Fly — as keys serão pedidas durante o setup.
- Bandeira do navio: o AIS não transmite bandeira; deriva-se dos 3 primeiros dígitos do MMSI (tabela MID da ITU).
- Nota legal: layout e padrões de UI são replicados, mas nome, logo e identidade da MarineTraffic/Kpler ficam de fora por serem marca de terceiros.
- Decisões tomadas em sessão de grilling a 2026-07-11; o plano foi confirmado com um ajuste pendente que o utilizador acabou por não especificar — se surgir, atualizar esta spec antes de grandes desvios.
