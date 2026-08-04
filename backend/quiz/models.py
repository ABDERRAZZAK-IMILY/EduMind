from django.db import models
from django.conf import settings
from documents.models import Document


class Quiz(models.Model):
    class Difficulty(models.TextChoices):
        FACILE = "FACILE", "Facile"
        MOYEN = "MOYEN", "Moyen"
        DIFFICILE = "DIFFICILE", "Difficile"
        ADAPTATIF = "ADAPTATIF", "Adaptatif"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quizzes")
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="quizzes")
    difficulty = models.CharField(max_length=20, choices=Difficulty.choices, default=Difficulty.MOYEN)
    num_questions = models.PositiveIntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Quiz #{self.id} - {self.document.name}"


class Question(models.Model):
    class Type(models.TextChoices):
        QCM = "QCM", "QCM"
        VRAI_FAUX = "VRAI_FAUX", "Vrai/Faux"
        OUVERTE = "OUVERTE", "Question ouverte"

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    type = models.CharField(max_length=20, choices=Type.choices)
    text = models.TextField()
    options = models.JSONField(null=True, blank=True)
    correct_answer = models.TextField()
    explanation = models.TextField(blank=True)
    source_page = models.PositiveIntegerField(null=True, blank=True)

   
    submitted_answer = models.TextField(null=True, blank=True)
    is_correct = models.BooleanField(null=True, blank=True)
    feedback = models.TextField(blank=True)

    def __str__(self):
        return f"Q{self.id} ({self.type})"