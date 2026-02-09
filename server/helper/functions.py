# from main.models import Alarm,Trend,Log,Event,Notification
from users.models import User
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
import random,re,string, uuid
from smartyclient import settings
from django.utils.timezone import now
from device.devices import MODULE_TYPES
from .enums import *
from device.models import *
from main.models import *
from modules.models import *
# from logger.external_models import SmartyModule, SmartyRegister
from device import devices as d
from django.forms.models import model_to_dict
from collections import defaultdict
from pprint import pprint
from datetime import datetime, timedelta,date
from dateutil.relativedelta import relativedelta
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from .sms.sms import send_sms
current_year = now().year

from device.models import Device
def get_meters():
    if Device.objects.filter(module_type='ENERGY METER').exists():
        meters =Device.objects.filter(module_type='ENERGY METER')
        pprint(meters)
        meters_list=[]
        for meter in meters:
            params =Register.objects.filter(device=meter)
            meter =model_to_dict(meter)
            meter['Registers']=params
            meters_list.append(meter)

        return meters_list
    else:
        return None
def db(request):
    from main.models import Client
    def check_client_exists():
        if Client.objects.filter().exists():
            return Client.objects.get(id=1)
        else:
            return None
    all_modules = Module.objects.all().order_by('module_category')
    unique_device_types = list(Module.objects.values_list('module_category', flat=True).distinct())
    alarms=Alarm.objects.all().order_by('-start_time')
    modules_cat = []
    for modcat in unique_device_types:
        cat_modules = all_modules.filter(module_category=modcat)
        modules_cat.append({
            'cat': modcat,
            'modules': cat_modules,
            'count': cat_modules.count()
        })
    client=check_client_exists()
    context={}
    context['modules_type'] =modules_cat
    context['path'] = request.path
    context['rs'] = request.session
    context['client'] = client
    
    context['user'] = User.objects.get(id=request.user.id)
    context['meters'] = get_meters()
    context['devices'] = Device.objects.all()
    context['modules'] = Module.objects.all()
    context['events'] = Event.objects.filter(timestamp__year=current_year).order_by('-timestamp')[:100]
    context['logs'] = Log.objects.filter(timestamp__year=current_year).order_by('-timestamp')[:100]
    context['trends'] = Trend.objects.filter(timestamp__year=current_year).order_by('-timestamp')[:100]
    alarms = Alarm.objects.all().order_by('-start_time')
    context['active_alarms'] = alarms.filter(is_active=True, is_acknowledged=False)
    context['ack_alarms'] = alarms.filter(is_active=True, is_acknowledged=True)
    context['cleared_alarms'] = alarms.filter(is_active=False, is_acknowledged=True)
    context['unack_cleared_alarms'] = alarms.filter(is_active=False, is_acknowledged=False)
    context['registers'] = Register.objects.all()
    context['users'] = User.objects.all()
    context['points']=Point.objects.all()
    context['devices_types'] = MODULE_TYPES
    context['protocols_types'] = PROTOCOL_CHOICES
    context['baudrate_choices'] = MODBUS_BAUD_RATE_CHOICES
    context['parity_choices'] = MODBUS_PARITY_CHOICES
    context['stop_bits_choices'] = MODBUS_STOP_BITS_CHOICES
    context['data_types']=DATA_TYPE_CHOICES
    context['signal_type']=SIGNAL_TYPE_CHOICES
    context['widget_types']=WIDGET_TYPE_CHOICES
    context['component_types']=COMPONENT_TYPE_CHOICES
    context['page_types']=PAGE_TYPE_CHOICES
    context['html_source_types']=HTML_SOURCE_CHOICES
    context['read_function_codes']=READ_FUNCTION_CODES
    context['write_function_codes']=WRITE_FUNCTION_CODES
    





    return context

def get_html_filename(module_type):
    filename = module_type.lower().replace(' ', '_')
    return f"devices/{filename}/"

