from fastapi import APIRouter
from pydantic import BaseModel


class AssistantRequest(BaseModel):
    message: str


router = APIRouter()


@router.post("/")
def assistant(req: AssistantRequest):
    # Placeholder: later will call OpenAI API
    return {"reply": f"Echo: {req.message}"}
