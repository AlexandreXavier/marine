# VELA Marine

Plataforma de tracking AIS de navios na costa ibérica: mapa live, detalhe de navio, diretório, frota pessoal e histórico de percursos. Este glossário fixa a linguagem do domínio.

## Language

**Navio** (Vessel):
Uma embarcação identificada pelo seu MMSI, com posição e características derivadas do AIS.
_Avoid_: barco, embarcação (usar "Navio" no código e na UI técnica)

**Posição** (Position):
Um ponto AIS de um Navio num instante — latitude, longitude e timestamp.
_Avoid_: ponto, coordenada, fix

**Última posição** (Latest position):
A Posição mais recente de um Navio, guardada in-place no próprio Navio; alimenta o mapa live.

**Traçado** (Track):
A sequência ordenada das Posições históricas de um Navio.
_Avoid_: rasto, rota, percurso (ver Viagem — "percurso" é ambíguo)

**Viagem** (Voyage):
Um segmento do Traçado entre uma partida e uma chegada — a unidade que se mostra e reproduz de cada vez no mapa de percurso. Um Navio tem muitas Viagens ao longo do tempo.
_Avoid_: percurso, trip, rota

**Frota** (Fleet):
O conjunto de Navios que um utilizador autenticado segue.

**Nota** (Note):
Um texto privado que um utilizador escreve sobre um Navio.

## Relationships

- Um **Navio** tem muitas **Posições** (as recentes formam o **Traçado**).
- Um **Traçado** divide-se em várias **Viagens** (partida→chegada).
- Uma **Frota** contém muitos **Navios**, por utilizador.
- Uma **Nota** pertence a exactamente um utilizador e um **Navio**.

## Example dialogue

> **Dev:** "Quando abro o percurso de um Navio, mostro o Traçado todo?"
> **Domínio:** "Não — mostras uma **Viagem** de cada vez. O **Traçado** de 3 meses tem muitas **Viagens**; por defeito mostra-se a mais recente."

## Flagged ambiguities

- "Percurso" foi usado para significar tanto o **Traçado** inteiro como uma **Viagem** — resolvido: são distintos. A UI de "ver o percurso" mostra **uma Viagem**.
