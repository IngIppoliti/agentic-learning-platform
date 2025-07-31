.PHONY: help install dev test lint format clean docker-build docker-run deploy

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	pip install -r requirements.txt
	pre-commit install

dev: ## Setup development environment
	docker-compose up -d postgres redis
	alembic upgrade head
	@echo "Development environment ready!"

test: ## Run tests
	pytest tests/ -v --cov=app --cov-report=html --cov-report=term

test-agents: ## Run agent-specific tests
	pytest tests/test_agents.py -v

test-api: ## Run API tests
	pytest tests/test_api.py -v

lint: ## Run linting
	flake8 app tests
	mypy app

format: ## Format code
	black app tests
	isort app tests

clean: ## Clean up
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	rm -rf .coverage htmlcov/ .pytest_cache/

docker-build: ## Build Docker image
	docker build -t agentic-learning:latest .

docker-run: ## Run with Docker Compose
	docker-compose up --build

db-migrate: ## Run database migrations
	alembic upgrade head

db-revision: ## Create new migration
	@read -p "Enter migration message: " msg; \
	alembic revision --autogenerate -m "$$msg"

deploy-staging: ## Deploy to staging
	kubectl apply -f k8s/ --context=staging
	kubectl rollout status deployment/agentic-learning-api -n agentic-learning --context=staging

deploy-prod: ## Deploy to production
	kubectl apply -f k8s/ --context=production
	kubectl rollout status deployment/agentic-learning-api -n agentic-learning --context=production

logs: ## View application logs
	kubectl logs -f deployment/agentic-learning-api -n agentic-learning

monitor: ## Open monitoring dashboard
	@echo "Opening Grafana dashboard..."
	kubectl port-forward svc/grafana 3000:3000 -n monitoring

load-test: ## Run load tests
	locust -f tests/load_test.py --host=http://localhost:8000

backup-db: ## Backup database
	@echo "Creating database backup..."
	pg_dump $(DATABASE_URL) > backup_$(shell date +%Y%m%d_%H%M%S).sql

security-scan: ## Run security scan
	safety check
	bandit -r app/

performance-test: ## Run performance tests
	pytest tests/test_performance.py -v

integration-test: ## Run integration tests
	pytest tests/test_integration.py -v

docs: ## Generate documentation
	cd docs && make html

start-dev: ## Start development server
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

setup-local: ## Complete local setup
	make install
	make dev
	make db-migrate
	@echo "🚀 Local environment is ready!"
	@echo "📖 API docs: http://localhost:8000/docs"
	@echo "🔍 Health check: http://localhost:8000/health"
