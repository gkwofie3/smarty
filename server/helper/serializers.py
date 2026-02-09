from rest_framework import serializers

class DuplicateSerializer(serializers.Serializer):
    count = serializers.IntegerField(min_value=1, default=1)
    include_children = serializers.BooleanField(default=False)
    # definition_list: Optional list of objects with specific names for the copies
    # If not provided, we auto-generate names
    names = serializers.ListField(child=serializers.CharField(), required=False)
