import boto3
from django.conf import settings


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=f"http://{settings.MINIO_ENDPOINT}",
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
    )


def ensure_bucket_exists():
    client = get_s3_client()
    try:
        client.head_bucket(Bucket=settings.MINIO_BUCKET_NAME)
    except Exception:
        try:
            client.create_bucket(Bucket=settings.MINIO_BUCKET_NAME)
        except Exception:
            pass


def generate_presigned_upload_url(object_key, content_type="application/pdf", expires_in=3600):
    ensure_bucket_exists()
    client = get_s3_client()
    params = {"Bucket": settings.MINIO_BUCKET_NAME, "Key": object_key}
    if content_type:
        params["ContentType"] = content_type
    return client.generate_presigned_url(
        "put_object",
        Params=params,
        ExpiresIn=expires_in,
    )


def generate_presigned_download_url(object_key, expires_in=3600):
    ensure_bucket_exists()
    client = get_s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.MINIO_BUCKET_NAME, "Key": object_key},
        ExpiresIn=expires_in,
    )


def delete_file_from_minio(object_key):
    try:
        client = get_s3_client()
        client.delete_object(Bucket=settings.MINIO_BUCKET_NAME, Key=object_key)
    except Exception:
        pass