import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

def run_sql(sql):
    with connection.cursor() as cursor:
        try:
            print(f"Executing: {sql}")
            cursor.execute(sql)
            print("Done.")
        except Exception as e:
            print(f"Error: {e}")

# Adding columns if they don't exist
# We use ALTER TABLE ... ADD COLUMN IF NOT EXISTS (supported in PG 9.6+)
run_sql('ALTER TABLE fbd_fbdprogram ADD COLUMN IF NOT EXISTS runtime_values jsonb DEFAULT \'{}\';')
run_sql('ALTER TABLE fbd_fbdprogram ADD COLUMN IF NOT EXISTS runtime_state jsonb DEFAULT \'{}\';')

# Also, let's mark the migration as applied in django_migrations to prevent future conflicts
# We need to know the name of the migration. I called it 0002_add_runtime_fields
from django.utils import timezone
run_sql("INSERT INTO django_migrations (app, name, applied) VALUES ('fbd', '0002_add_runtime_fields', now()) ON CONFLICT (app, name) DO NOTHING;")

print("Raw SQL fix finished.")
