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
    print("AI Chat API Called")
    try:
        user_message = request.data.get('message')
        conversation_id = request.data.get('conversation_id')
        print(f"Message: {user_message}, ConvID: {conversation_id}")
        
        if not user_message:
            return Response({"error": "Message is required"}, status=400)
        
        # Get or Create Conversation
        try:
            if conversation_id:
                conversation = Conversation.objects.get(id=conversation_id)
            else:
                # Use request.user if authenticated, else fallback to first user
                user = getattr(request, 'user', None)
                if not user or user.is_anonymous:
                    from users.models import User
                    user = User.objects.first()
                
                if not user:
                    return Response({"error": "No user found to associate with conversation. Please create a user first."}, status=400)
                    
                conversation = Conversation.objects.create(user=user, title=user_message[:50]) 
        except Exception as e:
            return Response({"error": f"Database/User Error: {str(e)}. Did you run migrations?"}, status=500)
        
        # Save User Message
        Message.objects.create(conversation=conversation, role='user', content=user_message)
        
        # Retrieve History (Last 10 messages, in correct order)
        history_objs = list(conversation.messages.order_by('-created_at')[:10])
        history_objs.reverse()
        
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
            if full_response:
                Message.objects.create(conversation=conversation, role='assistant', content=full_response)

        response = StreamingHttpResponse(event_stream(), content_type='text/plain')
        response['X-Conversation-Id'] = str(conversation.id)
        response['Access-Control-Expose-Headers'] = 'X-Conversation-Id'
        return response
    except Exception as e:
        return Response({"error": f"Internal Server Error: {str(e)}"}, status=500)



@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def get_history(request, conversation_id):
    """Returns all messages for a specific conversation."""
    try:
        messages = Message.objects.filter(conversation_id=conversation_id).order_by('created_at')
        data = []
        for msg in messages:
            data.append({
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat() if msg.created_at else None
            })
        return Response({
            "conversation_id": conversation_id,
            "messages": data
        })
    except Exception as e:
        import traceback
        print(f"CRITICAL ERROR in get_history: {e}")
        print(traceback.format_exc())
        return Response({"error": "Internal Server Error during history serialization"}, status=500)

@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def get_conversations(request):
    """Returns a list of conversation for the current user."""
    user = getattr(request, 'user', None)
    if not user or user.is_anonymous:
        from users.models import User
        user = User.objects.first()
        
    conversations = Conversation.objects.filter(user=user).order_by('-updated_at')
    data = []
    for conv in conversations:
        data.append({
            "id": conv.id,
            "title": conv.title,
            "created_at": conv.created_at.isoformat() if conv.created_at else None
        })
    return Response(data)
