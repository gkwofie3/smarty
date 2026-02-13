from django.db import models
from django.conf import settings

class Conversation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ai_conversations")
    title = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.created_at}"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=50, choices=[('user', 'User'), ('assistant', 'Assistant'), ('system', 'System')])
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional: structured data for tool calls/outputs
    tool_calls = models.JSONField(default=list, blank=True)
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}"

class AutonomousLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    action_type = models.CharField(max_length=100)
    target = models.CharField(max_length=255) # e.g., "Point: P-101"
    reason = models.TextField()
    status = models.CharField(max_length=50) # "PENDING", "EXECUTED", "FAILED", "DENIED"
    details = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"{self.action_type} on {self.target} - {self.status}"
