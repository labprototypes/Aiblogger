import os
import mimetypes
import urllib.request
from typing import Optional

import boto3


def _s3_client():
    endpoint = os.getenv("AWS_S3_ENDPOINT")
    region = os.getenv("AWS_REGION")
    session = boto3.session.Session()
    return session.client(
        "s3",
        region_name=region,
        endpoint_url=endpoint if endpoint else None,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )


def _public_url(bucket: str, key: str) -> str:
    # Allow overriding the public base URL (for custom S3-compatible providers)
    base = os.getenv("AWS_S3_PUBLIC_BASE")
    if base:
        return f"{base.rstrip('/')}/{key}"
    endpoint = os.getenv("AWS_S3_ENDPOINT")
    region = os.getenv("AWS_REGION", "us-east-1")
    if endpoint:
        return f"{endpoint.rstrip('/')}/{bucket}/{key}"
    # Default AWS URL pattern
    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"


def upload_bytes(key: str, data: bytes, content_type: Optional[str] = None) -> str:
    bucket = os.getenv("AWS_S3_BUCKET")
    if not bucket:
        raise RuntimeError("AWS_S3_BUCKET is not set")
    if not content_type:
        content_type = "application/octet-stream"
    s3 = _s3_client()
    s3.put_object(Bucket=bucket, Key=key, Body=data, ContentType=content_type, ACL="public-read")
    return _public_url(bucket, key)


def upload_url_to_s3(url: str, key: str, content_type: Optional[str] = None) -> str:
    with urllib.request.urlopen(url, timeout=120) as resp:
        data = resp.read()
        ct = content_type or resp.headers.get("Content-Type")
    if not ct:
        # Guess from extension
        guess, _ = mimetypes.guess_type(url)
        ct = guess or "application/octet-stream"
    return upload_bytes(key, data, ct)
