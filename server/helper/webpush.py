# helper/webpush.py

from py_vapid import Vapid

# Generate VAPID keys
vapid = Vapid()
vapid.generate_keys()

print("="*50)
print("VAPID Keys Generated Successfully!")
print("="*50)
print("\nAdd these to your settings.py:\n")
print("WEBPUSH_SETTINGS = {")
print(f'    "VAPID_PUBLIC_KEY": "{vapid.public_key.public_bytes_raw.hex()}",')
print(f'    "VAPID_PRIVATE_KEY": "{vapid.private_key.to_pem().decode()}",')
print('    "VAPID_ADMIN_EMAIL": "admin@yourdomain.com"')
print("}")
print("\n" + "="*50)