from django.db import models
from django.conf import settings

class ScriptProgram(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    code_text = models.TextField(blank=True, default="# Start writing your script here\n")
    is_active = models.BooleanField(default=True)
    
    last_execution_status = models.CharField(max_length=50, blank=True, null=True)
    last_execution_time = models.DateTimeField(blank=True, null=True)
    last_execution_log = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = "Script Program"
        verbose_name_plural = "Script Programs"

    def __str__(self):
        return self.name

class ScriptBinding(models.Model):
    DIRECTION_CHOICES = [
        ('input', 'Input'),
        ('output', 'Output'),
    ]
    
    script = models.ForeignKey(ScriptProgram, on_delete=models.CASCADE, related_name="bindings")
    variable_name = models.CharField(max_length=255)
    point = models.ForeignKey('devices.Point', on_delete=models.CASCADE, related_name="script_bindings")
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES)

    class Meta:
        unique_together = ('script', 'variable_name')
        verbose_name = "Script Binding"
        verbose_name_plural = "Script Bindings"

    def __str__(self):
        return f"{self.script.name}: {self.variable_name} -> {self.point.name}"
