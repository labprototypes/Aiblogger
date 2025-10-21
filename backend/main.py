import os
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from .routes.bloggers import router as bloggers_router
from .routes.tasks import router as tasks_router
from .routes.assistant import router as assistant_router
from .routes.generation import router as generation_router

from .db.connection import engine
from .db.models import Base

app = FastAPI(title="AI Blogger Studio API", version="0.1.0")

# Basic CORS (adjust in production)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Ensure tables exist (for MVP); for migrations use Alembic later
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/", include_in_schema=False)
def root():
    # Redirect root to interactive API docs to avoid 404 on Render homepage
    return RedirectResponse(url="/docs")


app.include_router(bloggers_router, prefix="/api/bloggers", tags=["bloggers"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["tasks"])
app.include_router(assistant_router, prefix="/api/assistant", tags=["assistant"])
app.include_router(generation_router, prefix="/api/generation", tags=["generation"])
