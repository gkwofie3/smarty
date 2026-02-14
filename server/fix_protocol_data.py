import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from devices.models import Device

def fix_protocols():
    print("Checking for devices with legacy protocol names...")
    
    # Fix Modbus
    modbus_devices = Device.objects.filter(protocol='Modbus')
    count = modbus_devices.count()
    if count > 0:
        print(f"Found {count} devices with protocol='Modbus'. Updating to 'ModbusTCP'...")
        modbus_devices.update(protocol='ModbusTCP')
    else:
        print("No devices found with protocol='Modbus'.")

    # Fix BACnet
    bacnet_devices = Device.objects.filter(protocol='BACnet')
    count = bacnet_devices.count()
    if count > 0:
        print(f"Found {count} devices with protocol='BACnet'. Updating to 'BACnetIP'...")
        bacnet_devices.update(protocol='BACnetIP')
    else:
        print("No devices found with protocol='BACnet'.")
        
    print("Protocol migration complete.")

if __name__ == '__main__':
    fix_protocols()
