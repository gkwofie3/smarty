import logging
import math
from collections import deque

logger = logging.getLogger(__name__)

class FBDExecutor:
    def __init__(self, program):
        self.program = program
        # diagram_json might be a string or a dict depending on how it's saved/passed
        diagram = program.diagram_json
        if isinstance(diagram, str):
            import json
            try:
                diagram = json.loads(diagram)
            except:
                diagram = {}
        
        self.nodes_data = {n['id']: n for n in diagram.get('nodes', [])}
        self.edges = diagram.get('edges', [])
        self.bindings = program.bindings or {}
        
        # Build adjacency list and in-degree map for manual topological sort
        self.adj = {nid: [] for nid in self.nodes_data}
        self.in_degree = {nid: 0 for nid in self.nodes_data}
        self.in_edges = {nid: [] for nid in self.nodes_data} # nid: [(u, fromPort, toPort)]

        for edge in self.edges:
            u, v = edge.get('fromNode'), edge.get('toNode')
            if u in self.nodes_data and v in self.nodes_data:
                f_port = int(edge.get('fromPort', 0))
                t_port = int(edge.get('toPort', 0))
                self.adj[u].append(v)
                self.in_degree[v] += 1
                self.in_edges[v].append((u, f_port, t_port))

        self.execution_order = self._get_execution_order_kahn()

    def _get_execution_order_kahn(self):
        """Kahn's algorithm for topological sort (dependency-free)"""
        queue = deque([nid for nid, deg in self.in_degree.items() if deg == 0])
        order = []
        
        # Copy in_degree to avoid mutating original
        temp_in_degree = self.in_degree.copy()
        
        while queue:
            u = queue.popleft()
            order.append(u)
            for v in self.adj[u]:
                temp_in_degree[v] -= 1
                if temp_in_degree[v] == 0:
                    queue.append(v)
        
        if len(order) < len(self.nodes_data):
            logger.error(f"Cycle detected or missing nodes in FBD program {self.program.name}")
            # Fallback: add remaining nodes anyway to attempt execution
            remaining = set(self.nodes_data.keys()) - set(order)
            order.extend(list(remaining))
            
        return order

    def execute_cycle(self):
        node_values = {} # {node_id: [outputs]}
        
        for node_id in self.execution_order:
            node = self.nodes_data[node_id]
            
            # Gather inputs
            input_count = node.get('inputs', 0)
            inputs = [None] * input_count
            for u, f_port, t_port in self.in_edges[node_id]:
                if u in node_values:
                    u_outputs = node_values[u]
                    if 0 <= f_port < len(u_outputs):
                        val = u_outputs[f_port]
                        if 0 <= t_port < input_count:
                            inputs[t_port] = val
            
            # Process block
            try:
                outputs = self._process_block(node, inputs)
            except Exception as e:
                logger.error(f"Error executing block {node.get('type')} ({node_id}): {e}")
                outputs = [None] * node.get('outputs', 1)
            
            node_values[node_id] = outputs
            
        return node_values

    def _process_block(self, node, inputs):
        type_ = node.get('type', 'UNKNOWN')
        expected_outputs = node.get('outputs', 0)
        
        # Safe casting helpers for the engine core
        def cast_f(v):
            if v is None: return 0.0
            try: return float(v)
            except: return 0.0

        def cast_b(v):
            if v is None: return False
            if isinstance(v, bool): return v
            if isinstance(v, (int, float)): return v > 0.5
            if isinstance(v, str): return v.lower() in ['1', 'true', 'on', 'yes']
            return False

        f_vals = [cast_f(x) for x in inputs]
        b_vals = [cast_b(x) for x in inputs]

        res = []

        # Logic Gates
        if type_ == 'AND': res = [all(b_vals) if b_vals else False]
        elif type_ == 'OR': res = [any(b_vals)]
        elif type_ == 'XOR': res = [sum(b_vals) % 2 == 1]
        elif type_ == 'NOT': res = [not b_vals[0] if b_vals else True]
        elif type_ == 'NAND': res = [not all(b_vals) if b_vals else True]
        elif type_ == 'NOR': res = [not any(b_vals)]
        elif type_ == 'XNOR': res = [sum(b_vals) % 2 == 0]

        # Arithmetic
        elif type_ == 'ADD': res = [sum(f_vals)]
        elif type_ == 'SUB': res = [f_vals[0] - sum(f_vals[1:])] if f_vals else [0.0]
        elif type_ == 'MUL':
            m = 1.0
            for v in f_vals: m *= v
            res = [m]
        elif type_ == 'DIV':
            d = f_vals[0] if f_vals else 0.0
            for v in f_vals[1:]:
                if v != 0: d /= v
                else: d = 0.0; break
            res = [d]
        elif type_ == 'MOD': res = [f_vals[0] % f_vals[1] if len(f_vals) > 1 and f_vals[1] != 0 else 0.0]
        elif type_ == 'ABS': res = [abs(f_vals[0]) if f_vals else 0.0]
        elif type_ == 'NEG': res = [-f_vals[0] if f_vals else 0.0]
        elif type_ == 'SQRT': res = [math.sqrt(f_vals[0]) if f_vals and f_vals[0] >= 0 else 0.0]
        elif type_ == 'POW': res = [math.pow(f_vals[0], f_vals[1]) if len(f_vals) > 1 else 0.0]

        # Comparison
        elif type_ == 'EQ': res = [f_vals[0] == f_vals[1] if len(f_vals) > 1 else False]
        elif type_ == 'NE': res = [f_vals[0] != f_vals[1] if len(f_vals) > 1 else True]
        elif type_ == 'GT': res = [f_vals[0] > f_vals[1] if len(f_vals) > 1 else False]
        elif type_ == 'GE': res = [f_vals[0] >= f_vals[1] if len(f_vals) > 1 else False]
        elif type_ == 'LT': res = [f_vals[0] < f_vals[1] if len(f_vals) > 1 else False]
        elif type_ == 'LE': res = [f_vals[0] <= f_vals[1] if len(f_vals) > 1 else False]

        # Selection
        elif type_ == 'SEL': res = [f_vals[2] if b_vals[0] else f_vals[1]] if len(f_vals) >= 3 else [0.0]
        elif type_ == 'MAX': res = [max(f_vals) if f_vals else 0.0]
        elif type_ == 'MIN': res = [min(f_vals) if f_vals else 0.0]
        elif type_ == 'LIMIT':
            if len(f_vals) >= 3:
                mn, val, mx = f_vals[0], f_vals[1], f_vals[2]
                res = [max(mn, min(val, mx))]
            else: res = [0.0]

        # IO
        elif type_ == 'DIGITAL_IN' or type_ == 'ANALOG_IN':
            val = self._get_binding_value(node.get('params', {}).get('pointId'))
            if type_ == 'DIGITAL_IN': res = [cast_b(val)]
            else: res = [cast_f(val)]
            
        elif type_ == 'DIGITAL_OUT' or type_ == 'ANALOG_OUT':
            v = b_vals[0] if type_ == 'DIGITAL_OUT' else f_vals[0]
            self._set_binding_value(node.get('params', {}).get('pointId'), v)
            res = [v]

        # Constants
        elif type_ == 'CONST_DIG':
            v = node.get('params', {}).get('value', False)
            res = [cast_b(v)]
        elif type_ == 'CONST_ANA':
            v = node.get('params', {}).get('value', 0.0)
            res = [cast_f(v)]

        # Multiplexing
        elif type_ == 'MUX':
            # Inputs: IN0, IN1, ..., SEL (last input is selector)
            if len(inputs) >= 2:
                sel = int(cast_f(inputs[-1]))
                data_inputs = inputs[:-1]
                if 0 <= sel < len(data_inputs):
                    res = [data_inputs[sel]]
                else:
                    res = [data_inputs[0]] if data_inputs else [0.0]
            else:
                res = [0.0]

        elif type_ == 'DEMUX':
            # Inputs: IN, SEL
            if len(inputs) >= 2:
                val = inputs[0]
                sel = int(cast_f(inputs[1]))
                res = [0.0] * expected_outputs
                if 0 <= sel < expected_outputs:
                    res[sel] = val
            else:
                res = [0.0] * expected_outputs

        # Encoders/Decoders
        elif type_ == 'ENCODER':
            # Inputs: D0, D1, ... -> Output: Index of first active input
            idx = 0
            for i, v in enumerate(b_vals):
                if v:
                    idx = i
                    break
            res = [float(idx)]

        elif type_ == 'DECODER':
            # Input: Binary Index -> Outputs: One-hot (selected pin is 1, others 0)
            idx = int(cast_f(inputs[0])) if inputs else 0
            res = [False] * expected_outputs
            if 0 <= idx < expected_outputs:
                res[idx] = True

        elif type_ == 'BIN_TO_DIG':
            # Input: Integer -> Outputs: Individual bits
            val = int(cast_f(inputs[0])) if inputs else 0
            res = [(val >> i) & 1 == 1 for i in range(expected_outputs)]

        elif type_ == 'DIG_TO_BIN':
            # Inputs: Individual bits -> Output: Integer
            val = 0
            for i, v in enumerate(b_vals):
                if v:
                    val |= (1 << i)
            res = [float(val)]

        # Utils
        elif type_ == 'SPLITTER':
            # Input: 1 -> Outputs: Many (all same as input)
            val = inputs[0] if inputs else 0.0
            res = [val] * expected_outputs

        # Displays
        elif type_ == 'ANA_DISP': res = [f_vals[0] if f_vals else 0.0]
        elif type_ == 'DIG_DISP': res = [b_vals[0] if b_vals else False]

        # Force result to list of expected length
        if expected_outputs > 0:
            if len(res) < expected_outputs:
                res.extend([None] * (expected_outputs - len(res)))
            else:
                res = res[:expected_outputs]
        elif not res and (type_.endswith('_IN') or type_.endswith('_OUT') or type_.endswith('_DISP') or type_.startswith('CONST_')):
            # Fallback for IO/Display with 0 declared outputs but used in viewer
            res = [0.0]

        return res

    def _get_binding_value(self, point_id):
        if not point_id: return None
        from devices.models import Point
        try:
            point = Point.objects.get(id=point_id)
            return point.current_value
        except:
            return None

    def _set_binding_value(self, point_id, value):
        if not point_id: return
        from devices.models import Point
        try:
            point = Point.objects.get(id=point_id)
            point.write_value = str(value)
            point.save()
        except:
            pass
