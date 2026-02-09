
from django.db import models
from users.models import User
from devices.models import Device,Point

class Client(models.Model):
    
    name = models.CharField(max_length=255, unique=True)
    short_name = models.CharField(max_length=100, unique=True, help_text="Short name for the client")
    address = models.TextField(blank=True)
    contact_email = models.EmailField(blank=True)
    system_name = models.CharField(max_length=255, blank=True)
    logo = models.ImageField(upload_to='client_logos/', null=True, blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    website= models.URLField(blank=True)
    system_ip_address = models.GenericIPAddressField(blank=True, null=True)
    system_url=models.URLField(blank=True)
    email_links_choicee=models.CharField(max_length=100, blank=True, choices=[('system IP', 'System IP'),('system URL', 'System URL')], default='System IP')
    support_email = models.EmailField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.name


class Event(models.Model):
    SEVERITY_CHOICES = [
        ('INFO', 'Informational'),
        ('WARNING', 'Warning'),
        ('CRITICAL', 'Critical'),
    ]

    is_notified=models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    point = models.ForeignKey(Point, on_delete=models.SET_NULL, null=True, blank=True)
    event_type = models.CharField(max_length=100, help_text="e.g., 'Value Change', 'State Transition'")
    description = models.TextField()
    severity = models.CharField(max_length=50, choices=SEVERITY_CHOICES, default='INFO')
    name =models.CharField(max_length=255, help_text="Short name for the event")
    def __str__(self):
        return f"Event on {self.point}: {self.event_type} at {self.timestamp}"

class Log(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    # payload_time = models.DateTimeField(null=True, blank=True)
    point = models.ForeignKey(Point, on_delete=models.SET_NULL, null=True, blank=True)
    source = models.CharField(max_length=255, help_text="The source of the log (e.g., 'System', 'Parameter_Update')")
    message = models.TextField()
    value=models.CharField(max_length=255, blank=True, help_text="Optional value associated with the log entry")
    name=models.CharField(max_length=255, help_text="Short name for the log entry")
    def __str__(self):
        return f"{self.timestamp} - {self.source}: {self.message[:50]}"

class Alarm(models.Model):
    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]
    point = models.ForeignKey(Point, on_delete=models.CASCADE, related_name='alarms',null=True,blank=True)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    description = models.TextField()
    severity = models.CharField(max_length=50, choices=SEVERITY_CHOICES, default='MED')
    is_active = models.BooleanField(default=True)
    is_acknowledged = models.BooleanField(default=False)
    acknowledged_by = models.CharField(max_length=255, blank=True, help_text="Short name for who acknowledged the alarm")
    acknowledged_time = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    is_cleared = models.BooleanField(default=False)
    is_notified=models.BooleanField(default=False)
    cleared_by = models.CharField(max_length=255, blank=True, help_text="Short name for who cleared the alarm")
    deleted_by = models.CharField(max_length=255, blank=True)
    cleared_time = models.DateTimeField(null=True, blank=True)
    # payload_time = models.DateTimeField(null=True, blank=True)
    name=models.CharField(max_length=255, help_text="Short name for the alarm entry")
    def __str__(self):
        return f"Alarm: {self.description} on {self.point.name}"


class Trend(models.Model):
    point = models.ForeignKey(Point, on_delete=models.CASCADE, related_name='trends',null=True,blank=True)
    timestamp = models.DateTimeField(db_index=True)
    value = models.FloatField()
    name=models.CharField(max_length=255, help_text="Short name for the trend entry")
    def __str__(self):
        return f"{self.point.name} - {self.value} at {self.timestamp}"
    
    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['point', 'timestamp']),
        ]

class Report(models.Model):
    report_type = models.CharField(max_length=100, help_text="e.g., 'Daily Performance', 'Alarm Summary'")
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    file = models.FileField(upload_to='reports/')
    name=models.CharField(max_length=255, help_text="Short name for the report entry")
    def __str__(self):
        return f"{self.report_type} Report ({self.start_time.date()})"

class PushSubscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.TextField(unique=True)
    auth = models.CharField(max_length=255)
    p256dh = models.CharField(max_length=255)
    browser = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'endpoint']

    def __str__(self):
        return f"{self.user.username} - {self.browser}"

    # ... your existing Notification model ...

class Notification(models.Model):
   
    title = models.CharField(max_length=255, default='New Notification') # <--- ADDED
    link = models.CharField(max_length=500, default='/') # <--- ADDED
    icon = models.CharField(max_length=100, default='info-circle') # <--- ADDED
    
    # 2. In-App Read Status (used by notification-manager.js)
    is_read = models.BooleanField(default=False,) # <--- ADDED

    # --- YOUR EXISTING FIELDS (Preserved) ---
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications',null=True, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_sent = models.BooleanField(default=False) # Status for non-push channels (Email/SMS)
    type = models.CharField(max_length=100, help_text="e.g., 'critical', 'warning', 'info'.")
    to = models.CharField(max_length=255, help_text="Short name for the notification entry")
    status = models.CharField(max_length=225, help_text="Status of the notification")

    # 3. Web Push Status (Preserved from the initial setup)
    push_sent = models.BooleanField(default=False ) # <--- KEPT

    class Meta:
        ordering = ['-created_at'] # Ensures newest appear first
        
    def __str__(self):
        recipient = self.user.username if self.user else 'Broadcast'
        return f"[{self.type}] {self.title} for {recipient} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class Fault(models.Model):
    point = models.ForeignKey(Point, on_delete=models.CASCADE, related_name='faults',null=True,blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    device=models.ForeignKey(Device, on_delete=models.CASCADE, related_name='faults')
    description = models.TextField()
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    name=models.CharField(max_length=255, help_text="Short name for the fault entry")
    def __str__(self):
        return f"Fault on {self.point.name} at {self.timestamp}"
    