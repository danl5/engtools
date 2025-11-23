# EngTools

<img src="frontend/public/favicon.svg" alt="EngTools" width="72" height="72" />

## Official Site

- Visit: https://engtools.tech

## Supported Tools

- Encoding & Conversion
  - Base64 encode/decode
  - URL encode/decode
  - Unicode escape/unescape (\uXXXX ⇄ text)
  - JSON format/minify/validate
  - YAML ↔ JSON conversion
  - Unix timestamp ↔ ISO8601 (with timezone selection)
- Crypto
  - AES-GCM encrypt/decrypt
  - RSA generate/encrypt/decrypt
  - SHA1/SHA256/SHA512 hashing
- Other
  - Bytes ↔ String conversion

## Quick Start

- Frontend (Dev)
  - `cd frontend && npm ci && npm run dev`
  - Optional: set `VITE_API_TARGET=https://your-domain` or `VITE_API_BASE=https://your-domain/api`
- Docker Compose (Prod)
  - Place certs on host: `/etc/nginx/certs/{server.crt,server.key}`
  - `bash scripts/deploy.sh` (frontend on 443 with HTTPS; 80 redirects to 443)

## Roadmap

- JSON Schema validation
- IP geolocation lookup