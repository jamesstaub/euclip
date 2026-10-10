# Define environment variables
PROJECT_NAME=euclip
DOCKER_COMPOSE=docker-compose
CONTAINERS=euclip_backend euclip_frontend euclip_db

# Define the path to the Euclip ember.js repository
EMBER_REPO_PATH ?= ../euclip

# Start the services
up:
	$(DOCKER_COMPOSE) up --build -d

# Stop the services
down:
	$(DOCKER_COMPOSE) down

# Stop and remove all containers, networks, and volumes
clean:
	$(DOCKER_COMPOSE) down --volumes --remove-orphans

# Rebuild containers without using cache
rebuild:
	$(DOCKER_COMPOSE) build --no-cache

# Show logs
logs:
	$(DOCKER_COMPOSE) logs -f

# Run Rails console
console:
	$(DOCKER_COMPOSE) exec euclip_backend rails console

# Run Rails commands in the backend container and print output to stdout
rails:
	$(DOCKER_COMPOSE) exec -T euclip_backend rails $(filter-out $@,$(MAKECMDGOALS))

# Run Ember server manually (if needed)
frontend:
	$(DOCKER_COMPOSE) exec euclip_frontend ember serve --host 0.0.0.0

# Run database migrations
migrate:
	$(DOCKER_COMPOSE) exec euclip_backend rails db:migrate

# Drop and recreate the database (ignoring the test database)
reset-db:
	$(DOCKER_COMPOSE) exec euclip_backend bash -c "RAILS_ENV=development rails db:drop db:create db:migrate db:seed"

# Tail Rails logs
backend-logs:
	$(DOCKER_COMPOSE) logs -f euclip_backend

# Tail Ember logs
frontend-logs:
	$(DOCKER_COMPOSE) logs -f euclip_frontend

# Open a shell in the backend container
shell-backend:
	$(DOCKER_COMPOSE) exec euclip_backend bash

# Open a shell in the frontend container
shell-frontend:
	$(DOCKER_COMPOSE) exec euclip_frontend sh

# Open a shell in the database container
shell-db:
	$(DOCKER_COMPOSE) exec euclip_db psql -U euclip-db-user -d euclip_development

# Show running containers
ps:
	$(DOCKER_COMPOSE) ps

# Run tests
test:
	$(DOCKER_COMPOSE) exec euclip_backend rails test

# Setup the database
db-setup:
	$(DOCKER_COMPOSE) exec euclip_backend rails db:setup

# Generate SSL certificate
generate-ssl:
	bash scripts/generate-ssl.sh

# Generate Rails master key and credentials file
generate-credentials:
	@if [ ! -f config/master.key ]; then \
		echo "Generating config/master.key..."; \
		echo "2105ce38a817f921aec33e4e5203ba08" > config/master.key; \
	fi
	@if [ ! -f config/credentials.yml.enc ]; then \
		echo "Generating config/credentials.yml.enc..."; \
		EDITOR="nano" rails credentials:edit; \
	fi
# note you may need to run heroku config:set RAILS_MASTER_KEY=$(cat config/master.key) to set the master key in Heroku



# Edit Rails credentials
edit-credentials:
	@if [ $$(docker ps -q -f name=euclip_backend) ]; then \
		echo "Container is already running. Opening credentials editor..."; \
		$(DOCKER_COMPOSE) exec euclip_backend bash -c "EDITOR=nano rails credentials:edit"; \
	else \
		echo "Starting container..."; \
		$(DOCKER_COMPOSE) up -d euclip_backend; \
		echo "Opening credentials editor..."; \
		$(DOCKER_COMPOSE) exec euclip_backend bash -c "EDITOR=nano rails credentials:edit"; \
	fi

# Full setup (generate credentials, start services, generate SSL, setup DB, etc.)
setup: generate-credentials up generate-ssl db-setup
	@echo "Application setup complete!"

# Run Rake commands in the backend container
rake:
	$(DOCKER_COMPOSE) exec euclip_backend rake $(filter-out $@,$(MAKECMDGOALS))

# Run bundle install in the backend container
bundle:
	$(DOCKER_COMPOSE) exec euclip_backend bundle install

# Build the frontend inside the container and sync files locally to the backend's public directory
build-frontend:
	$(DOCKER_COMPOSE) exec euclip_frontend bash -c "ember build --environment production"
	rm -rf public
	mkdir public
	rsync -av --progress $(EMBER_REPO_PATH)/dist/* public --exclude audio/drum-machines

# Prevent Make from interpreting additional arguments as targets
%:
	@:
