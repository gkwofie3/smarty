USER_TYPE_CHOICES={
    ('superadmin', 'Super Admin'),
    ('admin', 'Admin'),
}
# ================================================
# Protocol Choices
# ================================================
PROTOCOL_CHOICES = (
    ("ModbusTCP", "Modbus TCP"),
    ("ModbusRTU", "Modbus RTU"),
    ("BACnetIP", "BACnet IP"),
    ("BACnetMSTP", "BACnet MS/TP"),
    ("Mqtt", "MQTT"),
)

# ================================================
# DeviceType Choices
# ================================================
DEVICE_TYPE_CHOICES = [
    ('AVR', 'AVR'),#
    ('FIRE SYSTEM', 'Fire System'),#
    ('ATS', 'ATS'),#
    ('GENERATOR', 'Generator'),#
    ('HVAC SYSTEM', 'HVAC System'),#
    ('TRANSFORMER', 'Transformer'),#
    ('UPS', 'UPS'),#
    ('ENERGY METER', 'Energy Meter'),#
    ('WATER METER', 'Water Meter'),#
    ('LIFT', 'Lift'),#
    ('LIGHTING CONTROL SYSTEM', 'Lighting Control System'),#
    ('ACCESS CONTROL', 'Access Control'),#
    ('SECURITY SYSTEM', 'Security System'),#
    ('SURVEILLANCE SYSTEM', 'Surveillance System'),#
    ('ENVIRONMENTAL SENSOR', 'Environmental Sensor'),#
    ('UTILITY MANAGEMENT', 'Utility Management System'),#
    ('GAS DETECTION SYSTEM', 'Gas Detection System'),#
    ('PUMP CONTROLLER', 'Pump Controller'),
    ('VFD', 'VFD'),
    ('AUDIO VISUAL SYSTEM', 'Audio Visual System'),

]

# ================================================
# Modbus Baud Rate Choices
# ================================================
MODBUS_BAUD_RATE_CHOICES = (
    (1200, "1200"),
    (2400, "2400"),
    (4800, "4800"),
    (9600, "9600"),
    (19200, "19200"),
    (38400, "38400"),
    (57600, "57600"),
    (115200, "115200"),
)

# ================================================
# Modbus Parity Choices
# ================================================
MODBUS_PARITY_CHOICES = (
    ("None", "None"),
    ("Even", "Even"),
    ("Odd", "Odd"),
)

# ================================================
# Modbus Stop Bits Choices
# ================================================
MODBUS_STOP_BITS_CHOICES = (
    (1, "1"),
    (2, "2"),
)

# ================================================
# SignalType Choices
# ================================================
SIGNAL_TYPE_CHOICES = (
    ("Digital", "Digital"),
    ("Analog", "Analog"),
    ("Pulse", "Pulse"),
    ("Multistate", "Multistate")
)
IO_TYPE_CHOICES = (
    ('REGISTER', 'Register Value'),
    ('VARIABLE', 'Variable Display'),
    ('DATA', 'Data'),
)
IO_DATA_TYPE_CHOICES = (
    ("Integer", "Integer"),
    ("Float", "Float"),
    ("Real", "Real"),
    ("Boolean", "Boolean"),
    ('String', 'String'),
    ("List", "List"),
    ("Object", "Object")
)
FUNCTION_CODE_CHOICES = (
    ("01", "01 - Read Coils"),
    ("02", "02 - Read Discrete Inputs"),
    ("03", "03 - Read Holding Registers"),
    ("04", "04 - Read Input Registers"),
    ("05", "05 - Write Single Coil"),
    ("06", "06 - Write Single Register"),
    ("15", "15 - Write Multiple Coils"),
    ("16", "16 - Write Multiple Registers"),
)
READ_FUNCTION_CODES = (
    ("01", "01 - Read Coils"),
    ("02", "02 - Read Discrete Inputs"),
    ("03", "03 - Read Holding Registers"),
    ("04", "04 - Read Input Registers"),
    
)
WRITE_FUNCTION_CODES = (
    ("05", "05 - Write Single Coil"),
    ("06", "06 - Write Single Register"),
    ("15", "15 - Write Multiple Coils"),
    ("16", "16 - Write Multiple Registers"),
)

# ================================================
# BACnet Object Type Choices
# ================================================
BACNET_OBJECT_TYPE_CHOICES = (
    (0, "Analog Input"),
    (1, "Analog Output"),
    (2, "Analog Value"),
    (3, "Binary Input"),
    (4, "Binary Output"),
    (5, "Binary Value"),
    (13, "Multi-state Input"),
    (14, "Multi-state Output"),
    (19, "Multi-state Value"),
)
# ================================================
# Direction Choices
# ================================================
DIRECTION_CHOICES = (
    ("Input", "Input"),
    ("Output", "Output"),
)

# ================================================
# DataType Choices
# ================================================
DATA_TYPE_CHOICES = (
    ("Integer", "Integer"),
    ("Float", "Float"),
    ("Real", "Real"),
    ("Boolean", "Boolean"),
)

# ================================================
# ErrorStatus Choices
# ================================================
ERROR_STATUS_CHOICES = (
    ('OK', 'OK'),
    ('FAULT', 'Hardware Fault'),
    ('COMM_ERROR', 'Communication Error'),
    ('RANGE_ERROR', 'Out of Range'),
)



PAGE_TYPE_CHOICES = [
    ('STANDARD', 'Standard'),
    ('HTML', 'Raw HTML'),
]
HTML_SOURCE_CHOICES = [
        ('CODE', 'Direct Code Entry'),
        ('FILE', 'External HTML File'),
    ]
SECTION_TYPE_CHOICES = [
    ('GRID', 'Grid'),
    ('FLEX', 'Flex'),
    ('TABS', 'Tabs'),
]

WIDGET_TYPE_CHOICES = [
    ('gauge', 'Gauge Chart'),
    ('vertical_gauge', 'Vertical Gauge'),
    ('radial_gauge', 'Radial Gauge'),
    ('status_card', 'Status Card'),
    ('control', 'Control Panel'),
    ('line_chart', 'Line Chart'),
    ('bar_chart', 'Bar Chart'),
    ('pie_chart', 'Pie Chart'),
    ('data_table', 'Data Table'),
    ('text_display', 'Text Display'),
    ('list', 'Simple List'),
    ('list_with_icons', 'List with Icons'),
    ('map', 'Map View'),
    ('stat_panel', 'Statistics Panel'),
    ('image_widget', 'Image Widget'),
    ('video_widget', 'Video Widget'),
    ('status_indicator', 'Status Indicator'),
    ('toggle_switch', 'Toggle Switch'),
    ('value_readout', 'Value Readout'),
]

COMPONENT_TYPE_CHOICES = [
    ('TEXT', 'Text Block'),
    ('VARIABLE', 'Variable Display'),
    ('DATA', 'Data'),
    ('WRITE_COMMAND', 'Write Command'),
    ('PROGRESS_BAR', 'Progress Bar'),
    ('INDICATOR', 'Status Indicator'),
    ('TOGGLE', 'Toggle Switch'),
    ('READOUT', 'Value Readout'),
]