FROM golang:1.24-alpine AS builder
ENV GOPROXY=https://goproxy.cn,direct
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
WORKDIR /app
COPY . .
RUN apk add --no-cache build-base && go build -o server ./cmd/server

FROM alpine:3.20
WORKDIR /app
ENV SERVER_ADDR=:8080
ENV JWT_SECRET=change-this-secret
COPY --from=builder /app/server /app/server
COPY --from=builder /app/openapi /app/openapi
EXPOSE 8080
CMD ["/app/server"]
HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD wget -q -O - http://localhost:8080/health || exit 1