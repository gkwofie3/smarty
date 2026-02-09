from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ModuleViewSet, PageViewSet

router = DefaultRouter()
router.register(r'modules', ModuleViewSet)
router.register(r'pages', PageViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
