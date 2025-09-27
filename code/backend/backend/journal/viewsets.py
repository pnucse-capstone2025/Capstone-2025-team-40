from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, mixins, permissions
from rest_framework.parsers import MultiPartParser, FormParser, FileUploadParser
from rest_framework.exceptions import PermissionDenied
from rest_framework.exceptions import ValidationError


from .models import TravelJournal, Photos, Review
from .serializers import TravelJournalSerializer, PhotosSerializer, ReviewSerializer


from .serializers import PublicReviewSerializer, ReviewSerializer  


class TravelJournalViewSet(viewsets.ModelViewSet):
    queryset = TravelJournal.objects.all() 
    serializer_class = TravelJournalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # show only my journals
        return TravelJournal.objects.filter(user=self.request.user).select_related("user")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)  # belt & suspenders

    def perform_update(self, serializer):
        if serializer.instance.user_id != self.request.user.id:
            raise PermissionDenied("You can only edit your own journal entries.")
        serializer.save(user=self.request.user)

    def get_queryset(self):
        return (TravelJournal.objects.filter(user=self.request.user).select_related("user").prefetch_related("photos"))



class PhotosViewSet(viewsets.ModelViewSet):
    queryset = Photos.objects.all() 
    serializer_class = PhotosSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, FileUploadParser]

    def get_queryset(self):
        # only photos from my journals
        return Photos.objects.filter(journal_entry__user=self.request.user).select_related("journal_entry")

    #def perform_create(self, serializer):
        #journal = serializer.validated_data.get("journal_entry")
        #if journal.user_id != self.request.user.id:
            #raise PermissionDenied("You can only upload photos to your own journals.")
        #serializer.save()

    def perform_create(self, serializer):
        journal = serializer.validated_data.get("journal_entry")
        if not journal:
            raise ValidationError({"journal_entry": "This field is required."})
        if journal.user_id != self.request.user.id:
            raise PermissionDenied("You can only upload photos to your own journals.")
        serializer.save()

    def perform_update(self, serializer):
        if serializer.instance.journal_entry.user_id != self.request.user.id:
            raise PermissionDenied("You can only modify your own photos.")
        serializer.save()
        
    




class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all() 
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # simplest: show only my reviews
        return Review.objects.filter(user=self.request.user).select_related("user")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.user_id != self.request.user.id:
            raise PermissionDenied("You can only edit your own reviews.")
        serializer.save(user=self.request.user)


#PUBLIC REVIEWS    
class PublicReviewViewSet(mixins.ListModelMixin,
                          mixins.RetrieveModelMixin,
                          viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = PublicReviewSerializer  # small, safe fields for public

    def get_queryset(self):
        return (
            Review.objects.filter(visibility="public").select_related("user").order_by("-created"))