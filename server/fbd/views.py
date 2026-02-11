from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import FBDProgram
from .serializers import FBDProgramSerializer
from helper.viewsets import BaseDuplicateViewSet

class FBDProgramViewSet(BaseDuplicateViewSet):
    queryset = FBDProgram.objects.all()
    serializer_class = FBDProgramSerializer

    def execute_duplication(self, instance, count, include_children, names):
        # FBD Programs don't have children in the model themselves (nodes/edges are in JSON)
        return self.perform_duplication(
            instance, count, False, names,
            child_relation_name=None,
            child_model=None,
            fk_name=None
        )

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        program = self.get_object()
        from .executor import FBDExecutor
        executor = FBDExecutor(program)
        results = executor.execute_cycle()
        return Response({'status': 'executed', 'program': program.name, 'results': results})
