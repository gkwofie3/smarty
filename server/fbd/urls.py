from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FBDProgramViewSet

router = DefaultRouter()
router.register(r'programs', FBDProgramViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
