# ShortLink

A minimal URL shortener demonstrating a multi-stage, multi-dependency
container setup: Node.js/Express API, PostgreSQL, Redis, and a React
frontend served by Nginx.

## Architecture

```
frontend (React + Nginx, :8080) → backend (Express, :3000) → postgres (:5432)
                                                           → redis (:6379)
```

## Why multi-stage Dockerfiles

- **backend/Dockerfile**: stage 1 installs only production dependencies;
  stage 2 copies just `node_modules` + source into a fresh Alpine image
  and runs as a non-root user. No npm, no build cache, no lockfile in
  the final image.
- **frontend/Dockerfile**: stage 1 runs the full Vite build (minifies
  and hashes JS/CSS); stage 2 is nginx:alpine serving only the built
  `dist/` output. The final image has no Node.js runtime at all.

## Environment variables

Real values live in a git-ignored `.env` file (copy `.env.example` to
start). Compose injects them into containers via `env_file:` at
runtime — nothing is baked into the image layers, so images can be
pushed to a public registry without leaking credentials.

## Ports

| Service  | Container port | Host port |
|----------|-----------------|-----------|
| frontend | 8080            | 8080      |
| backend  | 3000            | 3000      |
| postgres | 5432            | 5432      |
| redis    | 6379            | 6379      |

## Run locally

```bash
cp .env.example .env   # then edit values
docker compose up --build
```

Visit http://localhost:8080.
