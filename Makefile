# ft_transcendence Makefile
# Run the entire application with: make

.PHONY: all build up down clean logs restart ssl help

# Default target - build and run
all: up

# Build all containers
build:
	@echo "Building Docker containers..."
	docker compose build

# Generate SSL certificates and start all services
up:
	@echo "Starting ft_transcendence..."
	@mkdir -p ssl
	docker compose up ssl-generator
	docker compose up -d backend frontend
	@echo ""
	@echo "============================================"
	@echo "Welcome to ft_transcendence!"
	@echo "============================================"
	@echo "🏠 HOST ACCESS:"
	@echo "   https://localhost:8443"
	@echo ""
	@echo "🌐 NETWORK ACCESS (for other players):"
	@echo "   https://10.12.4.1:8443"
	@echo ""
	@echo "📡 Share this URL with other players on your network!"
	@echo "⚠️  Make sure ports 8443 and 3000 are open in firewall"
	@echo "============================================"

# Start in foreground (with logs)
up-logs:
	@mkdir -p ssl
	docker compose up ssl-generator
	docker compose up backend frontend

# Stop all services
down:
	@echo "Stopping ft_transcendence..."
	docker compose down

# Stop and remove volumes (clean slate)
clean:
	@echo "Cleaning up ft_transcendence..."
	docker compose down -v --rmi local
	rm -rf ssl/

# View logs
logs:
	docker compose logs -f

# View backend logs only
logs-backend:
	docker compose logs -f backend

# View frontend logs only
logs-frontend:
	docker compose logs -f frontend

# Restart all services
restart: down up

# Rebuild and restart
rebuild: clean build up

# Generate new SSL certificates
ssl:
	@echo "Regenerating SSL certificates..."
	rm -rf ssl/
	mkdir -p ssl
	docker compose up ssl-generator

# Check service status
status:
	docker compose ps

# Help
help:
	@echo "ft_transcendence - Available commands:"
	@echo ""
	@echo "  make          - Build and start the application"
	@echo "  make build    - Build Docker containers"
	@echo "  make up       - Start all services (detached)"
	@echo "  make up-logs  - Start with logs in foreground"
	@echo "  make down     - Stop all services"
	@echo "  make clean    - Stop and remove all data"
	@echo "  make logs     - View all service logs"
	@echo "  make restart  - Restart all services"
	@echo "  make rebuild  - Clean rebuild everything"
	@echo "  make ssl      - Regenerate SSL certificates"
	@echo "  make status   - Check service status"
	@echo "  make help     - Show this help message"
