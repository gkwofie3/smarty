from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('devices', '0004_alter_device_protocol'),
    ]

    operations = [
        migrations.CreateModel(
            name='ScriptProgram',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('code_text', models.TextField(blank=True, default='# Start writing your script here\n')),
                ('is_active', models.BooleanField(default=True)),
                ('last_execution_status', models.CharField(blank=True, max_length=50, null=True)),
                ('last_execution_time', models.DateTimeField(blank=True, null=True)),
                ('last_execution_log', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Script Program',
                'verbose_name_plural': 'Script Programs',
            },
        ),
        migrations.CreateModel(
            name='ScriptBinding',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('variable_name', models.CharField(max_length=255)),
                ('direction', models.CharField(choices=[('input', 'Input'), ('output', 'Output')], max_length=10)),
                ('point', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='script_bindings', to='devices.point')),
                ('script', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bindings', to='script.scriptprogram')),
            ],
            options={
                'verbose_name': 'Script Binding',
                'verbose_name_plural': 'Script Bindings',
                'unique_together': {('script', 'variable_name')},
            },
        ),
    ]
