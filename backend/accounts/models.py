from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        APPRENANT = "APPRENANT", "Apprenant"
        ADMINISTRATEUR = "ADMINISTRATEUR", "Administrateur"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.APPRENANT)
    max_documents = models.PositiveIntegerField(default=10)
    max_storage_mb = models.PositiveIntegerField(default=500)