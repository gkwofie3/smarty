from django.db import models
from django.conf import settings

class FBDProgram(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=False)
    diagram_json = models.JSONField(default=dict, blank=True)  # Stores nodes and edges
    bindings = models.JSONField(default=dict, blank=True)      # Stores IO bindings
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE) # Assuming auth is set up, but let's keep it simple for now or check if USER wants it.
    
    def __str__(self):
        return self.name
