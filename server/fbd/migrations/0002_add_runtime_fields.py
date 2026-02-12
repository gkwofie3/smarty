from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('fbd', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='fbdprogram',
            name='runtime_values',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='fbdprogram',
            name='runtime_state',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
