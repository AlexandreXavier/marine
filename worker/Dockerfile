# Worker de ingestão AIS — processo Node de longa duração (WebSocket → Convex).
# Sem porta HTTP: é um worker de fundo que corre 24/7.
FROM node:22-slim

WORKDIR /app

# Instala dependências (inclui tsx, usado para correr o worker em TS).
COPY package.json package-lock.json ./
RUN npm ci

# Só o necessário para o worker: o próprio worker e o código Convex que importa.
COPY tsconfig.json ./
COPY convex ./convex
COPY worker ./worker

# Variáveis (AISSTREAM_API_KEY, INGEST_KEY, NEXT_PUBLIC_CONVEX_URL) vêm do
# serviço em runtime — nunca embutidas na imagem.
CMD ["npm", "run", "worker:prod"]
