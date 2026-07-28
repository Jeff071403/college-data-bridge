from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FolderViewSet

router = DefaultRouter()
router.register(r'', FolderViewSet, basename='folder')

urlpatterns = [
    path('root/', FolderViewSet.as_view({'get': 'root_contents'}), name='folder-root'),
    path('create/', FolderViewSet.as_view({'post': 'create_custom'}), name='folder-create'),
    path('rename/', FolderViewSet.as_view({'put': 'rename_custom'}), name='folder-rename'),
    path('delete/', FolderViewSet.as_view({'delete': 'delete_custom'}), name='folder-delete'),
    path('', include(router.urls)),
]
