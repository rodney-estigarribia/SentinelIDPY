.PHONY: up down logs build restart clean help

DOCKER_COMPOSE := docker-compose -f maintenance_bot/docker-compose.yml

help:
	@echo "SentinelIDPY Maintenance Bot - Comandos disponibles:"
	@echo ""
	@echo "  make up       - Inicia el bot (build + start en background)"
	@echo "  make down     - Detiene los containers"
	@echo "  make restart  - Reinicia el bot"
	@echo "  make logs     - Ver logs en tiempo real"
	@echo "  make build    - Compilar la imagen"
	@echo "  make ps       - Ver estado de los containers"
	@echo "  make clean    - Detener y eliminar containers/volúmenes"
	@echo ""

up:
	$(DOCKER_COMPOSE) up --build
	@echo "✓ Maintenance bot iniciado"

down:
	$(DOCKER_COMPOSE) down
	@echo "✓ Maintenance bot detenido"

restart:
	$(DOCKER_COMPOSE) restart
	@echo "✓ Maintenance bot reiniciado"

logs:
	$(DOCKER_COMPOSE) logs -f

build:
	$(DOCKER_COMPOSE) build
	@echo "✓ Imagen compilada"

ps:
	$(DOCKER_COMPOSE) ps

clean:
	$(DOCKER_COMPOSE) down -v
	@echo "✓ Containers y volúmenes eliminados"
