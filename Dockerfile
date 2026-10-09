# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# Baked into the client bundle AND the /api/auth same-origin allowlist at
# build time. Must be the deployment's public origin (e.g.
# https://mygymagent.tech) with no trailing slash.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV DOCKER_BUILD=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime: the standalone server Next.js produces, nothing else ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER app
EXPOSE 3000
# The standalone server binds `process.env.HOSTNAME || '0.0.0.0'`, and Docker
# sets HOSTNAME to the container's own name -- so without this line the server
# listens on that one hostname only: the container's port mapping works, the
# healthcheck below (run inside the container) gets ECONNREFUSED, and Docker
# reports an unhealthy container serving traffic fine. 0.0.0.0 is the value
# the app itself defaults to; set it explicitly so the container environment
# cannot shadow it. Override with `docker run -e HOSTNAME=<host>` if a host-
# specific bind is ever wanted.
ENV HOSTNAME=0.0.0.0
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "server.js"]
