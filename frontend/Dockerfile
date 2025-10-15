# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20-alpine
ARG VITE_API_URL=/api

############################
# Builder image
############################
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY package.json package-lock.json ./

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm ci --legacy-peer-deps

COPY . .

RUN npm run build

############################
# Production image
############################
FROM nginx:stable-alpine AS production

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

RUN adduser -D -u 1001 appuser && \
    chown -R appuser:appuser /usr/share/nginx/html

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --spider -q http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
