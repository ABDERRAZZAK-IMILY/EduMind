from django.db import models
from django.conf import settings


class Document(models.Model):
    class Status(models.TextChoices):
        UPLOADED = "UPLOADED", "Uploaded"
        PROCESSING = "PROCESSING", "Processing"
        READY = "READY", "Ready"
        FAILED = "FAILED", "Failed"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="documents")
    name = models.CharField(max_length=255)
    file_key = models.CharField(max_length=500)  # url of file in  MinIO
    size_mb = models.FloatField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UPLOADED)
    failure_reason = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("owner", "name")  # to stop upload same file for same user

    def __str__(self):
        return f"{self.name} ({self.owner})"