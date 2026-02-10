from rest_framework import serializers
from .models import Alarm, Event, Log, Fault

class AlarmSerializer(serializers.ModelSerializer):
    point_name = serializers.CharField(source='point.name', read_only=True)
    
    class Meta:
        model = Alarm
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    point_name = serializers.CharField(source='point.name', read_only=True)

    class Meta:
        model = Event
        fields = '__all__'

class LogSerializer(serializers.ModelSerializer):
    point_name = serializers.CharField(source='point.name', read_only=True)

    class Meta:
        model = Log
        fields = '__all__'

class FaultSerializer(serializers.ModelSerializer):
    point_name = serializers.CharField(source='point.name', read_only=True)
    device_name = serializers.CharField(source='device.name', read_only=True)

    class Meta:
        model = Fault
        fields = '__all__'
