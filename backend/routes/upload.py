from fastapi import APIRouter, UploadFile, File, HTTPException
from ..utils.storage import upload_bytes_to_s3
import os
import uuid

router = APIRouter()


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    """Upload image to S3 and return URL"""
    
    # Check file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Check S3 is configured
    if not os.getenv("AWS_S3_BUCKET"):
        raise HTTPException(status_code=500, detail="S3 not configured")
    
    # Read file
    contents = await file.read()
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    key = f"bloggers/{uuid.uuid4()}.{ext}"
    
    try:
        url = upload_bytes_to_s3(contents, key)
        return {"url": url, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
