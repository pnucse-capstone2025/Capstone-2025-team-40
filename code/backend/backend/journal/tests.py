from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from authx.models import CustomUser
from .models import TravelJournal, Photos, Review


class TestTravelJournalViewSet(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username="testuser", password="testpassword"
        )
        self.journal = TravelJournal.objects.create(
            user=self.user,
            title="Test Travel Journal",
            notes="This is a test travel journal entry",
            tags=["tag1", "tag2"],
        )

    def test_create_travel_journal(self):
        self.client.force_login(self.user)
        data = {
            "user": self.user.pk,
            "title": "Travel Journal",
            "notes": "This is a test travel journal entry",
            "tags": ["tagA", "tagB", "tagC"],
        }
        response = self.client.post("/journal/travel-journal/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(TravelJournal.objects.filter(title="Travel Journal").exists())

    def test_list_travel_journal(self):
        self.client.force_login(self.user)
        response = self.client.get("/journal/travel-journal/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_retrieve_travel_journal(self):
        self.client.force_login(self.user)
        response = self.client.get(f"/journal/travel-journal/{self.journal.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Test Travel Journal")

    def test_update_travel_journal(self):
        self.client.force_login(self.user)
        updated_data = {
            "user": self.user.pk,
            "title": "Updated Travel Journal",
            "notes": "Updated notes",
            "tags": ["tag3", "tag4"],
        }
        response = self.client.put(
            f"/journal/travel-journal/{self.journal.id}/", updated_data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.journal.refresh_from_db()
        self.assertEqual(self.journal.title, "Updated Travel Journal")

    def test_delete_travel_journal(self):
        self.client.force_login(self.user)
        response = self.client.delete(f"/journal/travel-journal/{self.journal.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(TravelJournal.objects.count(), 0)

    def tearDown(self):
        CustomUser.objects.all().delete()
        TravelJournal.objects.all().delete()


class TestPhotosViewSet(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username="testuser", password="testpassword"
        )
        self.travel_journal = TravelJournal.objects.create(
            user=self.user,
            title="Test Travel Journal",
            notes="This is a test travel journal entry",
            tags=["tag1", "tag2"],
        )
        self.photos = Photos.objects.create(
            journal_entry=self.travel_journal,
            photo="photo.jpg",
            tags=["tag1", "tag2"],
        )

    def test_create_photos(self):
        self.client.force_login(self.user)
        photo_file = SimpleUploadedFile("photo2.jpg", b"content")
        data = {
            "journal_entry": self.travel_journal.pk,
            "photo": photo_file,
            "tags": ["tag1", "tag2"],
        }
        response = self.client.post("/journal/photos/", data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("photo", response.data)

    def test_list_photos(self):
        self.client.force_login(self.user)
        response = self.client.get("/journal/photos/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_retrieve_photos(self):
        self.client.force_login(self.user)
        response = self.client.get(f"/journal/photos/{self.photos.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("photo", response.data)

    def test_update_photos(self):
        self.client.force_login(self.user)
        updated_photo = SimpleUploadedFile("updated_photo.jpg", b"updated content")
        updated_data = {
            "journal_entry": self.travel_journal.pk,
            "photo": updated_photo,
            "tags": ["tag3", "tag4"],
        }
        response = self.client.put(
            f"/journal/photos/{self.photos.id}/", updated_data, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.photos.refresh_from_db()
        self.assertIn("photo", response.data)

    def test_delete_photos(self):
        self.client.force_login(self.user)
        response = self.client.delete(f"/journal/photos/{self.photos.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Photos.objects.count(), 0)

    def tearDown(self):
        CustomUser.objects.all().delete()
        Photos.objects.all().delete()
        TravelJournal.objects.all().delete()


class TestReviewViewSet(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username="testuser", password="testpassword"
        )
        self.review = Review.objects.create(
            user=self.user,
            rating=5,
            comment="This is a test review",
        )

    def test_create_review(self):
        self.client.force_login(self.user)
        data = {    
            "comment": "This is a test review",
            "rating": 7,
            "recommended": True,
            "visibility": "public",
        }
        response = self.client.post("/journal/my-reviews/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.count(), 2)
        self.assertEqual(Review.objects.get(id=self.review.id).rating, 5)

    def test_list_review(self):
        self.client.force_login(self.user)
        response = self.client.get("/journal/my-reviews/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_retrieve_review(self):
        self.client.force_login(self.user)
        response = self.client.get(f"/journal/my-reviews/{self.review.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["rating"], 5)

    def test_update_review(self):
        self.client.force_login(self.user)
        updated_data = {
            "rating": 7,
            "comment": "Updated test review",
            "recommended": False,
            "visibility": "private",
        }
        response = self.client.put(
            f"/journal/my-reviews/{self.review.id}/", updated_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["rating"], 7)

    def test_delete_review(self):
        self.client.force_login(self.user)
        response = self.client.delete(f"/journal/my-reviews/{self.review.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Review.objects.count(), 0)

    def tearDown(self):
        CustomUser.objects.all().delete()
        Review.objects.all().delete()
