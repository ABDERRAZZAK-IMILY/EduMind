from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import get_object_or_404
from rest_framework import status
from django.http import StreamingHttpResponse

from documents.models import Document
from documents.services import get_groq_client
from .serializers import AskQuestionSerializer
from agents.crews import run_chat_workflow, prepare_pedagogical_prompt


class AskQuestionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AskQuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        document_id = serializer.validated_data["document_id"]
        question = serializer.validated_data["question"]
        level = serializer.validated_data.get("level", "INTERMEDIAIRE")

        document = get_object_or_404(Document, id=document_id, owner=request.user)

        if document.status != Document.Status.READY and document.status != Document.Status.PROCESSING:
            return Response(
                {"detail": "Ce document n'est pas encore prêt pour être interrogé."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        answer = run_chat_workflow(document_id, question, level=level)
        return Response({"answer": answer})


class AskQuestionStreamView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AskQuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        document_id = serializer.validated_data["document_id"]
        question = serializer.validated_data["question"]
        level = serializer.validated_data.get("level", "INTERMEDIAIRE")

        document = get_object_or_404(Document, id=document_id, owner=request.user)

        # Agent Pédagogique prépare le prompt structuré avec le contexte RAG et le niveau
        prompt, _, _ = prepare_pedagogical_prompt(document_id, question, level=level)

        def event_stream():
            groq_client = get_groq_client()
            stream = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                stream=True,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    # Remplacement des sauts de ligne pour éviter de casser le format SSE
                    escaped_delta = delta.replace("\n", "\\n")
                    yield f"data: {escaped_delta}\n\n"
            yield "data: [DONE]\n\n"

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response