from rest_framework import serializers
from .models import Module, Page

class PageSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(read_only=True)
    class Meta:
        model = Page
        fields = ['id', 'module', 'name', 'slug', 'page_type', 'description', 'content', 'is_dashboard', 'is_active', 'created_at', 'updated_at']

class ModuleSerializer(serializers.ModelSerializer):
    pages = PageSerializer(many=True, read_only=True)
    slug = serializers.SlugField(read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'name', 'slug', 'description', 'is_active', 'pages', 'created_at', 'updated_at']
