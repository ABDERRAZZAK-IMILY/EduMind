from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import get_object_or_404
from rest_framework import status

from .serializers import GenerateQuizSerializer, SubmitQuizSerializer, QuizSerializer
from .models import Quiz
from agents.crews import run_quiz_generation_workflow, run_quiz_submission_workflow


class GenerateQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GenerateQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quiz = run_quiz_generation_workflow(
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

        quiz = run_quiz_submission_workflow(
            quiz=quiz,
            answers_data=serializer.validated_data["answers"],
            user_email=request.user.email if hasattr(request.user, "email") else None,
        )

        return Response(QuizSerializer(quiz).data)


class QuizListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        quizzes = Quiz.objects.filter(owner=request.user).order_by("-created_at")
        return Response(QuizSerializer(quizzes, many=True).data)