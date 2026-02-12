from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ScriptProgram, ScriptBinding
from .serializers import ScriptProgramSerializer, ScriptBindingSerializer
from helper.viewsets import BaseDuplicateViewSet

class ScriptProgramViewSet(BaseDuplicateViewSet):
    queryset = ScriptProgram.objects.all()
    serializer_class = ScriptProgramSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def execute_duplication(self, instance, count, include_children, names):
        # Scripts don't have children in a hierarchical way, but we might want to duplicate bindings
        new_instances = []
        for i in range(count):
            name = names[i] if names and i < len(names) else f"{instance.name} (Copy {i+1})"
            
            # Duplicate the program
            new_instance = ScriptProgram.objects.create(
                name=name,
                description=instance.description,
                code_text=instance.code_text,
                is_active=instance.is_active,
                owner=self.request.user
            )
            
            # Duplicate bindings
            for binding in instance.bindings.all():
                ScriptBinding.objects.create(
                    script=new_instance,
                    variable_name=binding.variable_name,
                    point=binding.point,
                    direction=binding.direction
                )
            
            new_instances.append(new_instance)
        return new_instances

    @action(detail=True, methods=['patch'])
    def update_code(self, request, pk=None):
        script = self.get_object()
        code_text = request.data.get('code_text')
        if code_text is not None:
            script.code_text = code_text
            script.save()
            return Response({'status': 'code updated'})
        return Response({'error': 'code_text required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'])
    def bindings(self, request, pk=None):
        script = self.get_object()
        if request.method == 'GET':
            bindings = script.bindings.all()
            serializer = ScriptBindingSerializer(bindings, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Bulk update/create bindings
            # Expected data: [{variable_name, point_id, direction}]
            binding_data = request.data
            if not isinstance(binding_data, list):
                return Response({'error': 'Expected list of bindings'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Clear existing? Or update specific ones? 
            # Requirements say "Save bindings" -> likely overwrite/sync
            script.bindings.all().delete()
            
            created = []
            for item in binding_data:
                serializer = ScriptBindingSerializer(data=item)
                if serializer.is_valid():
                    serializer.save(script=script)
                    created.append(serializer.data)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            return Response(created, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        declarations = []
        try:
            script = self.get_object()
            from .executor import ScriptExecutor
            executor = ScriptExecutor(script)
            declarations = executor.parse()
            # Simple syntax check by compiling
            compile(executor.python_code, '<string>', 'exec')
            script.last_execution_log = "[Validation] Success: Script is valid."
            script.save()
            return Response({
                'status': 'valid',
                'declarations': declarations
            })
        except SyntaxError as e:
            error_msg = f"[Validation] Syntax Error: {str(e)} at line {e.lineno}"
            script.last_execution_log = error_msg
            script.save()
            return Response({
                'status': 'invalid',
                'error': str(e),
                'line': e.lineno,
                'declarations': declarations
            })
        except Exception as e:
            error_msg = f"[Validation] Error: {str(e)}"
            script.last_execution_log = error_msg
            script.save()
            return Response({
                'status': 'error',
                'error': str(e),
                'declarations': declarations
            })

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        script = self.get_object()
        from .executor import ScriptExecutor
        executor = ScriptExecutor(script)
        status_res = executor.execute()
        return Response({
            'status': status_res,
            'log': script.last_execution_log
        })

class ScriptBindingViewSet(viewsets.ModelViewSet):
    queryset = ScriptBinding.objects.all()
    serializer_class = ScriptBindingSerializer
