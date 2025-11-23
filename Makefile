SHELL := /bin/bash
.PHONY: deploy down status logs build
DC := $(shell if docker compose version >/dev/null 2>&1; then echo docker\ compose; elif command -v docker-compose >/dev/null 2>&1; then echo docker-compose; else echo docker-compose; fi)
deploy:
	bash scripts/deploy.sh $(ARGS)
down:
	$(DC) down
status:
	$(DC) ps
logs:
	$(DC) logs -f --tail=100
build:
	$(DC) build