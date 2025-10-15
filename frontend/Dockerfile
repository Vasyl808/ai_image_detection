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
ENV NGINX_BACKEND_URL=http://localhost:8000/

# Створюємо необхідні директорії з правильними правами
RUN mkdir -p /var/cache/nginx /tmp/nginx /var/log/nginx /etc/nginx/conf.d && \
    chown -R nginx:nginx /var/cache/nginx /tmp/nginx /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html && \
    chmod -R 755 /var/cache/nginx /tmp/nginx /var/log/nginx && \
    # Створюємо PID файл
    touch /tmp/nginx.pid && \
    chown nginx:nginx /tmp/nginx.pid

# Копіюємо головний nginx конфіг
COPY nginx.conf /etc/nginx/nginx.conf

# Копіюємо конфігурацію сервера як template
COPY default.conf /etc/nginx/templates/default.conf.template

# Копіюємо зібрані файли
COPY --from=builder /app/dist /usr/share/nginx/html

# Налаштовуємо права доступу
RUN chown -R nginx:nginx /usr/share/nginx/html

# Перемикаємося на користувача nginx
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --spider -q http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]