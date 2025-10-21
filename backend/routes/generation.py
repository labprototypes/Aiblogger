from fastapi import APIRouter
from pydantic import BaseModel


class GenerationRequest(BaseModel):
    task_id: int
    prompt: str | None = None


router = APIRouter()


@router.post("/image")
def gen_image(req: GenerationRequest):
    return {"enqueued": True, "type": "image", "task_id": req.task_id}


@router.post("/video")
def gen_video(req: GenerationRequest):
    return {"enqueued": True, "type": "video", "task_id": req.task_id}


@router.post("/voice")
def gen_voice(req: GenerationRequest):
    return {"enqueued": True, "type": "voice", "task_id": req.task_id}
