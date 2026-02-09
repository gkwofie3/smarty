from django.db import models
from helper.enums import *
from django.utils.text import slugify
from django.db.models import Max
from helper.processors import PointProcessor
# ================================================
# Device Model
# ================================================
class Device(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    device_type = models.CharField(max_length=50, choices=DEVICE_TYPE_CHOICES, null=True, blank=True)
    is_online = models.BooleanField(default=False)
    last_communication = models.DateTimeField(null=True, blank=True)
    path = models.CharField(max_length=255, blank=True)
    module_number = models.PositiveIntegerField(null=True, blank=True)
    module_type = models.CharField(max_length=100, blank=True)
    protocol = models.CharField(max_length=20, choices=PROTOCOL_CHOICES, null=True, blank=True)
    slug = models.SlugField(unique=True)
    # Common network parameters
    ip_address = models.CharField(max_length=50, null=True, blank=True,default='127.0.0.1')
    port_number = models.PositiveIntegerField(default=502)

    # Modbus-specific
    slave_id = models.PositiveSmallIntegerField(default=1)
    baud_rate = models.PositiveIntegerField(choices=MODBUS_BAUD_RATE_CHOICES, null=True, blank=True)
    parity = models.CharField(max_length=10, choices=MODBUS_PARITY_CHOICES, default="Even")
    stop_bits = models.PositiveSmallIntegerField(choices=MODBUS_STOP_BITS_CHOICES, default=1)

    # BACnet-specific
    bacnet_device_instance = models.PositiveIntegerField(null=True, blank=True)
    bacnet_network_number = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        verbose_name = "Device"
        verbose_name_plural = "Devices"

    def __str__(self):
        return self.name or f"Device {self.id}"

class Register(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="registers")
    name = models.CharField(max_length=255,unique=True)
    address = models.PositiveIntegerField(default=0)
    read_function_code = models.CharField(max_length=10, choices=FUNCTION_CODE_CHOICES, default="04", null=True, blank=True)
    write_function_code = models.CharField(max_length=10, choices=FUNCTION_CODE_CHOICES, default="06", null=True, blank=True)  
    signal_type = models.CharField(max_length=20, choices=SIGNAL_TYPE_CHOICES, default="Digital", null=True, blank=True)
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES, default="Input", null=True, blank=True)
    current_value = models.CharField(max_length=255, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    last_communication=models.DateTimeField(null=True, blank=True)
    data_type = models.CharField(max_length=20, choices=DATA_TYPE_CHOICES, default="Real", null=True, blank=True)
    is_single_bit = models.BooleanField(default=False)
    is_writeable = models.BooleanField(default=True)
    count = models.BigIntegerField(default=0)
    offset_before_gain=models.BooleanField(default=False)
    gain = models.FloatField(default=1.0)
    offset = models.FloatField(default=0.0)
    is_active = models.BooleanField(default=True)
    is_isolated = models.BooleanField(default=False)
    error_status = models.CharField(max_length=20, choices=ERROR_STATUS_CHOICES, default="OK", null=True, blank=True)
    error_message = models.TextField(blank=True,null=True)
    can_be_faulty = models.BooleanField(default=False)
    faulty_value = models.BooleanField(null=True, blank=True)

    class Meta:
        verbose_name = "Register"
        verbose_name_plural = "Registers"

    def __str__(self):
        return self.name 
    
class PointGroup(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True)
    device_type = models.CharField(max_length=50, choices=DEVICE_TYPE_CHOICES, null=True, blank=True)
    is_active = models.BooleanField(default=True) 
    order = models.PositiveIntegerField(unique=True, blank=True) 

    class Meta:
        verbose_name = "Point Group"
        verbose_name_plural = "Point Groups"
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)

        if self.order is None:
            max_order = PointGroup.objects.aggregate(Max('order'))['order__max']
            self.order = (max_order or 0) + 1
            
        super().save(*args, **kwargs)
    
class Point(models.Model):
    # --- 1. Identity & Grouping ---
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, blank=True)
    description = models.TextField(blank=True, null=True)
    point_group = models.ForeignKey('PointGroup', on_delete=models.CASCADE, related_name="points")
    point_type = models.CharField(max_length=20, choices=IO_TYPE_CHOICES, default="REGISTER")
    
    # --- 2. Hardware Link (The Bridge) ---
    register = models.ForeignKey('Register', on_delete=models.SET_NULL, null=True, blank=True, related_name="io_points")
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES, default="Input", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    frequency = models.FloatField(default=1.0, null=True, blank=True)
    is_isolated = models.BooleanField(default=False)

    # --- 3. Data Extraction & Types ---
    data_type = models.CharField(max_length=20, choices=IO_DATA_TYPE_CHOICES, default="Real")
    bit_size = models.PositiveSmallIntegerField(default=16, null=True, blank=True)
    bit = models.PositiveIntegerField(null=True, blank=True, default=0) 
    is_single_bit = models.BooleanField(default=False)
    is_writeable = models.BooleanField(default=True)

    # --- 4. Manual Override (Forced) ---
    is_forced = models.BooleanField(default=False)
    forced_value = models.CharField(max_length=255, blank=True, null=True)

    # --- 5. Scaling & Calibration ---
    gain = models.FloatField(default=1.0, null=True, blank=True)
    offset = models.FloatField(default=0.0, null=True, blank=True)
    offset_before_gain = models.BooleanField(default=False)
    decimal_places = models.PositiveSmallIntegerField(default=2, null=True, blank=True)
    unit = models.CharField(max_length=50, blank=True, null=True)
    
    range_min = models.FloatField(default=4.0, null=True, blank=True)
    range_max = models.FloatField(default=20.0, null=True, blank=True)
    scale_min = models.FloatField(default=0.0, null=True, blank=True)
    scale_max = models.FloatField(default=100.0, null=True, blank=True)
    
    # --- 6. Logic & Thresholds ---
    threshold_high = models.FloatField(default=100.0, null=True, blank=True)
    threshold_low = models.FloatField(default=0.0, null=True, blank=True)
    pulse_width = models.FloatField(null=True, blank=True)
    can_be_faulty = models.BooleanField(default=False)
    faulty_value = models.BooleanField(null=True, blank=True)

    # --- 7. Real-time Data Store ---
    read_value = models.CharField(max_length=255, blank=True, null=True) 
    write_value = models.CharField(max_length=255, blank=True, null=True) 
    json_data = models.JSONField(null=True, blank=True) 
    
    # --- 8. Status & Communication ---
    error_status = models.CharField(max_length=20, choices=ERROR_STATUS_CHOICES, default="OK", null=True, blank=True)
    error_message = models.TextField(blank=True,null=True)
    last_updated = models.DateTimeField(auto_now=True)
    last_communication = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Point"
        verbose_name_plural = "Points"
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['name', 'point_group'], name='unique_point_name_per_group'),
            models.UniqueConstraint(fields=['slug', 'point_group'], name='unique_point_slug_per_group')
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def current_value(self):
        val = PointProcessor(self).process()
        return val