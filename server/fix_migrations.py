import os
import django
from django.core.management import call_command

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

print("Checking migrations for 'fbd'...")
try:
    call_command('showmigrations', 'fbd')
    print("\nApplying migrations for 'fbd'...")
    call_command('migrate', 'fbd')
    print("\nMigrations applied successfully.")
except Exception as e:
    print(f"\nError applying migrations: {e}")

from fbd.models import FBDProgram
print("\nVerifying FBDProgram fields:")
fields = [f.name for f in FBDProgram._meta.fields]
print(fields)
if 'runtime_values' in fields:
    print("SUCCESS: runtime_values confirmed.")
else:
    print("FAILURE: runtime_values missing.")
