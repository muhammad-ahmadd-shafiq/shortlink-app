# ---------- Stage 1: build ----------
# Full Node toolchain lives here only; it never reaches the final image.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build
# Output: minified, hashed static assets in /app/dist

# ---------- Stage 2: runtime ----------
# ~25MB final image: no node, no npm, no source - just nginx + static files.
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginx:alpine already runs its worker processes as an unprivileged user
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
