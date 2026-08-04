from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import get_object_or_404
from rest_framework import status

from documents.models import Document
from documents.services import answer_question
from .serializers import AskQuestionSerializer


class AskQuestionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AskQuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        document_id = serializer.validated_data["document_id"]
        question = serializer.validated_data["question"]


        # verfie that the docment is for actuile user
        document = get_object_or_404(Document, id=document_id, owner=request.user)

        if document.status != Document.Status.READY and document.status != Document.Status.PROCESSING:
            return Response(
                {"detail": "Ce document n'est pas encore prêt pour être interrogé."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        answer = answer_question(document_id, question)

        return Response({"answer": answer})