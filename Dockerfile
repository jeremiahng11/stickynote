# syntax=docker/dockerfile:1

# --- Stage 1: install production dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# --- Stage 2: runtime ---
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# install a tiny init so signals (SIGTERM) are handled cleanly
RUN apk add --no-cache tini

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# run as the unprivileged user that ships with the node image
USER node

EXPOSE 3005

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "app.js"]
