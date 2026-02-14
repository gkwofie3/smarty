export const DEVICE_TYPE_CHOICES = [
    { value: 'AVR', label: 'AVR' },
    { value: 'FIRE SYSTEM', label: 'Fire System' },
    { value: 'ATS', label: 'ATS' },
    { value: 'GENERATOR', label: 'Generator' },
    { value: 'HVAC SYSTEM', label: 'HVAC System' },
    { value: 'TRANSFORMER', label: 'Transformer' },
    { value: 'UPS', label: 'UPS' },
    { value: 'ENERGY METER', label: 'Energy Meter' },
    { value: 'WATER METER', label: 'Water Meter' },
    { value: 'LIFT', label: 'Lift' },
    { value: 'LIGHTING CONTROL SYSTEM', label: 'Lighting Control System' },
    { value: 'ACCESS CONTROL', label: 'Access Control' },
    { value: 'SECURITY SYSTEM', label: 'Security System' },
    { value: 'SURVEILLANCE SYSTEM', label: 'Surveillance System' },
    { value: 'ENVIRONMENTAL SENSOR', label: 'Environmental Sensor' },
    { value: 'UTILITY MANAGEMENT', label: 'Utility Management System' },
    { value: 'GAS DETECTION SYSTEM', label: 'Gas Detection System' },
    { value: 'PUMP CONTROLLER', label: 'Pump Controller' },
    { value: 'VFD', label: 'VFD' },
    { value: 'AUDIO VISUAL SYSTEM', label: 'Audio Visual System' },
];

export const PROTOCOL_CHOICES = [
    { value: 'ModbusTCP', label: 'Modbus TCP' },
    { value: 'BACnetIP', label: 'BACnet IP' },
    { value: 'Mqtt', label: 'MQTT' },
];

export const BAUD_RATE_CHOICES = [
    { value: 9600, label: '9600' },
    { value: 19200, label: '19200' },
    { value: 38400, label: '38400' },
    { value: 57600, label: '57600' },
    { value: 115200, label: '115200' },
];

export const PARITY_CHOICES = [
    { value: 'None', label: 'None' },
    { value: 'Even', label: 'Even' },
    { value: 'Odd', label: 'Odd' },
];

export const STOP_BITS_CHOICES = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
];

export const FUNCTION_CODE_CHOICES = [
    { value: '01', label: '01 - Read Coils' },
    { value: '02', label: '02 - Read Discrete Inputs' },
    { value: '03', label: '03 - Read Holding Registers' },
    { value: '04', label: '04 - Read Input Registers' },
    { value: '05', label: '05 - Write Single Coil' },
    { value: '06', label: '06 - Write Single Register' },
    { value: '15', label: '15 - Write Multiple Coils' },
    { value: '16', label: '16 - Write Multiple Registers' },
];

export const SIGNAL_TYPE_CHOICES = [
    { value: 'Digital', label: 'Digital' },
    { value: 'Analog', label: 'Analog' },
];

export const DIRECTION_CHOICES = [
    { value: 'Input', label: 'Input' },
    { value: 'Output', label: 'Output' },
];

export const DATA_TYPE_CHOICES = [
    { value: 'Real', label: 'Real' },
    { value: 'Integer', label: 'Integer' },
    { value: 'Boolean', label: 'Boolean' },
    { value: 'String', label: 'String' },
];

export const ERROR_STATUS_CHOICES = [
    { value: 'OK', label: 'OK' },
    { value: 'Timeout', label: 'Timeout' },
    { value: 'CRC Error', label: 'CRC Error' },
    { value: 'Error', label: 'Error' },
];

export const IO_TYPE_CHOICES = [
    { value: 'REGISTER', label: 'Register' },
    { value: 'VARIABLE', label: 'Variable' }
];
