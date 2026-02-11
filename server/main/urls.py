from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlarmViewSet, EventViewSet, LogViewSet, FaultViewSet, DashboardViewSet, writecommand

router = DefaultRouter()
router.register(r'alarms', AlarmViewSet)
router.register(r'events', EventViewSet)
router.register(r'logs', LogViewSet)
router.register(r'faults', FaultViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
    path('write-command/', writecommand, name='write-command'),
]
