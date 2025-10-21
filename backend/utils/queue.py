import os
from rq import Queue
from redis import Redis


def _redis_conn() -> Redis:
    url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    return Redis.from_url(url)


def enqueue(job_func, *args, **kwargs) -> str:
    q = Queue(connection=_redis_conn())
    job = q.enqueue(job_func, *args, **kwargs)
    return job.id
