from django.contrib import admin

from .models import TravelJournal, Photos, Review


@admin.register(TravelJournal)
class TravelJournalAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "created", "updated")


@admin.register(Photos)
class PhotosAdmin(admin.ModelAdmin):
    list_display = ("journal_entry", "created")

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("user", "rating", "visibility", "date")


