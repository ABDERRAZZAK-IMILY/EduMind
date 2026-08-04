from django.urls import path
from .views import AskQuestionView, AskQuestionStreamView


urlpatterns = [
    path("ask/", AskQuestionView.as_view(), name="ask-question"),
    path("ask-stream/", AskQuestionStreamView.as_view(), name="ask-question-stream"),
]