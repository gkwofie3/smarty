from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from .serializers import MediaFileSerializer
from .models import MediaFile

class MediaUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file_serializer = MediaFileSerializer(data=request.data, context={'request': request})
        if file_serializer.is_valid():
            file_serializer.save()
            return Response(file_serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("UPLOAD ERROR:", file_serializer.errors)
            print("REQUEST DATA:", request.data)
            print("REQUEST FILES:", request.FILES)
            return Response(file_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
