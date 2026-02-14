import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from devices.serializers import DeviceSerializer
from devices.models import Device

# Mock payload based on DevicesPage.jsx
payload = {
    "name": "Test Device",
    "slug": "test-device",
    "device_type": "GENERATOR",
    "protocol": "ModbusTCP",
    "ip_address": "127.0.0.1",
    "port_number": 502,
    "slave_id": 1,
    "baud_rate": 9600,
    "parity": "Even",
    "stop_bits": 1,
    "is_online": False,
    "description": "Test description",
    "location": "Test location",
    "path": "/test/path",
    "module_number": 1,
    "module_type": "Test Module",
    # BACnet fields (might be null or missing)
    "bacnet_device_instance": None,
    "bacnet_network_number": None
}

print("--- Testing Creation ---")
serializer = DeviceSerializer(data=payload)
if serializer.is_valid():
    print("Valid creation payload")
else:
    print(f"Invalid creation payload: {serializer.errors}")

print("\n--- Testing Update (Simulated) ---")
# Create a dummy device to simulate update
try:
    device = Device.objects.get(id=1)
    print(f"Found Device ID 1: {device}")
    
    # Update payload
    update_payload = payload.copy()
    update_payload['id'] = device.id
    update_payload['name'] = "Updated Name"
    
    # Simulate partial update or full update
    serializer = DeviceSerializer(device, data=update_payload)
    if serializer.is_valid():
        print("Valid update payload")
    else:
        print(f"Invalid update payload: {serializer.errors}")
        
except Device.DoesNotExist:
    print("Device ID 1 not found, skipping update test")
