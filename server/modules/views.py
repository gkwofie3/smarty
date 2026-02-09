from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Module, Page
from .serializers import ModuleSerializer, PageSerializer
from helper.viewsets import BaseDuplicateViewSet

class ModuleViewSet(BaseDuplicateViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']

    def execute_duplication(self, instance, count, include_children, names):
        return self.perform_duplication(
            instance, count, include_children, names,
            child_relation_name='pages',
            child_model=Page,
            fk_name='module'
        )

class PageViewSet(BaseDuplicateViewSet):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']

    @action(detail=False, methods=['get'], url_path='dashboard')
    def get_dashboard(self, request):
        try:
            dashboard_page = Page.objects.get(is_dashboard=True)
            serializer = self.get_serializer(dashboard_page)
            return Response(serializer.data)
        except Page.DoesNotExist:
            return Response({"detail": "No dashboard page configured"}, status=status.HTTP_404_NOT_FOUND)

    def get_queryset(self):
        queryset = Page.objects.all()
        module_id = self.request.query_params.get('module', None)
        if module_id is not None:
            queryset = queryset.filter(module_id=module_id)
        return queryset

    def execute_duplication(self, instance, count, include_children, names):
        return self.perform_duplication(
            instance, count, False, names,
            child_relation_name=None,
            child_model=None,
            fk_name=None
        )
