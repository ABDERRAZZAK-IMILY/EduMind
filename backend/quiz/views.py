from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .serializers import GenerateQuizSerializer, QuizSerializer
from .services import create_quiz_with_questions

from rest_framework.generics import get_object_or_404
from .serializers import SubmitQuizSerializer
from .services import submit_quiz
from .models import Quiz


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



class SubmitQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, id=quiz_id, owner=request.user)

        serializer = SubmitQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quiz = submit_quiz(quiz, serializer.validated_data["answers"])

        return Response(QuizSerializer(quiz).data)