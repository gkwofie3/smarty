export const BLOCK_CATEGORIES = {
    "Logical Gates": [
        { type: "AND", label: "AND", inputs: 2, outputs: 1 },
        { type: "OR", label: "OR", inputs: 2, outputs: 1 },
        { type: "XOR", label: "XOR", inputs: 2, outputs: 1 },
        { type: "NOT", label: "NOT", inputs: 1, outputs: 1 },
        { type: "NAND", label: "NAND", inputs: 2, outputs: 1 },
        { type: "NOR", label: "NOR", inputs: 2, outputs: 1 },
        { type: "XNOR", label: "XNOR", inputs: 2, outputs: 1 }
    ],
    "Timers": [
        { type: "TON", label: "TON", inputs: 2, outputs: 2, params: { pt: 1000 } }, // IN, PT -> Q, ET
        { type: "TOF", label: "TOF", inputs: 2, outputs: 2, params: { pt: 1000 } },
        { type: "TP", label: "TP", inputs: 2, outputs: 2, params: { pt: 1000 } }
    ],
    "Counters": [
        { type: "CTU", label: "CTU", inputs: 3, outputs: 2, params: { pv: 0 } }, // CU, R, PV -> Q, CV
        { type: "CTD", label: "CTD", inputs: 3, outputs: 2, params: { pv: 0 } },
        { type: "CTUD", label: "CTUD", inputs: 4, outputs: 3, params: { pv: 0 } }
    ],
    "Math": [
        { type: "ADD", label: "ADD", inputs: 2, outputs: 1 },
        { type: "SUB", label: "SUB", inputs: 2, outputs: 1 },
        { type: "MUL", label: "MUL", inputs: 2, outputs: 1 },
        { type: "DIV", label: "DIV", inputs: 2, outputs: 1 }
    ],
    "Comparison": [
        { type: "EQ", label: "EQ", inputs: 2, outputs: 1 },
        { type: "NE", label: "NE", inputs: 2, outputs: 1 },
        { type: "GT", label: "GT", inputs: 2, outputs: 1 },
        { type: "LT", label: "LT", inputs: 2, outputs: 1 },
        { type: "GE", label: "GE", inputs: 2, outputs: 1 },
        { type: "LE", label: "LE", inputs: 2, outputs: 1 }
    ],
    "IO": [
        { type: "DIGITAL_IN", label: "DIG_IN", inputs: 0, outputs: 1, params: { pointId: null } },
        { type: "ANALOG_IN", label: "ANA_IN", inputs: 0, outputs: 1, params: { pointId: null } },
        { type: "DIGITAL_OUT", label: "DIG_OUT", inputs: 1, outputs: 0, params: { pointId: null } },
        { type: "ANALOG_OUT", label: "ANA_OUT", inputs: 1, outputs: 0, params: { pointId: null } },
        { type: "CONST_DIG", label: "CONST_DIG", inputs: 0, outputs: 1, params: { value: false } },
        { type: "CONST_ANA", label: "CONST_ANA", inputs: 0, outputs: 1, params: { value: 0 } }
    ],
    "Multiplexing": [
        { type: "MUX", label: "MUX 2:1", inputs: 3, outputs: 1 }, // IN0, IN1, SEL
        { type: "DEMUX", label: "DEMUX 1:2", inputs: 2, outputs: 2 } // IN, SEL
    ],
    "Encoders/Decoders": [
        { type: "ENCODER", label: "ENCODER 4:2", inputs: 4, outputs: 2 },
        { type: "DECODER", label: "DECODER 2:4", inputs: 2, outputs: 4 },
        { type: "BIN_TO_DIG", label: "BIN -> DIG", inputs: 1, outputs: 8 }, // Integer to 8-bits
        { type: "DIG_TO_BIN", label: "DIG -> BIN", inputs: 8, outputs: 1 }  // 8-bits to Integer
    ],
    "Utils": [
        { type: "SPLITTER", label: "SPLITTER", inputs: 1, outputs: 4 }
    ]
};

export const IO_TYPES = {
    BOOL: 'BOOL',
    INT: 'INT',
    REAL: 'REAL',
    TIME: 'TIME',
    STRING: 'STRING'
};

export const LAYOUT = {
    BLOCK_WIDTH: 100,
    HEADER_HEIGHT: 20,
    PORT_HEIGHT: 20,
    PORT_RADIUS: 4
};
