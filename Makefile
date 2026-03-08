up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

shell-web:
	docker compose exec web sh

lint:
	docker compose exec web pnpm lint

typecheck:
	docker compose exec web pnpm typecheck

db-shell:
	docker compose exec postgres psql -U $$POSTGRES_USER -d $$POSTGRES_DB
