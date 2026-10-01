# ---------- Stage 1: dependencies ----------
# Installs deps in isolation so the final image never sees devDependencies,
# npm cache, or build tooling.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

# ---------- Stage 2: runtime ----------
# Distroless-style minimal runtime: only node_modules + source, no build tools,
# no package manager, no shell history, nothing else from the build stage.
FROM node:20-alpine AS runtime
WORKDIR /app

# Run as a non-root user (alpine node image ships a "node" user by default)
RUN chown -R node:node /app
USER node

COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

# Port routing: container listens on 3000; mapped to a host port via
# docker run -p <host_port>:3000 or docker-compose "ports:"
EXPOSE 3000

# Secrets/config are never baked into the image - they're injected at
# container start via --env-file or docker-compose "env_file:" (see .env.example)
ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]
