import networkx as nx
import logging

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
            outputs = self._process_block(node, inputs)
            node_values[node_id] = outputs

        # 3. Write Outputs
        self._write_outputs(node_values)
        
        return node_values

    def _read_inputs(self):
        # Sync bound inputs from external system (e.g. Redis/DB)
        # For now, mock or pass
        pass

    def _write_outputs(self, node_values):
        # Sync bound outputs to external system
        for node_id, values in node_values.items():
            # Check if this node is an OUTPUT block bound to a point
            if self.bindings.get(node_id):
                point_id = self.bindings[node_id]
                # Write values[0] to point_id
                # print(f"Write {values[0]} to Point {point_id}")
                pass

    def _gather_inputs(self, node_id, node_values):
        # Look at incoming edges to find values
        input_count = self.nodes[node_id].get('inputs', 0)
        inputs = [None] * input_count
        
        for u, v, data in self.graph.in_edges(node_id, data=True):
            to_port = data['toPort']
            from_port = data['from_port']
            
            if u in node_values:
                # Get value from source node's output list
                val = node_values[u][from_port]
                if 0 <= to_port < input_count:
                    inputs[to_port] = val
        
        return inputs

    def _process_block(self, node, inputs):
        type_ = node['type']
        # Helper to treat None as False or 0
        def val(i, default=False): 
            return inputs[i] if (i < len(inputs) and inputs[i] is not None) else default

        if type_ == 'AND':
            return [val(0) and val(1)]
        elif type_ == 'OR':
            return [val(0) or val(1)]
        elif type_ == 'NOT':
            return [not val(0)]
        elif type_ == 'XOR':
            return [val(0) ^ val(1)]
        elif type_ == 'ADD':
             # Ensure types are numbers
            return [ (val(0, 0) or 0) + (val(1, 0) or 0) ]
        elif type_ == 'SUB':
            return [ (val(0, 0) or 0) - (val(1, 0) or 0) ]
        elif type_ == 'INPUT':
            # Value should have been read in _read_inputs and set? 
            # Or INPUT block acts as source. 
            # If it's bound, get value.
            return [ self._get_bound_value(node['id']) ]
        elif type_ == 'OUTPUT':
            # Pass through for visualization or just consume?
            return [ val(0) ]
        
        return [None] * (node.get('outputs', 0))

    def _get_bound_value(self, node_id):
        # Mock fetch from binding
        if node_id in self.bindings:
            # point_id = self.bindings[node_id]
            # return get_point_value(point_id)
            return True # Mock
        return False
