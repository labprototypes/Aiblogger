"""
Image generation utilities using FAL.ai SDXL 4.0
"""
import os
import requests
from typing import Optional


def generate_fashion_frame(prompt: str, aspect_ratio: str = "9:16") -> str:
    """
    Generate a fashion image using FAL.ai SDXL 4.0 API
    
    Args:
        prompt: The text prompt for image generation
        aspect_ratio: Image aspect ratio ("9:16" for full height, "4:5" for angles)
    
    Returns:
        URL of the generated image
    """
    FAL_API_KEY = os.getenv("FAL_API_KEY")
    
    if not FAL_API_KEY:
        raise ValueError("FAL_API_KEY not set in environment")
    
    # FAL.ai SDXL 4.0 endpoint
    url = "https://fal.run/fal-ai/flux-pro/v1.1-ultra"
    
    headers = {
        "Authorization": f"Key {FAL_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "prompt": prompt,
        "image_size": {
            "width": 1080 if aspect_ratio == "4:5" else 1080,
            "height": 1350 if aspect_ratio == "4:5" else 1920
        },
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "num_images": 1,
        "enable_safety_checker": False,
        "output_format": "jpeg",
        "sync_mode": True
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=120)
        response.raise_for_status()
        
        result = response.json()
        
        # FAL returns images array
        if "images" in result and len(result["images"]) > 0:
            image_url = result["images"][0]["url"]
            
            # Optional: Download and upload to your S3 for persistence
            # For now, return FAL URL directly (they expire after 24h)
            # TODO: Implement S3 upload for permanent storage
            
            return image_url
        else:
            raise Exception(f"No image returned from FAL.ai: {result}")
    
    except requests.exceptions.RequestException as e:
        raise Exception(f"FAL.ai API request failed: {str(e)}")
    except Exception as e:
        raise Exception(f"Image generation failed: {str(e)}")


def upload_fal_image_to_s3(fal_url: str, filename: str) -> str:
    """
    Download image from FAL.ai temporary URL and upload to S3 for persistence
    
    Args:
        fal_url: Temporary FAL.ai image URL
        filename: Desired S3 filename (e.g., "fashion-main-123.jpg")
    
    Returns:
        Permanent S3 URL
    """
    import boto3
    from io import BytesIO
    
    # Download from FAL
    response = requests.get(fal_url, timeout=30)
    response.raise_for_status()
    
    # Upload to S3
    s3 = boto3.client('s3')
    bucket = os.getenv('S3_BUCKET_NAME', 'aiblogger')
    
    s3.upload_fileobj(
        BytesIO(response.content),
        bucket,
        f"fashion/{filename}",
        ExtraArgs={'ContentType': 'image/jpeg'}
    )
    
    # Return public URL
    s3_url = f"https://{bucket}.s3.amazonaws.com/fashion/{filename}"
    return s3_url
