from sqlalchemy.orm import Session
from ..db.connection import engine
from ..db import models
from ..utils.eleven_labs import generate_voice


def process_voice(task_id: int, text: str, voice_id: str | None = None):
    with Session(engine) as s:
        task = s.query(models.ContentTask).get(task_id)
        if not task:
            return False
        url = generate_voice(text, voice_id)
        task.preview_url = url
        s.commit()
    return True
