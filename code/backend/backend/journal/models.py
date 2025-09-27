from django.db import models


from django.utils.text import slugify
from datetime import date
from django.db import models
from taggit.managers import TaggableManager

from authx.models import CustomUser

from django.core.validators import MinValueValidator, MaxValueValidator


def get_journal_upload_path(instance, filename):
    """Store under date + (trip slug or journal title slug)."""
    current_date = date.today().isoformat()
    j = instance.journal_entry  # Photos → FK to TravelJournal
    base = slugify(j.trip.name) if getattr(j, "trip_id", None) else slugify(j.title)
    base = base or "journal"
    return f"photos/{current_date}/{base}/{filename}"

#  Backwards-compatibility for old migrations/imports:
def get_trip_upload_path(instance, filename):
    # Delegate to the new function so old migrations keep working
    return get_journal_upload_path(instance, filename)


class TravelJournal(models.Model):
    #trip = models.ForeignKey(Trip, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    title = models.CharField(max_length=100, blank=False, verbose_name="Title")
    notes = models.TextField()
    tags = TaggableManager()

    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Journal '{self.title}' by {self.user.username} on {self.created:%Y-%m-%d}"


class Photos(models.Model):

    photo = models.FileField(upload_to=get_journal_upload_path)
    journal_entry = models.ForeignKey(
        "TravelJournal", on_delete=models.CASCADE, related_name="photos"
    )

    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo for {self.journal_entry}"


class Review(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    comment = models.TextField()

    date = models.DateTimeField(auto_now_add=True)


    recommended = models.BooleanField(default=False)
    visibility = models.CharField(
        max_length=10,
        choices=[("public", "Public"), ("private", "Private"), ("friends", "Shared with Friends")],
        default="public",
    )
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.username} - Rating: {self.rating}"
