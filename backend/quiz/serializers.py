from rest_framework import serializers
from .models import Quiz, Question


class GenerateQuizSerializer(serializers.Serializer):
    document_id = serializers.IntegerField()
    num_questions = serializers.IntegerField(min_value=5, max_value=50, default=10)
    difficulty = serializers.ChoiceField(
        choices=["FACILE", "MOYEN", "DIFFICILE", "ADAPTATIF"], default="MOYEN"
    )


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ["id", "type", "text", "options", "source_page"]


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ["id", "document", "difficulty", "num_questions", "created_at", "score", "questions"]