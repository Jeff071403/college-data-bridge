from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_google_drive import GoogleDriveViewSet

router = DefaultRouter()
router.register(r'', GoogleDriveViewSet, basename='google-drive')

urlpatterns = router.urls
