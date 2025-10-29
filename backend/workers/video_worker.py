from sqlalchemy.orm import Session
from ..db.connection import engine
from ..db import models
from ..utils.fal_ai import generate_video
from ..utils.storage import upload_url_to_s3
import os


def process_video(task_id: int, prompt: str | None = None):
    with Session(engine) as s:
        task = s.query(models.ContentTask).get(task_id)
        if not task:
            return False
        # Simple preset selection based on blogger type
        btype = (task.blogger.type if task.blogger else "").lower() if task else ""
        mode = "seedream/edit" if "fashion" in btype else "infinitalk"
        combined_prompt = f"[{mode}] {prompt or task.idea or 'video'}"
        url = generate_video(combined_prompt)
        if os.getenv("AWS_S3_BUCKET") and os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY"):
            key = f"previews/task-{task_id}.mp4"
            try:
                s3_url = upload_url_to_s3(url, key)
                task.preview_url = s3_url
            except Exception:
                task.preview_url = url
        else:
            task.preview_url = url
        task.status = "REVIEW"  # Generated, awaiting approval
        s.commit()
    return True
