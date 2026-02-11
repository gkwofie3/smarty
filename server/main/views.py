from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import random
import requests
from .models import Alarm, Event, Log, Fault, LogWrite
from .serializers import AlarmSerializer, EventSerializer, LogSerializer, FaultSerializer
from devices.models import Device, Point, PointGroup, Register
from modules.models import Module, Page
from django.db.models import Count, Q

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

class DashboardViewSet(viewsets.ViewSet):
    """
    ViewSet for Dashboard aggregation.
    """
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        # 1. Counts
        device_count = Device.objects.count()
        module_count = Module.objects.count()
        page_count = Page.objects.count()
        point_count = Point.objects.count()
        register_count = Register.objects.count()

        # 2. Alarm Stats
        active_alarms = Alarm.objects.filter(is_active=True).count()
        unack_alarms = Alarm.objects.filter(is_acknowledged=False).count()
        today_alarms = Alarm.objects.filter(start_time__date=timezone.now().date()).count()

        # 3. Recent Activity (Logs) - serialized
        recent_logs = Log.objects.order_by('-timestamp')[:5]
        recent_logs_data = LogSerializer(recent_logs, many=True).data

        # 4. Forced Points
        forced_points = Point.objects.filter(is_forced=True).count()
        
        # 5. Faults
        active_faults = Fault.objects.filter(is_resolved=False).count()

        # 6. Detailed Alarm History (Last 7 Days) for charts
        last_7_days = timezone.now() - timezone.timedelta(days=7)
        alarm_history = Alarm.objects.filter(start_time__gte=last_7_days).values('start_time__date').annotate(count=Count('id')).order_by('start_time__date')
        
        # 7. Device Status
        online_devices = Device.objects.filter(is_online=True).count()
        offline_devices = device_count - online_devices


        return Response({
            'counts': {
                'devices': device_count,
                'modules': module_count,
                'pages': page_count,
                'points': point_count,
                'registers': register_count,
                'forced_points': forced_points
            },
            'alarms': {
                'active': active_alarms,
                'unacknowledged': unack_alarms,
                'today': today_alarms,
                'history': list(alarm_history)
            },
            'faults': {
                'active': active_faults
            },
            'devices_status': {
                'online': online_devices,
                'offline': offline_devices
            },
            'recent_logs': recent_logs_data
        })

@csrf_exempt
def writecommand(request):
    # This check is now the sole enforcer of the allowed method
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            
            point_id = data.get('point_id')
            device_id = data.get('device')
            register_name = data.get('register')
            bit = data.get('bit')
            cmd_type = data.get('type')
            
            print(f"Write Command Received: Point={point_id}, Dev={device_id}, Reg={register_name}, Val={data.get('value')}")

            # Resolve Point to Device/Register if provided
            if point_id:
                try:
                    point = Point.objects.get(id=point_id)
                    if point.register:
                        device_id = point.register.device.id
                        register_name = point.register.name 
                        # bit logic
                        if point.is_single_bit:
                            bit = point.bit
                    else:
                        print(f"Point {point_id} has no register assigned.")
                except Point.DoesNotExist:
                    print(f"Point {point_id} not found.")
                    pass

            if cmd_type == 'switchcommand':
                # Toggle logic override if specific type sent
                random_value = random.randint(0, 1)
                value = str(random_value)
            else:
                raw_val = data.get('value')
                value = str(raw_val) if raw_val is not None else None
            
            if device_id is None or register_name is None or value is None:
                err_msg = f'Missing required parameters. Resolved: Dev={device_id}, Reg={register_name}, Val={value}'
                print(err_msg)
                return JsonResponse({'error': err_msg}, status=400)
            
            user = request.user if request.user.is_authenticated else None
            
            LogWrite.objects.create(
                device=device_id,
                register=register_name,
                bit=bit,
                value=value,
                user=user,
                level='INFO',
                executed=False,
                status='PENDING',
                message=f"Received write request: Device {device_id}, Register {register_name}, Bit {bit}, Value {value}"
            )

            return JsonResponse({'status': 'success', 'message': 'Command received and logged.'}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON payload'}, status=400)
            
        except requests.exceptions.RequestException as e:
            return JsonResponse({'status': 'error', 'message': f'Request to external endpoint failed: {str(e)}'}, status=500)
            
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return JsonResponse({'status': 'error', 'message': f'Internal server error: {str(e)}'}, status=500)

    # This is the crucial line: returns 405 for any method that wasn't POST
    return JsonResponse({'error': 'Not POST request'}, status=405)
