from rest_framework import serializers
from .models import FBDProgram

class FBDProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = FBDProgram
        fields = '__all__'
