#!/usr/bin/env bash
set -euo pipefail
DOMAIN=""
FRONTEND_PORT="443"
BACKEND_PORT="8080"
IPINFO_TOKEN="${IPINFO_TOKEN:-}"
UMAMI_APP_SECRET="${UMAMI_APP_SECRET:-}"
UMAMI_HASH_SALT="${UMAMI_HASH_SALT:-}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="$2"; shift 2 ;;
    --frontend-port) FRONTEND_PORT="$2"; shift 2 ;;
    --backend-port) BACKEND_PORT="$2"; shift 2 ;;
    *) shift ;;
  esac
done
if ! command -v docker >/dev/null 2>&1; then echo "docker not found"; exit 1; fi
case "${DOCKER_HOST:-}" in
  http+docker*)
    unset DOCKER_HOST
    export DOCKER_HOST="unix:///var/run/docker.sock"
    ;;
esac
unset DOCKER_TLS_VERIFY
unset DOCKER_CERT_PATH
if ! docker info >/dev/null 2>&1; then
  echo "docker daemon unreachable"
  exit 1
fi
DOCKER_COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker-compose"
else
  echo "docker-compose or docker compose not found"; exit 1
fi
echo "using compose command: ${DOCKER_COMPOSE_CMD}"
ALLOW_ORIGIN="*"
if [[ -n "$DOMAIN" ]]; then ALLOW_ORIGIN="https://$DOMAIN"; fi
if [[ ! -f deploy/.env ]]; then mkdir -p deploy; JWT_SECRET=$(openssl rand -hex 32 || dd if=/dev/urandom bs=32 count=1 2>/dev/null | xxd -p); UMAMI_APP_SECRET_VAL=$(openssl rand -hex 32 || dd if=/dev/urandom bs=32 count=1 2>/dev/null | xxd -p); UMAMI_HASH_SALT_VAL=$(openssl rand -hex 32 || dd if=/dev/urandom bs=32 count=1 2>/dev/null | xxd -p); printf "BACKEND_PORT=%s\nFRONTEND_PORT=%s\nJWT_SECRET=%s\nALLOW_ORIGIN=%s\nBACKEND_ADDR=:%s\nIPINFO_TOKEN=%s\nUMAMI_APP_SECRET=%s\nUMAMI_HASH_SALT=%s\n" "$BACKEND_PORT" "$FRONTEND_PORT" "$JWT_SECRET" "$ALLOW_ORIGIN" "$BACKEND_PORT" "$IPINFO_TOKEN" "$UMAMI_APP_SECRET_VAL" "$UMAMI_HASH_SALT_VAL" > deploy/.env; else
  cp deploy/.env deploy/.env.bak.$(date +%s)
fi
export BACKEND_PORT
export FRONTEND_PORT
export ALLOW_ORIGIN
export IPINFO_TOKEN
export UMAMI_APP_SECRET
export UMAMI_HASH_SALT
$DOCKER_COMPOSE_CMD --env-file deploy/.env up -d --build
echo "waiting backend"
for i in $(seq 1 30); do
  if curl -sSf http://localhost:${BACKEND_PORT}/health >/dev/null 2>&1; then break; fi
  sleep 2
done
curl -sSf -X POST http://localhost:${BACKEND_PORT}/api/v1/crypto/sha/hash -H 'Content-Type: application/json' -d '{"alg":"sha256","data":"hello"}' >/dev/null 2>&1
echo "waiting frontend"
for i in $(seq 1 30); do
  if curl -k -sSf https://localhost:${FRONTEND_PORT}/ >/dev/null 2>&1; then break; fi
  sleep 2
done
echo "done"
