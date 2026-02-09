from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Device, Register, PointGroup, Point
from .serializers import (
    DeviceSerializer, RegisterSerializer, 
    PointGroupSerializer, PointSerializer
)
from helper.viewsets import BaseDuplicateViewSet
from django.db import transaction
import copy

class DeviceViewSet(BaseDuplicateViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'device_type', 'slug']
    ordering_fields = ['name', 'id']

    def execute_duplication(self, instance, count, include_children, names):
        return self.perform_duplication(
            instance, count, include_children, names,
            child_relation_name='registers',
            child_model=Register,
            fk_name='device'
        )

class RegisterViewSet(BaseDuplicateViewSet):
    queryset = Register.objects.all()
    serializer_class = RegisterSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'address']
    
    def get_queryset(self):
        queryset = Register.objects.all()
        device_id = self.request.query_params.get('device', None)
        if device_id is not None:
            queryset = queryset.filter(device_id=device_id)
        return queryset

    def execute_duplication(self, instance, count, include_children, names):
        # Registers don't have children to duplicate in this context
        return self.perform_duplication(
            instance, count, False, names,
            child_relation_name=None,
            child_model=None,
            fk_name=None
        )

class PointGroupViewSet(BaseDuplicateViewSet):
    queryset = PointGroup.objects.all()
    serializer_class = PointGroupSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['order', 'name']

    def execute_duplication(self, instance, count, include_children, names):
         return self.perform_duplication(
            instance, count, include_children, names,
             child_relation_name='points', # related_name='points'
             child_model=Point,
             fk_name='point_group',
             reset_fields=['order']
        )

class PointViewSet(BaseDuplicateViewSet):
    queryset = Point.objects.all()
    serializer_class = PointSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        queryset = Point.objects.all()
        group_id = self.request.query_params.get('point_group', None)
        if group_id is not None:
            queryset = queryset.filter(point_group_id=group_id)
        return queryset

    def execute_duplication(self, instance, count, include_children, names):
        # Points don't have children to duplicate in this context
        return self.perform_duplication(
            instance, count, False, names,
            child_relation_name=None,
            child_model=None,
            fk_name=None
        )
