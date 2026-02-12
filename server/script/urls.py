from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ScriptProgramViewSet, ScriptBindingViewSet

router = DefaultRouter()
router.register(r'programs', ScriptProgramViewSet)
router.register(r'bindings', ScriptBindingViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
