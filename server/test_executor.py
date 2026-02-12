import sys
import os
import json

# Add current dir to path to import fbd.executor
sys.path.append(os.getcwd())

# Mock Django setup for standalone test
class MockPoint:
    def __init__(self, id, val):
        self.id = id
        self.current_value = val

def mock_get_binding_value(self, point_id):
    points = {'p1': True, 'p2': 10.5}
    return points.get(point_id)

from fbd.executor import FBDExecutor

# Mock the _get_binding_value to avoid DB dependency
FBDExecutor._get_binding_value = mock_get_binding_value
FBDExecutor._set_binding_value = lambda self, p, v: print(f"SET {p} = {v}")

# Sample Diagram
diagram = {
    "nodes": [
        {"id": "const1", "type": "CONST_DIG", "params": {"value": True}, "outputs": 1},
        {"id": "const2", "type": "CONST_ANA", "params": {"value": 5.5}, "outputs": 1},
        {"id": "not1", "type": "NOT", "inputs": 1, "outputs": 1},
        {"id": "add1", "type": "ADD", "inputs": 2, "outputs": 1},
        {"id": "disp1", "type": "DIG_DISP", "inputs": 1, "outputs": 0},
        {"id": "disp2", "type": "ANA_DISP", "inputs": 1, "outputs": 0}
    ],
    "edges": [
        {"fromNode": "const1", "fromPort": 0, "toNode": "not1", "toPort": 0},
        {"fromNode": "const2", "fromPort": 0, "toNode": "add1", "toPort": 0},
        {"fromNode": "const2", "fromPort": 0, "toNode": "add1", "toPort": 1}, # 5.5 + 5.5 = 11
        {"fromNode": "not1", "fromPort": 0, "toNode": "disp1", "toPort": 0},
        {"fromNode": "add1", "fromPort": 0, "toNode": "disp2", "toPort": 0}
    ]
}

class MockProgram:
    def __init__(self):
        self.name = "Test"
        self.diagram_json = diagram
        self.bindings = {}

program = MockProgram()
executor = FBDExecutor(program)
node_values = executor.execute_cycle()

print("--- NODE VALUES ---")
for nid, outs in node_values.items():
    print(f"{nid}: {outs}")

flattened = {}
for node_id, outputs in node_values.items():
    for i, val in enumerate(outputs):
        flattened[f"{node_id}_out_{i}"] = val

print("\n--- FLATTENED ---")
print(json.dumps(flattened, indent=2))
