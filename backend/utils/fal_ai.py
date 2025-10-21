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