def generate_random_string(length, char_type='string', case='lower'):
    
    if not isinstance(length, int) or length <= 0:
        raise ValueError("Length must be a positive integer.")
    
    if char_type not in ['string', 'int']:
        raise ValueError("char_type must be either 'string' or 'int'.")

    # Generate a string of digits if the type is 'int'.
    if char_type == 'int':
        characters = string.digits
        return ''.join(random.choice(characters) for _ in range(length))

    # Use UUID for strings longer than 8 characters.
    if length > 8:
        generated_string = str(uuid.uuid4()).replace('-', '')[:length]
    else:
        # Build the character pool for string generation without special characters.
        characters = string.ascii_letters + string.digits
        generated_string = ''.join(random.choice(characters) for _ in range(length))

    # Apply the correct casing if the type is 'string'.
    if case == 'lower':
        return generated_string.lower()
    elif case == 'upper':
        return generated_string.upper()
    elif case == 'capitalize':
        return generated_string.capitalize()
    else:
        return generated_string.lower()

def param_name(Register,device):
    s = f"{device}_{Register}"
    s = s.lower()
    s = re.sub(r'\s+', '_', s)
    return s




def create_report(report_type, generated_by, start_time, end_time, file, name=''):
    from main.models import Report
    """
    Creates a Report instance.
    """
    report = Report.objects.create(
        report_type=report_type,
        generated_by=generated_by,
        start_time=start_time,
        end_time=end_time,
        file=file,
        name=name or f"Report-{now()}"
    )
    return report

def send_notif( subject, message, recipient_users,type =[], notif_level='info'):
    from main.models import Notification
    if not recipient_users:
        return
    if not isinstance(recipient_users, list):
        recipient_users = [recipient_users]

    for user in recipient_users:
        is_sent_status = False
        status_message = f"Failed to send via {type}"
        recipient_detail = ""

        try:
            if  'email' in type:
                recipient_detail = user.email
                html_content = render_to_string('email.html', {
                    'title': subject,
                    'message': message,
                    'notif_level': notif_level,
                    'timestamp': timezone.now(),
                    'smarty_name': settings.DEFAULT_FROM_EMAIL
                })
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [recipient_detail],
                    fail_silently=False,
                    html_message=html_content,
                )
                is_sent_status = True
                status_message = "Sent via Email"
            if 'sms' in type:
                recipient_detail = user.phone
                sms_result = send_sms(
                    recipient=recipient_detail,
                    sender="SMARTY",
                    message=message
                )
                if sms_result.get("status") == "success":
                    is_sent_status = True
                status_message = "Sent via SMS"
            if 'telegram' in type:
                from .tg import send
                msg=("🚨 *BMS SYSTEM ALERT*\n\n"
                        f"Event: {subject}\n"
                        f"Message: {message}")
                send(msg)
            else:
                status_message = "Invalid notification type"
        except Exception as e:
            status_message = f"Failed: {e}"

        Notification.objects.create(
            message=message,
            type=notif_level,
            to=recipient_detail,
            status=status_message,
            is_sent=is_sent_status,
            created_at=timezone.now()
        )
 
def upate_register_value(param, raw_value):
    raw_value=raw_value*param.gain+param.offset
    if param.data_type == 'FLOAT' or param.data_type == 'INTEGER':
        if param.range_max - param.range_min == 0:
            return None
        else:
            scaled_value = (raw_value - param.range_min) * (param.scale_max- param.scale_min) / (param.range_max - param.range_min) + param.scale_min
            return scaled_value
    else:
        return raw_value
    

