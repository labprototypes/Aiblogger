from sqlalchemy.orm import Session
from ..db.connection import engine
from ..db import models
from ..utils.openai_chat import generate_text


def generate_plan(blogger_id: int, days: list[str], content_type: str = "video"):
    with Session(engine) as s:
        for day in days:
            idea = generate_text(f"Idea for {day} ({content_type})")
            task = models.ContentTask(
                blogger_id=blogger_id,
                date=day,
                content_type=content_type,
                idea=idea,
                status="PLANNED",
            )
            s.add(task)
        s.commit()
    return True
