from rest_framework import serializers
from .models import ScriptProgram, ScriptBinding

class ScriptBindingSerializer(serializers.ModelSerializer):
    point_name = serializers.ReadOnlyField(source='point.name')
    
    class Meta:
        model = ScriptBinding
        fields = ['id', 'variable_name', 'point', 'point_name', 'direction']

class ScriptProgramSerializer(serializers.ModelSerializer):
    bindings = ScriptBindingSerializer(many=True, read_only=True)
    
    class Meta:
        model = ScriptProgram
        fields = [
            'id', 'name', 'description', 'code_text', 'is_active',
            'last_execution_status', 'last_execution_time', 'last_execution_log',
            'created_at', 'updated_at', 'owner', 'bindings'
        ]
        read_only_fields = ['last_execution_status', 'last_execution_time', 'last_execution_log', 'created_at', 'updated_at', 'owner']
