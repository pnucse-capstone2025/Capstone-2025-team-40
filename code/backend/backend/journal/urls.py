from rest_framework import routers
from django.urls import path, include

from .viewsets import TravelJournalViewSet, PhotosViewSet, ReviewViewSet
from rest_framework.routers import DefaultRouter
from .viewsets import ReviewViewSet, PublicReviewViewSet

app_name = "journal"

router = routers.DefaultRouter()
router.register(r"travel-journal", TravelJournalViewSet, basename="traveljournal")
router.register(r"photos", PhotosViewSet, basename="photos")
router.register(r"my-reviews", ReviewViewSet, basename="my-reviews")
router.register(r"reviews", PublicReviewViewSet, basename="public-reviews")# public read-only




urlpatterns = [path("", include(router.urls))]

urlpatterns += router.urls
