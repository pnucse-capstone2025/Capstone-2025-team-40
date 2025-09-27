from django.db import models
from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.conf import settings

class CustomUser(AbstractUser, PermissionsMixin):
    username = models.CharField(max_length=100, unique=True)
    first_name = models.CharField(max_length=150, blank=True) 
    last_name = models.CharField(max_length=150, blank=True) 

    email = models.EmailField(max_length=255, unique=True, blank=False, null=False)

    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    def __str__(self):
        return str(self.username)


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile",)
    bio = models.TextField(blank=True)
    photo = models.ImageField(upload_to="avatars/", blank=True, null=True)
    birthdate = models.DateField(blank=True, null=True, verbose_name="Date of Birth")

    class Meta:
        ordering = ["user__username"]
        indexes = [models.Index(fields=["user"])]

    def __str__(self):
        return f"{self.user.username}'s profile"
