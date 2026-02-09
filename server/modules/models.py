from django.db import models
from django.utils.text import slugify

class Module(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Page(models.Model):
    PAGE_TYPE_CHOICES = [
        ('MAIN', 'Main'),
        ('ALARMS', 'Alarms'),
        ('MAP', 'Map'),
        ('ANALYSIS', 'Analysis'),
        ('REPORTS', 'Reports'),
        ('CUSTOM', 'Custom'),
    ]

    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='pages')
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, blank=True)
    page_type = models.CharField(max_length=20, choices=PAGE_TYPE_CHOICES, default='CUSTOM')
    description = models.TextField(blank=True, null=True)
    
    # Store the graphic elements as a JSON object
    # Structure: { "elements": [ ... ] } as defined in the prompt
    content = models.JSONField(default=dict, blank=True)
    
    is_dashboard = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['module', 'slug'], name='unique_page_slug_per_module')
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        
        if self.is_dashboard:
            # Set all other pages is_dashboard=False
            Page.objects.filter(is_dashboard=True).exclude(pk=self.pk).update(is_dashboard=False)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.module.name} - {self.name}"
