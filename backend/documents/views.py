import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Document
from .serializers import UploadUrlRequestSerializer, DocumentSerializer
from .storage import generate_presigned_upload_url


class RequestUploadUrlView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UploadUrlRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file_name = serializer.validated_data["file_name"]
        size_mb = serializer.validated_data["size_mb"]

        # stop user to upload same document
        if Document.objects.filter(owner=request.user, name=file_name).exists():
            return Response(
                {"detail": "Ce document existe déjà."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        object_key = f"{request.user.id}/{uuid.uuid4()}_{file_name}"

        document = Document.objects.create(
            owner=request.user,
            name=file_name,
            file_key=object_key,
            size_mb=size_mb,
            status=Document.Status.UPLOADED,
        )

        upload_url = generate_presigned_upload_url(object_key)

        return Response(
            {
                "document": DocumentSerializer(document).data,
                "upload_url": upload_url,
            },
            status=status.HTTP_201_CREATED,
        )