from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeviceViewSet, RegisterViewSet, PointGroupViewSet, PointViewSet

router = DefaultRouter()
router.register(r'devices', DeviceViewSet)
router.register(r'registers', RegisterViewSet)
router.register(r'point-groups', PointGroupViewSet)
router.register(r'points', PointViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
