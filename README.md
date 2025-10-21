# Aiblogger

AI Blogger Studio (MVP)

## Quickstart
- Create a `.env` from `.env.example` (or set env vars in Render).
- Backend: `pip install -r backend/requirements.txt` then `uvicorn backend.main:app --reload`.
- Frontend: `cd frontend && npm i && npm run dev`.

## Environment
```
DATABASE_URL=postgres://...
REDIS_URL=redis://...
ALLOWED_ORIGINS=*
# optional AI keys
OPENAI_API_KEY=sk-...
FAL_API_KEY=FAL_...
ELEVENLABS_API_KEY=...
```

## Features
- Bloggers: list/create/edit/delete; extended fields (image, theme, tone_of_voice, voice_id, content_types, content_schedule)
- Calendar: month grid, prev/next nav, blogger filter, quick-add; inline status cycle, generate, delete; preview marker
- Tasks: detail page, status change, delete, OpenAI-powered “Gen Script”, generate (image worker)
- Workers: RQ worker for image processing; script generation via OpenAI utils

## Deploy (Render Blueprint)
- See `render.yaml`. It provisions Web (FastAPI), Worker (RQ), Redis, and Postgres.
- Steps:
	1) Push repo to GitHub
	2) Render → Blueprints → New Blueprint, point to repo URL
	3) Set env vars: ALLOWED_ORIGINS, and as needed OPENAI_API_KEY / FAL_API_KEY / ELEVENLABS_API_KEY
	4) Deploy; API health at `/health`. Worker should connect to Redis automatically.
	5) Set `NEXT_PUBLIC_API_BASE` for frontend if hosting separately.

## Local API
- python -m pip install -r backend/requirements.txt
- python -c "from backend.db.seed_data import init_db; init_db()"
- uvicorn backend.main:app --reload

