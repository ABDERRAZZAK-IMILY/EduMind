from django.urls import path
from .views import (
    DocumentListView,
    RequestUploadUrlView,
    ConfirmUploadView,
    DocumentDetailView,
)

urlpatterns = [
    path("", DocumentListView.as_view(), name="document-list"),
    path("upload-url/", RequestUploadUrlView.as_view(), name="request-upload-url"),
    path("<int:document_id>/confirm-upload/", ConfirmUploadView.as_view(), name="confirm-upload"),
    path("<int:document_id>/", DocumentDetailView.as_view(), name="document-detail"),
]
