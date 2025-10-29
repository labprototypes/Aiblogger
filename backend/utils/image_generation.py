"""
Image generation utilities using FAL.ai Seedream v4
"""
import os
import fal_client
from typing import Optional
from uuid import uuid4
from openai import OpenAI


def enhance_prompt_with_gpt(user_prompt: str, mode: str = "location") -> str:
    """
    Use GPT-4 to enhance the user's prompt for Seedream v4 edit model.
    
    Args:
        user_prompt: User's simple description (e.g. "в кафе", "на улице")
        mode: "location" or "frame" to determine enhancement style
    
    Returns:
        Enhanced detailed prompt for image generation
    """
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    if mode == "location":
        system_prompt = """Ты эксперт по генерации промптов для AI image generation (Seedream v4 edit mode).

Пользователь даст краткое описание локации/стиля для персонажа. Твоя задача:
1. Расширить это в детальный промпт для модели
2. Описать полное тело персонажа (full body portrait)
3. Добавить детали одежды, позы, освещения, окружения
4. Сохранить лицо и черты персонажа (модель работает в edit mode с референсным фото лица)
5. Промпт на английском, профессиональный стиль

Пример:
Вход: "в кафе, casual стиль"
Выход: "Full body portrait of a person in a modern cozy cafe, wearing casual business attire - fitted jeans and stylish sweater, standing confidently near a wooden table, natural daylight from large windows, warm ambient lighting, professional photography, high quality, maintaining facial features"

Верни ТОЛЬКО итоговый промпт, без объяснений."""
    else:  # frame
        system_prompt = """Ты эксперт по генерации промптов для AI image generation (Seedream v4 edit mode).

Пользователь даст описание эмоции/изменения для кадра анимации. Твоя задача:
1. Расширить это в детальный промпт для вариации кадра
2. Сохранить композицию и локацию (same location and pose)
3. Изменить только выражение лица, жесты, эмоцию
4. Промпт на английском

Пример:
Вход: "удивленное выражение"
Выход: "Same person in the same location and pose, surprised expression with raised eyebrows and slightly open mouth, animated gesture, maintaining overall composition, high quality"

Верни ТОЛЬКО итоговый промпт, без объяснений."""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )
        
        enhanced = response.choices[0].message.content.strip()
        print(f"[GPT] Enhanced prompt: {enhanced}")
        return enhanced
    except Exception as e:
        print(f"[GPT] Enhancement failed: {e}, using original prompt")
        return user_prompt


def generate_fashion_frame(
    prompt: str, 
    aspect_ratio: str = "9:16",
    reference_image: Optional[str] = None
) -> str:
    """
    Generate a fashion image using FAL.ai Seedream v4
    
    Uses:
    - Seedream v4 edit: when prompt + reference_image provided (edit mode)
    - Seedream v4 text-to-image: when only prompt provided (generation mode)
    
    Args:
        prompt: The text prompt for image generation (will be enhanced by GPT)
        aspect_ratio: Image aspect ratio ("9:16" for full height, "3:4" for portrait, etc.)
        reference_image: Reference face image URL for edit mode
    
    Returns:
        URL of the generated image
    """
    FAL_API_KEY = os.getenv("FAL_API_KEY")
    
    if not FAL_API_KEY:
        raise ValueError("FAL_API_KEY not set in environment")
    
    # Configure fal_client
    os.environ["FAL_KEY"] = FAL_API_KEY
    
    # Map aspect ratios to dimensions
    dimensions = {
        "9:16": {"width": 1080, "height": 1920},   # Full height portrait
        "4:5": {"width": 1080, "height": 1350},    # Instagram portrait
        "16:9": {"width": 1920, "height": 1080},   # Landscape
        "3:4": {"width": 1080, "height": 1440},    # Portrait full body
        "1:1": {"width": 1080, "height": 1080},    # Square
    }
    
    size = dimensions.get(aspect_ratio, dimensions["3:4"])
    
    try:
        if reference_image:
            # EDIT MODE: Seedream v4 edit with reference image
            print(f"[Seedream v4 Edit] Reference image: {reference_image[:80]}...")
            print(f"[Seedream v4 Edit] Original prompt: {prompt}")
            
            # Enhance prompt with GPT
            enhanced_prompt = enhance_prompt_with_gpt(prompt, mode="location")
            
            result = fal_client.subscribe(
                "fal-ai/bytedance/seedream/v4/edit",
                arguments={
                    "prompt": enhanced_prompt,
                    "image_urls": [reference_image],  # Face reference
                    "image_size": size,
                    "num_images": 1,
                    "enable_safety_checker": False,
                    "enhance_prompt_mode": "standard"
                }
            )
        else:
            # TEXT-TO-IMAGE MODE: Seedream v4 text-to-image
            print(f"[Seedream v4 Text2Img] Prompt: {prompt}")
            
            result = fal_client.subscribe(
                "fal-ai/bytedance/seedream/v4/text-to-image",
                arguments={
                    "prompt": prompt,
                    "image_size": size,
                    "num_images": 1,
                    "enable_safety_checker": False
                }
            )
        
        # Extract image URL from result
        if "images" in result and len(result["images"]) > 0:
            image_url = result["images"][0]["url"]
            print(f"[Seedream] Success! URL: {image_url[:80]}...")
            
            # Try to upload to S3 for persistence (FAL URLs expire after 24h)
            try:
                s3_url = upload_fal_image_to_s3(image_url, f"fashion-{uuid4()}.jpg")
                print(f"[S3] Uploaded to: {s3_url[:80]}...")
                return s3_url
            except Exception as s3_error:
                print(f"[S3] Upload failed, using FAL URL: {s3_error}")
                return image_url  # Fallback to FAL URL
        else:
            raise Exception(f"No image returned from FAL.ai: {result}")
            
    except Exception as e:
        print(f"[Seedream] ERROR: {e}")
        import traceback
        traceback.print_exc()
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
    import requests
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
