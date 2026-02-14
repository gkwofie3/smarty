from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat_api, name='ai_chat'),
    path('history/<int:conversation_id>/', views.get_history, name='ai_history'),
    path('conversations/', views.get_conversations, name='ai_conversations'),
]

