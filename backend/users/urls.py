from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserViewSet, CustomTokenObtainPairView

router = DefaultRouter()
router.register(r'', UserViewSet)

urlpatterns = [
    # Auth endpoints
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Invitation routes
    path('invitation/<uuid:pk>/', UserViewSet.as_view({'delete': 'delete_invitation'}), name='delete-invitation'),
    path('invitation/<str:token>/', UserViewSet.as_view({'get': 'get_invitation'}), name='get-invitation'),
    
    # User endpoints
    path('', include(router.urls)),
]