def group_add_point(request,device):
    param_list = []
    available_types = [t[0] for t in d.MODULE_TYPES]

    if device.device_type in available_types:
        if device.device_type == 'AVR':
            param_list = d.AVR_PARAMETERS
        elif device.device_type == 'FIRE SYSTEM':
            param_list = d.FIRE_PANEL_PARAMETER
        elif device.device_type == 'TRANSFORMER':
            param_list = d.TRANSFORMER_PARAMETER
        elif device.device_type == 'WATER METER':
            param_list = d.WATER_METER_PARAMETER
        elif device.device_type == 'LIFT':
            param_list = d.LIFT_PARAMETER
        elif device.device_type == 'LIGHTING CONTROL SYSTEM':
            param_list = d.LIGHTING_CONTROL_SYSTEM_PARAMETER
        elif device.device_type == 'ACCESS CONTROL':
            param_list = d.ACCESS_CONTROL_PARAMETER
        elif device.device_type == 'HVAC SYSTEM' or device.device_type == 'HVAC':
            param_list = d.HVAC_PARAMETER
        elif device.device_type == 'ENERGY METER':
            param_list = d.ENERGY_METER_PARAMETER
        elif device.device_type == 'ATS':
            param_list = d.ATS_PARAMETER
        elif device.device_type == 'GENERATOR':
            param_list = d.GEN_PARAMETER
        elif device.device_type == 'UPS':
            param_list = d.UPS_PARAMETER
        elif device.device_type == 'SECURITY SYSTEM':
            param_list = d.SECURITY_SYSTEM_PARAMETER
        elif device.device_type == 'SURVEILLANCE SYSTEM':
            param_list = d.SURVEILLANCE_SYSTEM_PARAMETER
        elif device.device_type == 'ENVIRONMENTAL SENSOR':
            param_list = d.ENVIRONMENTAL_SENSOR_PARAMETER
        elif device.device_type == 'UTILITY MANAGEMENT':
            param_list = d.UTILITY_MANAGEMENT_SYSTEM_PARAMETER
        elif device.device_type == 'GAS DETECTION SYSTEM':
            param_list = d.GAS_DETECTION_SYSTEM_PARAMETER
        elif device.device_type == 'PUMP CONTROLLER':
            param_list = d.PUMP_CONTROLLER_PARAMETER
        elif device.device_type == 'VFD':
            param_list = d.VFD_PARAMETER
        elif device.device_type == 'AUDIO VISUAL SYSTEM':
            param_list = d.AUDIO_VISUAL_SYSTEM_PARAMETER
        
        else:
            # Unknown/unsupported module type: leave param_list empty
            param_list = []
    else:
        # If device_type isn't one of the defined module types, no params
        param_list = []
        print(f"Device type '{device.device_type}' not recognized. No Registers added.")
    # If we have Register templates, create Register and SmartyRegister records
    if not param_list:
        print(f"No Registers defined for device type '{device.device_type}'.")
        return
   

    for idx, p in enumerate(param_list):
        # 1. Format the display name using your helper
        display_name = param_name(p.get('name', 'Unknown'), device.name)

        # 2. Normalize Enums for Django Admin (e.g., "Analog", "Input", "Float")
        # Your new list already has "Analog", but .title() adds safety.
        signal_type = p.get('signal_type', 'Digital').title()
        direction   = p.get('direction', 'Input').title()
        data_type   = p.get('data_type', 'Real').title()
        error_stat  = p.get('error_status', 'OK') # Keep as is (OK, Warning, Fault)

        try:
            Point.objects.create(
                point_group=device,
                name=display_name.replace(' ', '_').lower(),
                # signal_type=signal_type,
                direction=direction,
                # current_value=p.get('current_value', ''),
                unit=p.get('unit', ''),
                data_type=data_type,
                
                # Numeric & Technical Fields from your new dict
                range_min=p.get('range_min', 4.0),
                range_max=p.get('range_max', 20.0),
                scale_min=p.get('scale_min', 0.0),
                scale_max=p.get('scale_max', 100.0),
                # resolution=p.get('resolution', 1),
                
                # Bitwise logic
                is_single_bit=p.get('is_single_bit', False),
                bit=p.get('bit_models', 1),
                bit_size=p.get('bit_size', 16),
                
                # Computational Fields
                # count=p.get('count', 0),
                offset_before_gain=p.get('offset_before_gain', False),
                frequency=p.get('frequency', 1.0),
                gain=p.get('gain', 1.0),
                offset=p.get('offset', 0.0),
                pulse_width=p.get('pulse_width'), # Can be None
                
                # Thresholds & Status
                threshold_high=p.get('threshold_high', 100.0),
                threshold_low=p.get('threshold_low', 0.0),
                is_active=p.get('is_active', True),
                is_isolated=p.get('is_isolated', False),
                error_status=error_stat,
                can_be_faulty=p.get('can_be_faulty', False),
                faulty_value=p.get('faulty_value'), # Defaults to Null
            )
        except Exception as e:
            print(f"Failed to create Register '{display_name}': {str(e)}")
            continue
