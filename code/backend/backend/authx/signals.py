# auth/signals.py
from django.dispatch import receiver
from django.core.mail import EmailMessage
from django.urls import reverse
from django.conf import settings
from django.db.models.signals import post_save

from django_rest_passwordreset.signals import reset_password_token_created

from .utils import CustomTokenGenerator
from .models import Profile  

custom_token_generator = CustomTokenGenerator()


@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):
    custom_token = custom_token_generator.generate_token()
    reset_password_token.key = custom_token
    reset_password_token.save()


    reset_url = f"{settings.FRONTEND_RESET_URL}?token={reset_password_token.key}"


    context = {
        "current_user": reset_password_token.user,
        "username": reset_password_token.user.username,
        "email": reset_password_token.user.email,
        "reset_password_url": "{}?token={}".format(
            instance.request.build_absolute_uri(reverse("authx:password_reset_confirm")),
            reset_password_token.key,
        ),
    }

    email_msg = (
        f"Hello {context['username']}, "
        f"We've received a request to reset your password. "
        f"Please click on the link below to reset your password: {reset_url}"
    )

    msg = EmailMessage(
        f"Schedulane: Password reset for {reset_password_token.user.email}",
        email_msg,
        settings.DEFAULT_FROM_EMAIL,
        [reset_password_token.user.email],
    )
    msg.send()


# NEW: ensure each new user has a Profile row
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)
