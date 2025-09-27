from rest_framework import serializers
from taggit.serializers import TagListSerializerField, TaggitSerializer

from .models import TravelJournal, Photos, Review



class TravelJournalSerializer(TaggitSerializer, serializers.ModelSerializer):
    tags = TagListSerializerField(required=False)
    # automatically sets the User ID
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    photos = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TravelJournal
        fields = (
            "id",
            "user",       
            "title",
            "notes",
            "tags",
            "photos",      
            "created",
            "updated",
        )
        read_only_fields = ("id", "created", "updated")

    def get_photos(self, obj):
        request = self.context.get("request")
        urls = []
        for p in obj.photos.all():
            if hasattr(p.photo, "url"):
                url = p.photo.url
                if request is not None:
                    url = request.build_absolute_uri(url)
                urls.append(url)
        return urls


class PhotosSerializer(TaggitSerializer, serializers.ModelSerializer):

    journal_entry = serializers.PrimaryKeyRelatedField(
        queryset=TravelJournal.objects.all()
    )
    photo = serializers.ImageField(write_only=True)
    url = serializers.SerializerMethodField(read_only=True)


    class Meta:
        model = Photos
        fields = ("id", "journal_entry", "photo", "url", "created")
        read_only_fields = ("id", "created")


    def get_url(self, obj):
        if not obj.photo or not hasattr(obj.photo, "url"):
            return None
        request = self.context.get("request")
        url = obj.photo.url
        return request.build_absolute_uri(url) if request else url





class ReviewSerializer(serializers.ModelSerializer):

    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    
    class Meta:
        model = Review
        fields = (
            "id",
            "user",
            "rating",
            "comment",
            "recommended",  
            "visibility",
            "date",          
            "created",      
        )
        read_only_fields = ("id", "date", "created")


    def to_internal_value(self, data):
        allowed = set(self.fields.keys())
        filtered = {k: v for k, v in dict(data).items() if k in allowed}
        return super().to_internal_value(filtered)


class PublicReviewSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source="user.username", read_only=True)
    # Robust timestamp that works whether your model uses `created` or `date`
    timestamp = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ["id", "author", "rating", "comment", "timestamp"]

    def get_timestamp(self, obj):
        return getattr(obj, "created", None) or getattr(obj, "date", None)
