import os
import json
import urllib.request


def _fal_call(path: str, payload: dict) -> dict | None:
    api_key = os.getenv("FAL_API_KEY")
    if not api_key:
        return None
    url = f"https://fal.run/{path}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Key {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None


def generate_image(prompt: str) -> str:
    # Example: Stable Diffusion XL endpoint (adjust to your FAL endpoint)
    data = _fal_call("fal-ai/flux/dev/image", {"prompt": prompt, "num_inference_steps": 20})
    if data and isinstance(data, dict):
        # Try common fields for URL
        url = data.get("image_url") or data.get("url") or data.get("images", [{}])[0].get("url")
        if url:
            return url
    return "https://placehold.co/600x800?text=Image"


def generate_video(prompt: str) -> str:
    data = _fal_call("fal-ai/flux/dev/video", {"prompt": prompt, "num_frames": 48})
    if data and isinstance(data, dict):
        url = data.get("video_url") or data.get("url")
        if url:
            return url
    return "https://placehold.co/600x800?text=Video"


def generate_talking_avatar(image_url: str, audio_url: str, prompt: str = "A person talking", num_frames: int = 145, resolution: str = "480p") -> dict:
    """
    Generate talking avatar video using InfiniTalk model from fal.ai
    
    Args:
        image_url: URL of the input image (face/avatar)
        audio_url: URL of the audio file to lip-sync to
        prompt: Text prompt to guide video generation
        num_frames: Number of frames (41-721), default 145
        resolution: "480p" or "720p", default "480p"
    
    Returns:
        dict with 'video_url' and 'seed' keys
    """
    payload = {
        "image_url": image_url,
        "audio_url": audio_url,
        "prompt": prompt,
        "num_frames": num_frames,
        "resolution": resolution,
        "acceleration": "regular"
    }
    
    data = _fal_call("fal-ai/infinitalk", payload)
    
    if data and isinstance(data, dict):
        # InfiniTalk returns: {"video": {"url": "...", "file_size": ..., ...}, "seed": ...}
        video_info = data.get("video", {})
        video_url = video_info.get("url") if isinstance(video_info, dict) else None
        seed = data.get("seed")
        
        if video_url:
            return {
                "video_url": video_url,
                "seed": seed,
                "file_size": video_info.get("file_size"),
                "file_name": video_info.get("file_name")
            }
    
    raise Exception("Failed to generate talking avatar video")