def device_add_params(request,device):
    param_list = []
    available_types = [t[0] for t in d.MODULE_TYPES]

    if device.device_type in available_types:
        if device.device_type == 'AVR':
            param_list = d.AVR_PARAMETERS
        elif device.device_type == 'FIRE SYSTEM':
            param_list = d.FIRE_PANEL_PARAMETER
        elif device.device_type == 'TRANSFORMER':
            param_list = d.TRANSFORMER_PARAMETER
        elif device.device_type == 'WATER METER':
            param_list = d.WATER_METER_PARAMETER
        elif device.device_type == 'LIFT':
            param_list = d.LIFT_PARAMETER
        elif device.device_type == 'LIGHTING CONTROL SYSTEM':
            param_list = d.LIGHTING_CONTROL_SYSTEM_PARAMETER
        elif device.device_type == 'ACCESS CONTROL':
            param_list = d.ACCESS_CONTROL_PARAMETER
        elif device.device_type == 'HVAC SYSTEM' or device.device_type == 'HVAC':
            param_list = d.HVAC_PARAMETER
        elif device.device_type == 'ENERGY METER':
            param_list = d.ENERGY_METER_PARAMETER
        elif device.device_type == 'ATS':
            param_list = d.ATS_PARAMETER
        elif device.device_type == 'GENERATOR':
            param_list = d.GEN_PARAMETER
        elif device.device_type == 'UPS':
            param_list = d.UPS_PARAMETER
        elif device.device_type == 'SECURITY SYSTEM':
            param_list = d.SECURITY_SYSTEM_PARAMETER
        elif device.device_type == 'SURVEILLANCE SYSTEM':
            param_list = d.SURVEILLANCE_SYSTEM_PARAMETER
        elif device.device_type == 'ENVIRONMENTAL SENSOR':
            param_list = d.ENVIRONMENTAL_SENSOR_PARAMETER
        elif device.device_type == 'UTILITY MANAGEMENT':
            param_list = d.UTILITY_MANAGEMENT_SYSTEM_PARAMETER
        elif device.device_type == 'GAS DETECTION SYSTEM':
            param_list = d.GAS_DETECTION_SYSTEM_PARAMETER
        elif device.device_type == 'PUMP CONTROLLER':
            param_list = d.PUMP_CONTROLLER_PARAMETER
        elif device.device_type == 'VFD':
            param_list = d.VFD_PARAMETER
        elif device.device_type == 'AUDIO VISUAL SYSTEM':
            param_list = d.AUDIO_VISUAL_SYSTEM_PARAMETER
        
        else:
            # Unknown/unsupported module type: leave param_list empty
            param_list = []
    else:
        # If device_type isn't one of the defined module types, no params
        param_list = []
        print(f"Device type '{device.device_type}' not recognized. No Registers added.")
    # If we have Register templates, create Register and SmartyRegister records
    if not param_list:
        print(f"No Registers defined for device type '{device.device_type}'.")
        return
   

    for idx, p in enumerate(param_list):
        # 1. Format the display name using your helper
        display_name = param_name(p.get('name', 'Unknown'), device.name)

        # 2. Normalize Enums for Django Admin (e.g., "Analog", "Input", "Float")
        # Your new list already has "Analog", but .title() adds safety.
        signal_type = p.get('signal_type', 'Digital').title()
        direction   = p.get('direction', 'Input').title()
        data_type   = p.get('data_type', 'Real').title()
        error_stat  = p.get('error_status', 'OK') # Keep as is (OK, Warning, Fault)

        try:
            Register.objects.create(
                device=device,
                name=display_name.replace(' ', '_').lower(),
                signal_type=signal_type,
                direction=direction,
                current_value=p.get('current_value', ''),
                unit=p.get('unit', ''),
                data_type=data_type,
                
                # Numeric & Technical Fields from your new dict
                range_min=p.get('range_min', 4.0),
                range_max=p.get('range_max', 20.0),
                scale_min=p.get('scale_min', 0.0),
                scale_max=p.get('scale_max', 100.0),
                resolution=p.get('resolution', 1),
                
                # Bitwise logic
                is_single_bit=p.get('is_single_bit', False),
                bit_models=p.get('bit_models', 1),
                bit_size=p.get('bit_size', 16),
                
                # Computational Fields
                count=p.get('count', 0),
                offset_before_gain=p.get('offset_before_gain', False),
                frequency=p.get('frequency', 1.0),
                gain=p.get('gain', 1.0),
                offset=p.get('offset', 0.0),
                pulse_width=p.get('pulse_width'), # Can be None
                
                # Thresholds & Status
                threshold_high=p.get('threshold_high', 100.0),
                threshold_low=p.get('threshold_low', 0.0),
                is_active=p.get('is_active', True),
                is_isolated=p.get('is_isolated', False),
                error_status=error_stat,
                can_be_faulty=p.get('can_be_faulty', False),
                faulty_value=p.get('faulty_value'), # Defaults to Null
            )
        except Exception as e:
            print(f"Failed to create Register '{display_name}': {str(e)}")
            continue

