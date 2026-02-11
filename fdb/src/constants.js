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
        { type: "INPUT", label: "INPUT", inputs: 0, outputs: 1, params: { pointId: null } },
        { type: "OUTPUT", label: "OUTPUT", inputs: 1, outputs: 0, params: { pointId: null } }
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
