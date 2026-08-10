from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .serializers import GenerateQuizSerializer, QuizSerializer
from .services import create_quiz_with_questions


class GenerateQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GenerateQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quiz = create_quiz_with_questions(
            user=request.user,
            document_id=serializer.validated_data["document_id"],
            num_questions=serializer.validated_data["num_questions"],
            difficulty=serializer.validated_data["difficulty"],
        )

        return Response(QuizSerializer(quiz).data, status=status.HTTP_201_CREATED)