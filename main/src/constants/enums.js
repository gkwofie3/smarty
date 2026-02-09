export const DEVICE_TYPE_CHOICES = [
    { value: 'GENERATOR', label: 'Generator' },
    { value: 'ENERGY METER', label: 'Energy Meter' },
    { value: 'AHU', label: 'AHU' },
    { value: 'CHILLER', label: 'Chiller' },
    { value: 'PUMP', label: 'Pump' },
];

export const PROTOCOL_CHOICES = [
    { value: 'Modbus', label: 'Modbus' },
    { value: 'BACnet', label: 'BACnet' },
    { value: 'SNMP', label: 'SNMP' },
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
