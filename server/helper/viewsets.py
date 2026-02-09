from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
import copy
from .serializers import DuplicateSerializer

class BaseDuplicateViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet with common duplication logic.
    """
    def perform_duplication(self, instance, count, include_children, names, child_relation_name, child_model, fk_name, reset_fields=None):
        clones = []
        try:
            with transaction.atomic():
                for i in range(count):
                    # 1. Clone the parent
                    clone = copy.copy(instance)
                    clone.pk = None
                    clone.id = None
                    clone.slug = ""  # Reset slug
                    
                    if reset_fields:
                        for field in reset_fields:
                            setattr(clone, field, None)
                    
                    # Determine name
                    if names and i < len(names):
                        clone.name = names[i]
                    else:
                        clone.name = f"{instance.name}_copy_{i+1}"
                    
                    clone.save()  # Triggers slug generation
                    clones.append(clone)

                    # 2. Clone children if requested
                    if include_children and child_relation_name:
                        children = getattr(instance, child_relation_name).all()
                        for child in children:
                            child_clone = copy.copy(child)
                            child_clone.pk = None
                            child_clone.id = None
                            setattr(child_clone, fk_name, clone)
                            
                            # Handle unique constraints on children
                            if hasattr(child_clone, 'name'):
                                base_name = child.name
                                child_clone.name = f"{base_name}_{clone.name}"
                                offset = 1
                                original_name = child_clone.name
                                while child_model.objects.filter(name=child_clone.name).exists():
                                    child_clone.name = f"{original_name}_{offset}"
                                    offset += 1
                                    
                            if hasattr(child_clone, 'slug'):
                                child_clone.slug = "" 

                            child_clone.save()
            return True, clones
        except Exception as e:
            return False, str(e)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        instance = self.get_object()
        serializer = DuplicateSerializer(data=request.data)
        if serializer.is_valid():
            count = serializer.validated_data['count']
            include_children = serializer.validated_data['include_children']
            names = serializer.validated_data.get('names', [])
            
            success, result = self.execute_duplication(instance, count, include_children, names)
            
            if success:
                return Response({'status': 'success', 'created': len(result)}, status=status.HTTP_201_CREATED)
            else:
                return Response({'error': str(result)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def execute_duplication(self, instance, count, include_children, names):
        raise NotImplementedError("Subclasses must implement execute_duplication")
