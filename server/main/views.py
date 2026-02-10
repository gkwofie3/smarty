from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Alarm, Event, Log, Fault
from .serializers import AlarmSerializer, EventSerializer, LogSerializer, FaultSerializer

class AlarmViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Alarm.objects.all().order_by('-start_time')
    serializer_class = AlarmSerializer

    def get_queryset(self):
        queryset = Alarm.objects.all().order_by('-start_time')
        
        # Filtering
        active = self.request.query_params.get('active')
        if active == 'true':
            queryset = queryset.filter(is_active=True)
        elif active == 'false':
            queryset = queryset.filter(is_active=False)

        acknowledged = self.request.query_params.get('acknowledged')
        if acknowledged == 'true':
            queryset = queryset.filter(is_acknowledged=True)
        elif acknowledged == 'false':
            queryset = queryset.filter(is_acknowledged=False)

        cleared = self.request.query_params.get('cleared')
        if cleared == 'true':
            queryset = queryset.filter(is_cleared=True)
        elif cleared == 'false':
            queryset = queryset.filter(is_cleared=False)

        return queryset

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        alarm = self.get_object()
        if not alarm.is_acknowledged:
            alarm.is_acknowledged = True
            alarm.acknowledged_by = request.user.username if request.user.is_authenticated else 'System'
            alarm.acknowledged_time = timezone.now()
            alarm.save()
        return Response({'status': 'alarm acknowledged'})

    @action(detail=False, methods=['post'])
    def acknowledge_all(self, request):
        alarms = self.get_queryset().filter(is_acknowledged=False)
        count = alarms.update(
            is_acknowledged=True, 
            acknowledged_by=request.user.username if request.user.is_authenticated else 'System',
            acknowledged_time=timezone.now()
        )
        return Response({'status': 'all alarms acknowledged', 'count': count})

    @action(detail=True, methods=['post'])
    def clear(self, request, pk=None):
        alarm = self.get_object()
        if not alarm.is_cleared:
            alarm.is_cleared = True
            alarm.cleared_by = request.user.username if request.user.is_authenticated else 'System'
            alarm.cleared_time = timezone.now()
            alarm.save()
        return Response({'status': 'alarm cleared'})

    @action(detail=False, methods=['post'])
    def clear_all(self, request):
        alarms = self.get_queryset().filter(is_cleared=False)
        count = alarms.update(
            is_cleared=True,
            cleared_by=request.user.username if request.user.is_authenticated else 'System',
            cleared_time=timezone.now()
        )
        return Response({'status': 'all alarms cleared', 'count': count})

class EventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Event.objects.all().order_by('-timestamp')
    serializer_class = EventSerializer

    def get_queryset(self):
        queryset = Event.objects.all().order_by('-timestamp')
        notified = self.request.query_params.get('notified')
        if notified == 'true':
            queryset = queryset.filter(is_notified=True)
        elif notified == 'false':
            queryset = queryset.filter(is_notified=False)
        return queryset

class LogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Log.objects.all().order_by('-timestamp')
    serializer_class = LogSerializer

class FaultViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Fault.objects.all().order_by('-timestamp')
    serializer_class = FaultSerializer

    def get_queryset(self):
        queryset = Fault.objects.all().order_by('-timestamp')
        resolved = self.request.query_params.get('resolved')
        if resolved == 'true':
            queryset = queryset.filter(is_resolved=True)
        elif resolved == 'false':
            queryset = queryset.filter(is_resolved=False)
        return queryset
