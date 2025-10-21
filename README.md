# Aiblogger

AI Blogger Studio (MVP scaffold)

Quickstart (API only for now)
- Create a .env based on .env.example
- Install deps and run the API:
	- With Docker: see docker-compose.yml
	- Or locally: pip install -r backend/requirements.txt and run uvicorn backend.main:app --reload

Planned structure
- backend: FastAPI API, DB models, routes
- workers: Redis queue workers (todo)
- frontend: Next.js app (todo)

Deploy
- Render blueprint added in render.yaml
- Steps:
	1) Push repo to GitHub
	2) In Render -> Blueprints -> New Blueprint, point to repo URL
	3) Render will create services: aiblogger-api (web), aiblogger-worker (worker), aiblogger-db (Postgres), aiblogger-redis (Redis)
	4) Set env vars if needed: ALLOWED_ORIGINS (e.g., https://your-frontend)
	5) Deploy. API health at /health

Local run (API only)
- python -m pip install -r backend/requirements.txt
- python -c "from backend.db.seed_data import init_db; init_db()"
- uvicorn backend.main:app --reload

