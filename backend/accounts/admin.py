from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ("EdTech Info", {"fields": ("role", "max_documents", "max_storage_mb")}),
    )
    list_display = ("username", "email", "role", "is_staff")


admin.site.register(User, UserAdmin)