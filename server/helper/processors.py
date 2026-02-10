import json
from django.utils import timezone
from django.apps import apps
from django.db.models import Sum, Avg, Count

# --- HELPER FUNCTIONS ---

def create_alarm(point, name, description, severity='MEDIUM'):
    """Creates alarm if no active alarm for this point/reason exists."""
    Alarm = apps.get_model('main', 'Alarm')
    exists = Alarm.objects.filter(point=point, name=name, is_active=True).exists()
    if not exists:
        return Alarm.objects.create(
            point=point,
            name=name,
            description=description,
            severity=severity,
            is_active=True,
        )
    return None

def create_event(point, event_type, description, severity='INFO'):
    """Records system events."""
    Event = apps.get_model('main', 'Event')
    return Event.objects.create(
        point=point,
        event_type=event_type,
        description=description,
        severity=severity
    )

def create_log(point, value, source='Point_Update'):
    """Stores historical data for future reference."""
    Log = apps.get_model('main', 'Log')
    return Log.objects.create(
        point=point,
        source=source,
        message=f"{point.name} recorded as {value}",
        value=str(value),
        name=f"Log-{point.name}"
    )

# --- POINT PROCESSOR CLASS ---

class PointProcessor:
    def __init__(self, point):
        # We take the point instance directly. No need to import models here.
        self.point = point
        self.register = getattr(point, 'register', None)

    def process(self):
        """
        Main logic called by the Point model property.
        """
        # 1. Manual Force Priority
        if self.point.is_forced:
            val = self._handle_force_logic()
            self._persist_value(val)
            return val

        # 2. Register Error Status Priority
        if self.point.point_type == 'REGISTER' and self.register:
            if self.register.error_status != 'OK':
                self._handle_register_error()
                # Use faulty value if point allows it, otherwise 0
                val = self.point.faulty_value if self.point.can_be_faulty else 0
                self._persist_value(val)
                return val

        # 3. Resolve Value based on Type
        if self.point.point_type == 'REGISTER':
            resolved_val = self._resolve_register_value()
        elif self.point.point_type == 'VARIABLE':
            resolved_val = self._cast_type(self.point.read_value)
        elif self.point.point_type == 'DATA':
            resolved_val = self._resolve_data_type_value()
        else:
            resolved_val = 0

        # 4. Handle Alerts, Events, and Historical Logs
        self._check_logic_and_alerts(resolved_val)

        # 5. Save state to DB (Stops the Initial_Log loop)
        self._persist_value(resolved_val)
        
        return resolved_val

    def _persist_value(self, val):
        """Updates the database so the system knows the last state."""
        self.point.read_value = str(val)
        self.point.save(update_fields=['read_value'])

    def _cast_type(self, val):
        if val is None or val == "": return None
        try:
            if self.point.data_type == 'Boolean':
                return 1 if str(val).lower() in ['1', 'true', 'on', 'yes'] else 0
            return float(val)
        except:
            return val

    def _resolve_register_value(self):
        """Interprets raw C# register data based on Point instructions."""
        if not self.register: return 0
        raw_val = float(self.register.current_value or 0)

        # A. Boolean Logic (Digital or Multistate Bitwise)
        if self.point.data_type == 'Boolean':
            if self.register.signal_type == 'Digital':
                return 1 if raw_val > 0.5 else 0
            elif self.register.signal_type == 'Multistate':
                if self.point.is_single_bit:
                    # Bitwise operation: shift to the bit and mask it
                    return (int(raw_val) >> self.point.bit) & 1
                return 1 if raw_val > 0.5 else 0

        # B. Analogue Logic (Integer, Float, Real)
        if self.point.data_type in ['Integer', 'Float', 'Real']:
            # Calibration (Gain/Offset)
            if self.point.offset_before_gain:
                cal = (raw_val + self.point.offset) * self.point.gain
            else:
                cal = (raw_val * self.point.gain) + self.point.offset

            # Scaling (Range to Scale Extrapolation)
            r_span = self.point.range_max - self.point.range_min
            s_span = self.point.scale_max - self.point.scale_min
            if r_span != 0:
                val = self.point.scale_min + (cal - self.point.range_min) * (s_span / r_span)
            else:
                val = cal
            
            return round(val, self.point.decimal_places) if self.point.data_type != 'Integer' else int(val)

        return raw_val

    def _check_logic_and_alerts(self, current_val):
        """Processes thresholds, 1% range events, 10% warnings, and 2% logs."""
        old_val = self._cast_type(self.point.read_value)
        has_changed = (old_val is not None and current_val != old_val)

        # 1. Boolean Events and Faulty Value Alarms
        if self.point.data_type == 'Boolean':
            if has_changed:
                status = "ON" if current_val == 1 else "OFF"
                create_event(self.point, "STATE_CHANGE", f"{self.point.name} is {status}")
                create_log(self.point, current_val, source='State_Change')

            if self.point.can_be_faulty and current_val == self.point.faulty_value:
                create_alarm(self.point, "Fault Condition", f"{self.point.name} in faulty state", 'HIGH')

        # 2. Analogue Logic
        elif self.point.data_type in ['Integer', 'Float', 'Real']:
            t_high = self.point.threshold_high
            t_low = self.point.threshold_low
            span = abs(t_high - t_low)
            margin = span * 0.10
            
            # Threshold Alarms (10% approaching margin)
            if current_val >= t_high or current_val <= t_low:
                create_alarm(self.point, "Threshold Violation", f"{self.point.name} out of bounds", 'CRITICAL')
            elif current_val >= (t_high - margin) or current_val <= (t_low + margin):
                create_alarm(self.point, "Threshold Warning", f"{self.point.name} approaching limit", 'MEDIUM')

            # 1% Range Event
            r_span = abs(self.point.range_max - self.point.range_min)
            if r_span > 0 and has_changed:
                if (abs(current_val - old_val) / r_span) >= 0.01:
                    create_event(self.point, "VALUE_CHANGE", f"{self.point.name} shifted to {current_val}")

            # 2% Scale Log
            s_span = abs(self.point.scale_max - self.point.scale_min)
            if s_span > 0 and has_changed:
                if (abs(current_val - old_val) / s_span) >= 0.02:
                    create_log(self.point, current_val, source='Historical_Log')

        # Log initial encounter
        if old_val is None:
            create_log(self.point, current_val, source='Initial_Log')

    def _handle_force_logic(self):
        val = self._cast_type(self.point.forced_value)
        return val

    def _handle_register_error(self):
        name = f"Hardware Error: {self.register.error_status}"
        create_alarm(self.point, name, self.register.error_message or "Register Fault", 'HIGH')

    def _resolve_data_type_value(self):
        """DATA point type logic: parses json_data to aggregate across apps."""
        try:
            if not self.point.json_data: return 0
            cfg = json.loads(self.point.json_data)
            # Use apps.get_model to avoid circular imports
            TargetModel = apps.get_model(cfg.get('app', 'main'), cfg.get('model'))
            
            qs = TargetModel.objects.all()
            if cfg.get('action') == 'filter':
                qs = qs.filter(**cfg.get('params', {}))
            
            res_type = cfg.get('return')
            if res_type == 'count': return qs.count()
            elif res_type == 'sum': return qs.aggregate(s=Sum(cfg.get('field', 'value')))['s'] or 0
            return 0
        except:
            return 0