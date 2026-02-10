from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlarmViewSet, EventViewSet, LogViewSet, FaultViewSet

router = DefaultRouter()
router.register(r'alarms', AlarmViewSet)
router.register(r'events', EventViewSet)
router.register(r'logs', LogViewSet)
router.register(r'faults', FaultViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
