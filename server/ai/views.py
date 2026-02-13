from django.shortcuts import render
from django.http import StreamingHttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .engine import AIEngine
from .models import Conversation, Message
import json

@api_view(['POST'])
# @permission_classes([IsAuthenticated]) # Enable in production
def chat_api(request):
    """
    Endpoint for AI Chat.
    Expects JSON: {"message": "user query", "conversation_id": 1 (optional)}
    Returns: Streaming Text
    """
    user_message = request.data.get('message')
    conversation_id = request.data.get('conversation_id')
    
    if not user_message:
        return Response({"error": "Message is required"}, status=400)
    
    # Get or Create Conversation
    if conversation_id:
        conversation = Conversation.objects.get(id=conversation_id)
    else:
        # In prod, assign request.user
        conversation = Conversation.objects.create(user_id=1, title=user_message[:50]) 
    
    # Save User Message
    Message.objects.create(conversation=conversation, role='user', content=user_message)
    
    # Retrieve History (Last 10 messages)
    history_objs = conversation.messages.order_by('created_at')[:10]
    history = []
    from langchain_core.messages import HumanMessage, AIMessage
    for msg in history_objs:
        if msg.role == 'user':
            history.append(HumanMessage(content=msg.content))
        elif msg.role == 'assistant':
            history.append(AIMessage(content=msg.content))
    
    engine = AIEngine()
    
    def event_stream():
        full_response = ""
        try:
            for chunk in engine.stream_response(user_message, history=history):
                full_response += chunk
                yield chunk
        except Exception as e:
            yield f"\n[Error: {str(e)}]"
            
        # Save Assistant Message after streaming completes
        Message.objects.create(conversation=conversation, role='assistant', content=full_response)

    return StreamingHttpResponse(event_stream(), content_type='text/plain')


# Create your views here.
