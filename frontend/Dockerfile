FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* .npmrc* ./
RUN npm config set registry https://registry.npmmirror.com && npm ci || npm i && chmod +x node_modules/.bin/*
COPY . .
RUN npx vite build || node node_modules/vite/bin/vite.js build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD wget --no-check-certificate -q -O - https://localhost/index.html || exit 1