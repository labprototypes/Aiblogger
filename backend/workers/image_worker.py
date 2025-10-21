from sqlalchemy.orm import Session
from ..db.connection import engine
from ..db import models
from ..utils.fal_ai import generate_image


def process_image(task_id: int, prompt: str | None = None):
    with Session(engine) as s:
        task = s.query(models.ContentTask).get(task_id)
        if not task:
            return False
        url = generate_image(prompt or task.idea or "image")
        task.preview_url = url
        task.status = "VISUAL_READY"
        s.commit()
    return True
