from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import FBDProgram
from .serializers import FBDProgramSerializer

class FBDProgramViewSet(viewsets.ModelViewSet):
    queryset = FBDProgram.objects.all()
    serializer_class = FBDProgramSerializer

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        program = self.get_object()
        from .executor import FBDExecutor
        executor = FBDExecutor(program)
        results = executor.execute_cycle()
        return Response({'status': 'executed', 'program': program.name, 'results': results})
