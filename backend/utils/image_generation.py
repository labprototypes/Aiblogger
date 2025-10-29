"""
Image generation utilities using FAL.ai Seedream v4
"""
import os
import requests
from typing import Optional
from uuid import uuid4


def generate_fashion_frame(
    prompt: str, 
    aspect_ratio: str = "9:16",
    reference_image: Optional[str] = None
) -> str:
    """
    Generate a fashion image using FAL.ai Seedream v4
    
    Uses:
    - Seedream v4 text-to-image: when only prompt provided
    - Seedream v4 edit: when prompt + reference_image provided
    
    Args:
        prompt: The text prompt for image generation
        aspect_ratio: Image aspect ratio ("9:16" for full height, "4:5" for angles, "16:9" for landscape, "3:4" for portrait)
        reference_image: Optional reference image URL for edit mode
    
    Returns:
        URL of the generated image (uploaded to S3 for persistence)
    """
    FAL_API_KEY = os.getenv("FAL_API_KEY")
    
    if not FAL_API_KEY:
        raise ValueError("FAL_API_KEY not set in environment")
    
    # Choose endpoint based on whether we have reference image
    if reference_image:
        # Seedream v4 edit (text + image)
        url = "https://fal.run/fal-ai/bytedance/seedream/v4/edit"
        print(f"[Seedream v4 Edit] Using reference image: {reference_image[:50]}...")
    else:
        # Seedream v4 text-to-image (text only)
        url = "https://fal.run/fal-ai/bytedance/seedream/v4/text-to-image"
        print(f"[Seedream v4 Text2Img] Generating from text only")
    
    headers = {
        "Authorization": f"Key {FAL_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Map aspect ratios to dimensions
    dimensions = {
        "9:16": {"width": 1080, "height": 1920},   # Full height portrait
        "4:5": {"width": 1080, "height": 1350},    # Instagram portrait
        "16:9": {"width": 1920, "height": 1080},   # Landscape
        "3:4": {"width": 1080, "height": 1440},    # Portrait outfit
        "1:1": {"width": 1080, "height": 1080},    # Square
    }
    
    size = dimensions.get(aspect_ratio, dimensions["9:16"])
    
    # Build payload based on mode
    payload = {
        "prompt": prompt,
        "image_size": size,
        "num_inference_steps": 28,
        "guidance_scale": 3.5,
        "num_images": 1,
        "enable_safety_checker": False,
        "output_format": "jpeg",
        "sync_mode": True
    }
    
    # Add reference image for edit mode
    if reference_image:
        payload["image_url"] = reference_image
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=120)
        response.raise_for_status()
        
        result = response.json()
        
        # FAL returns images array
        if "images" in result and len(result["images"]) > 0:
            fal_url = result["images"][0]["url"]
            print(f"[Seedream] Generated image: {fal_url[:80]}...")
            
            # Upload to S3 for persistence (FAL URLs expire after 24h)
            try:
                s3_url = upload_fal_image_to_s3(fal_url, f"fashion-{uuid4()}.jpg")
                print(f"[S3] Uploaded to: {s3_url[:80]}...")
                return s3_url
            except Exception as s3_error:
                print(f"[S3] Upload failed, using FAL URL: {s3_error}")
                return fal_url  # Fallback to FAL URL if S3 fails
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
        filename: Desired S3 filename (e.g., "fashion-{uuid}.jpg")
    
    Returns:
        Permanent S3 URL
    """
    import boto3
    from io import BytesIO
    
    # Check if S3 is configured
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_S3_BUCKET = os.getenv('AWS_S3_BUCKET')
    AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
    
    if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET]):
        raise Exception("S3 credentials not configured")
    
    # Download from FAL
    response = requests.get(fal_url, timeout=30)
    response.raise_for_status()
    
    # Upload to S3
    s3 = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    
    s3.upload_fileobj(
        BytesIO(response.content),
        AWS_S3_BUCKET,
        f"fashion/{filename}",
        ExtraArgs={'ContentType': 'image/jpeg', 'ACL': 'public-read'}
    )
    
    # Return public URL
    s3_url = f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/fashion/{filename}"
    return s3_url