def generate_time_x_data(now, duration_minutes, interval_minutes):
    """
    Generates a list of formatted time strings (HH:MM) from 'now - duration' up to 'now',
    sampled at 'interval_minutes'.
    """
    # The start time is 'now' minus the total duration
    start_time = now - timedelta(minutes=duration_minutes)
    
    # Generate points from start_time up to (but not including) now
    x_data = []
    current_time = start_time
    while current_time < now:
        x_data.append(current_time.strftime('%H:%M'))
        current_time += timedelta(minutes=interval_minutes)
        
    return x_data
def generate_date_x_data(now, duration_days, interval_days, date_format='%m/%d'):
    """
    Generates a list of formatted date strings from 'now - duration' up to 'now',
    sampled at 'interval_days'.
    """
    # Start one day before the current day, or at the start of the period
    start_time = now - timedelta(days=duration_days)
    
    x_data = []
    current_time = start_time
    while current_time < now:
        x_data.append(current_time.strftime(date_format))
        current_time += timedelta(days=interval_days)
        
    return x_data
def generate_x_data_by_period(period, now):
    """
    Determines the appropriate X-axis data based on the selected period.
    """
    # NOTE: The provided logic for 'today' and 'yesterday' (24*60 min duration with 2*60 min interval) 
    # samples the whole day at 2-hour intervals, resulting in 12 points (01:59, 03:59, etc.).
    # The 'this_month'/'last_month' logic is simplified to 30 days.
    
    if period == 'last_5_min':
        # 10 points (0.5 min interval)
        x_data = generate_time_x_data(now, 5, 0.5) 
    
    elif period == 'last_15_min':
        # 15 points (1 min interval)
        x_data = generate_time_x_data(now, 15, 1) 
    
    elif period == 'last_30_min':
        # 15 points (2 min interval)
        x_data = generate_time_x_data(now, 30, 2) 
    
    elif period == 'this_hour' or period == 'last_hour':
        # 12 points (5 min interval)
        x_data = generate_time_x_data(now, 60, 5) 

    elif period == 'today':
        # 12 points (2-hour intervals)
        x_data = generate_time_x_data(now.replace(hour=23, minute=59), 24*60, 2*60)
    
    elif period == 'yesterday':
        # 12 points (2-hour intervals for yesterday)
        yesterday_end = now.replace(hour=23, minute=59) - timedelta(days=1)
        x_data = generate_time_x_data(yesterday_end, 24*60, 2*60)

    elif period == 'last_7_days' or period == 'this_week' or period == 'last_week':
        # ~14 points (0.5 day/12-hour interval)
        x_data = generate_date_x_data(now, 7, 0.5, date_format='%m/%d %H:%M')
        
    elif period == 'last_3_months':
        # ~13 points (7-day interval)
        x_data = generate_date_x_data(now, 90, 7, date_format='%m/%d')
        
    elif period == 'this_month' or period == 'last_month':
        num_days = 30
        
        # Determine the start of the month for calculation
        if period == 'this_month':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            # Go back to the first day of the current month, then subtract a day to land in the previous month, 
            # then go back to the first day of the previous month.
            prev_month_end = now.replace(day=1) - timedelta(days=1)
            start_date = prev_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
        x_data = [(start_date + timedelta(days=i)).strftime('%m/%d') for i in range(num_days)]
        
    elif period == 'this_year' or period == 'last_year':
        # 12 points (Months)
        x_data = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
    else:
        # Default X-data to 'today'
        x_data = generate_time_x_data(now.replace(hour=23, minute=59), 24*60, 2*60) 
        
    return x_data

