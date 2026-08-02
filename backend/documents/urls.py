from django.urls import path
from .views import RequestUploadUrlView , ConfirmUploadView

urlpatterns = [
    path("upload-url/", RequestUploadUrlView.as_view(), name="request-upload-url"),
    path("upload-url/", RequestUploadUrlView.as_view(), name="request-upload-url"),
    path("<int:document_id>/confirm-upload/", ConfirmUploadView.as_view(), name="confirm-upload"),
]
