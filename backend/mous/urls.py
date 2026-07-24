from django.urls import path
from .views import (
    MOUTemplateListCreateView, MOUTemplateDetailView,
    MOUListCreateView, MOUDetailView,
    MOUSubmitSignedView, MOUApproveRejectView,
    MOURenewView, MOUReportsView
)

urlpatterns = [
    path('templates/', MOUTemplateListCreateView.as_view(), name='mou-template-list-create'),
    path('templates/<int:pk>/', MOUTemplateDetailView.as_view(), name='mou-template-detail'),
    path('', MOUListCreateView.as_view(), name='mou-list-create'),
    path('<int:pk>/', MOUDetailView.as_view(), name='mou-detail'),
    path('<int:pk>/submit-signed/', MOUSubmitSignedView.as_view(), name='mou-submit-signed'),
    path('<int:pk>/approve-reject/', MOUApproveRejectView.as_view(), name='mou-approve-reject'),
    path('<int:pk>/renew/', MOURenewView.as_view(), name='mou-renew'),
    path('reports/stats/', MOUReportsView.as_view(), name='mou-reports-stats'),
]