def get_date_range_from_period(period_str: str, now: datetime):
    
    # 1. Ensure 'now' is a datetime object for calculations
    end_time = now
    
    # 2. Handle simple relative periods
    if period_str == 'last_5_min':
        start_time = now - timedelta(minutes=5)
    elif period_str == 'last_15_min':
        start_time = now - timedelta(minutes=15)
    elif period_str == 'last_30_min':
        start_time = now - timedelta(minutes=30)
    elif period_str == 'last_hour':
        start_time = now - timedelta(hours=1)
    elif period_str == 'last_7_days':
        start_time = now - timedelta(days=7)
    
    # 3. Handle 'This' and 'Yesterday' periods (setting time to start of period)
    elif period_str == 'today':
        start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period_str == 'this_hour':
        start_time = now.replace(minute=0, second=0, microsecond=0)
    elif period_str == 'yesterday':
        start_time = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_time = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(microseconds=1) # End of yesterday
    
    # 4. Handle Weekly Periods (Requires dateutil for clean week start/end)
    elif period_str == 'this_week':
        # Start of current week (Monday)
        start_time = now.date() - timedelta(days=now.weekday())
        start_time = datetime.combine(start_time, datetime.min.time())
    elif period_str == 'last_week':
        # Start of last week (Monday)
        last_week_start = now.date() - timedelta(days=now.weekday() + 7)
        start_time = datetime.combine(last_week_start, datetime.min.time())
        end_time = datetime.combine(now.date() - timedelta(days=now.weekday()), datetime.min.time()) - timedelta(microseconds=1)
        
    # 5. Handle Monthly/Quarterly Periods (Requires dateutil)
    elif period_str == 'this_month':
        start_time = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period_str == 'last_month':
        start_time = (now + relativedelta(months=-1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_of_last_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(microseconds=1)
        end_time = end_of_last_month
    elif period_str == 'last_3_months':
        start_time = (now + relativedelta(months=-3)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # 6. Handle Yearly Periods
    elif period_str == 'this_year':
        start_time = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period_str == 'last_year':
        start_time = (now + relativedelta(years=-1)).replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_time = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(microseconds=1)

    # 7. Handle All Time (Set start_time very far in the past)
    elif period_str == 'all_time':
        start_time = datetime(1970, 1, 1) # Unix epoch start
    
    else:
        # Default fallback: Today
        start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
    return start_time, end_time