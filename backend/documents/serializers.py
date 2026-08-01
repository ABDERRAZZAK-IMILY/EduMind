from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["id", "name", "status", "size_mb", "created_at"]
        read_only_fields = ["id", "status", "created_at"]


class UploadUrlRequestSerializer(serializers.Serializer):
    file_name = serializers.CharField(max_length=255)
    size_mb = serializers.FloatField()