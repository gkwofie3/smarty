import networkx as nx
import logging
import math

logger = logging.getLogger(__name__)

class FBDExecutor:
    def __init__(self, program):
        self.program = program
        self.nodes = {n['id']: n for n in program.diagram_json.get('nodes', [])}
        self.edges = program.diagram_json.get('edges', [])
        self.bindings = program.bindings or {}
        self.state = {} # Store block states (e.g. timers, counters) if needed
        self.graph = self._build_graph()
        self.execution_order = self._get_execution_order()

    def _build_graph(self):
        G = nx.DiGraph()
        for node_id in self.nodes:
            G.add_node(node_id)
        
        for edge in self.edges:
            G.add_edge(edge['fromNode'], edge['toNode'], 
                       from_port=edge['fromPort'], 
                       to_port=edge['toPort'])
        return G

    def _get_execution_order(self):
        try:
            return list(nx.topological_sort(self.graph))
        except nx.NetworkXUnfeasible:
            logger.error(f"Cycle detected in program {self.program.name}")
            return []

    def execute_cycle(self):
        # 1. Read Inputs
        self._read_inputs()

        # 2. Execute Blocks in Order
        node_values = {} # Store Output values of each node: {node_id: [val1, val2]}
        
        for node_id in self.execution_order:
            node = self.nodes[node_id]
            inputs = self._gather_inputs(node_id, node_values)
            try:
                outputs = self._process_block(node, inputs)
            except Exception as e:
                logger.error(f"Error executing block {node['type']} ({node_id}): {e}")
                outputs = [None] * (node.get('outputs', 0))
            node_values[node_id] = outputs

        # 3. Write Outputs
        self._write_outputs(node_values)
        
        return node_values

    def _read_inputs(self):
        # Sync bound inputs from external system (e.g. Redis/DB)
        pass

    def _write_outputs(self, node_values):
        # Sync bound outputs to external system
        for node_id, values in node_values.items():
            if self.bindings.get(node_id):
                # point_id = self.bindings[node_id]
                # write_value(point_id, values[0])
                pass

    def _gather_inputs(self, node_id, node_values):
        input_count = self.nodes[node_id].get('inputs', 0)
        inputs = [None] * input_count
        
        for u, v, data in self.graph.in_edges(node_id, data=True):
            to_port = data['toPort']
            from_port = data['from_port']
            
            if u in node_values:
                val = node_values[u][from_port]
                if 0 <= to_port < input_count:
                    inputs[to_port] = val
        
        return inputs

    def _process_block(self, node, inputs):
        type_ = node['type']
        
        # Helper
        def get_val(i, default=0): 
            return inputs[i] if (i < len(inputs) and inputs[i] is not None) else default
            
        vals = [get_val(i) for i in range(len(inputs))]
        b_vals = [bool(v) for v in vals]

        # Logical Gates (N-ary)
        if type_ == 'AND': return [all(b_vals)] # True if ALL are true
        elif type_ == 'OR': return [any(b_vals)] # True if ANY is true
        elif type_ == 'XOR': 
            # Multi-input XOR: Odd number of trues? Or cascading?
            # Typically IEC XOR is 2-input. For N-input:
            # "Exclusive OR" usually means "exactly one is true" or "odd number is true".
            # Mathematical XOR sum: sum(b_vals) % 2 == 1
            return [sum(b_vals) % 2 == 1]
        elif type_ == 'NOT': return [not b_vals[0] if b_vals else False]
        elif type_ == 'NAND': return [not all(b_vals)]
        elif type_ == 'NOR': return [not any(b_vals)]
        elif type_ == 'XNOR': return [sum(b_vals) % 2 == 0]

        # Arithmetic Operations (N-ary)
        elif type_ == 'ADD': return [sum(vals)]
        elif type_ == 'MUL':
            res = 1
            for v in vals: res *= v
            return [res]
        elif type_ == 'SUB': return [vals[0] - sum(vals[1:])] if len(vals) > 1 else [vals[0]]
        elif type_ == 'DIV': 
            res = vals[0]
            for v in vals[1:]:
                res = res / v if v != 0 else 0
            return [res]
        
        # ... (Rest remain mostly binary or unary) ...
        elif type_ == 'MOD': return [val(0) % val(1) if val(1) != 0 else 0]
        elif type_ == 'ABS': return [abs(val(0))]
        elif type_ == 'NEG': return [-val(0)]
        elif type_ == 'SQRT': return [math.sqrt(val(0)) if val(0) >= 0 else 0]
        elif type_ == 'POW': return [math.pow(val(0), val(1))]

        # Comparison Operations
        elif type_ == 'EQ': return [val(0) == val(1)]
        elif type_ == 'NE': return [val(0) != val(1)]
        elif type_ == 'GT': return [val(0) > val(1)]
        elif type_ == 'GE': return [val(0) >= val(1)]
        elif type_ == 'LT': return [val(0) < val(1)]
        elif type_ == 'LE': return [val(0) <= val(1)]

        # Selection Functions
        elif type_ == 'SEL': return [val(1) if b_val(0) else val(2)] # SEL G, IN0, IN1
        elif type_ == 'MAX': return [max(val(0), val(1))]
        elif type_ == 'MIN': return [min(val(0), val(1))]
        elif type_ == 'LIMIT': 
            mn, in_, mx = val(0), val(1), val(2)
            return [max(mn, min(in_, mx))]

        # IO
        elif type_ == 'INPUT': return [self._get_bound_value(node['id'])]
        elif type_ == 'OUTPUT': return [val(0)]
        
        # Default
        return [None] * (node.get('outputs', 0))

    def _get_bound_value(self, node_id):
        if node_id in self.bindings:
            # return get_point_value(self.bindings[node_id])
            return 1 # Mock
        return 0
