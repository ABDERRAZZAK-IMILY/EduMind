from django.urls import path
from .views import GenerateQuizView, SubmitQuizView, QuizListView


urlpatterns = [
    path("", QuizListView.as_view(), name="quiz-list"),
    path("generate/", GenerateQuizView.as_view(), name="generate-quiz"),
    path("<int:quiz_id>/submit/", SubmitQuizView.as_view(), name="submit-quiz"),
]