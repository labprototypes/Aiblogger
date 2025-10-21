from sqlalchemy.orm import Session
from ..db.connection import engine
from ..db import models
from ..utils.fal_ai import generate_video


def process_video(task_id: int, prompt: str | None = None):
    with Session(engine) as s:
        task = s.query(models.ContentTask).get(task_id)
        if not task:
            return False
        url = generate_video(prompt or task.idea or "video")
        task.preview_url = url
        task.status = "VISUAL_READY"
        s.commit()
    return True
