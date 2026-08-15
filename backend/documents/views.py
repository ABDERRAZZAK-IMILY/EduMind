import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.generics import get_object_or_404

from .models import Document
from .serializers import UploadUrlRequestSerializer, DocumentSerializer
from .storage import (
    generate_presigned_upload_url,
    generate_presigned_download_url,
    delete_file_from_minio,
)
from .services import process_document, delete_document_vectors


class DocumentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        documents = Document.objects.filter(owner=request.user).order_by("-created_at")
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)


class RequestUploadUrlView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UploadUrlRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file_name = serializer.validated_data["file_name"]
        size_mb = serializer.validated_data["size_mb"]

        existing_doc = Document.objects.filter(owner=request.user, name=file_name).first()
        if existing_doc:
            if existing_doc.status in [Document.Status.FAILED, Document.Status.UPLOADED]:
                delete_file_from_minio(existing_doc.file_key)
                delete_document_vectors(existing_doc.id)
                existing_doc.delete()
            else:
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

        upload_url = generate_presigned_upload_url(object_key, content_type="application/pdf")

        return Response(
            {
                "document": DocumentSerializer(document).data,
                "upload_url": upload_url,
            },
            status=status.HTTP_201_CREATED,
        )


class ConfirmUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, document_id):
        document = get_object_or_404(Document, id=document_id, owner=request.user)
        document.status = Document.Status.PROCESSING
        document.save()

        # Traitement extraction PDF + chunking + embeddings dans Chroma
        document = process_document(document)

        return Response(DocumentSerializer(document).data)


class DocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, document_id):
        document = get_object_or_404(Document, id=document_id, owner=request.user)
        download_url = generate_presigned_download_url(document.file_key)
        data = DocumentSerializer(document).data
        data["download_url"] = download_url
        return Response(data)

    def delete(self, request, document_id):
        document = get_object_or_404(Document, id=document_id, owner=request.user)
        delete_file_from_minio(document.file_key)
        delete_document_vectors(document.id)
        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)