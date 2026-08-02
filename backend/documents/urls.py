from django.urls import path
from .views import RequestUploadUrlView

urlpatterns = [
    path("upload-url/", RequestUploadUrlView.as_view(), name="request-upload-url"),
]