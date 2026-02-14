from rest_framework import serializers
from .models import Device, Register, PointGroup, Point
from django.db import transaction

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Register
        fields = '__all__'
        ref_name = 'DeviceRegister' 

class DeviceSerializer(serializers.ModelSerializer):
    registers = RegisterSerializer(many=True, read_only=True)
    
    class Meta:
        model = Device
        fields = '__all__'

class PointSerializer(serializers.ModelSerializer):
    register_name = serializers.CharField(source='register.name', read_only=True)
    live_value = serializers.SerializerMethodField()
    
    def get_live_value(self, obj):
        return obj.current_value

    def to_internal_value(self, data):
        # Convert empty strings to None for nullable float fields
        nullable_float_fields = [
            'range_min', 'range_max', 'scale_min', 'scale_max', 
            'threshold_high', 'threshold_low', 'pulse_width', 'frequency',
            'gain', 'offset', 'decimal_places', 'bit', 'bit_size'
        ]
        
        data = data.copy() # Make mutable
        for field in nullable_float_fields:
            if field in data and data[field] == "":
                data[field] = None
                
        return super().to_internal_value(data)

    class Meta:
        model = Point
        fields = '__all__'
        ref_name = 'IOPoint'

class PointGroupSerializer(serializers.ModelSerializer):
    points = PointSerializer(many=True, read_only=True)

    class Meta:
        model = PointGroup
        fields = '__all__'

# Serializers for Duplication Input
class DuplicateSerializer(serializers.Serializer):
    count = serializers.IntegerField(required=True)
    include_children = serializers.BooleanField(required=False, default=False)
    names = serializers.ListField(child=serializers.CharField(), required=False)
