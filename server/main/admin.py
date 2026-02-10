from django.contrib import admin
from .models import *

admin.site.register(Event)
admin.site.register(Log)
admin.site.register(Trend)
admin.site.register(Alarm)
# Register your models here.
