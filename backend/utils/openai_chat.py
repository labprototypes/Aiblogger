import os
import json
import urllib.request


def generate_text(prompt: str, max_tokens: int = 500, system_prompt: str = None) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    if not api_key:
        return f"[AI Draft] {prompt}"

    default_system = "You are a helpful assistant that writes concise social media scripts."
    
    try:
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(
                {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt or default_system},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.7,
                    "max_tokens": max_tokens,
                }
            ).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
            return payload["choices"][0]["message"]["content"].strip()
    except Exception:
        return f"[AI Draft] {prompt}"
