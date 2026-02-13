from langchain.tools import tool
from devices.models import Point
from fbd.models import FBDProgram
from script.models import ScriptProgram
from ai.models import AutonomousLog
import json

# ==========================================
# Read-Only Tools (Safe)
# ==========================================

@tool
def list_all_points():
    """Returns a list of all Points in the system with their IDs and names."""
    points = Point.objects.values('id', 'name', 'slug', 'point_group__name')
    return json.dumps(list(points))

@tool
def get_point_value(point_name_or_id: str):
    """
    Gets the current value and metadata for a specific Point.
    Input can be a Point ID (int) or Name (str).
    """
    try:
        if isinstance(point_name_or_id, int) or point_name_or_id.isdigit():
            point = Point.objects.get(id=int(point_name_or_id))
        else:
            point = Point.objects.get(name=point_name_or_id)
            
        return json.dumps({
            "id": point.id,
            "name": point.name,
            "value": point.read_value,
            "unit": point.unit,
            "status": point.error_status
        })
    except Point.DoesNotExist:
        return f"Error: Point '{point_name_or_id}' not found."

@tool
def get_fbd_program(program_name: str):
    """Retrives the structure and bindings of an FBD program."""
    try:
        prog = FBDProgram.objects.get(name=program_name)
        return json.dumps({
            "name": prog.name,
            "active": prog.is_active,
            "bindings": prog.bindings,
            # "nodes": prog.diagram_json.get('nodes', []) # potentially too large
        })
    except FBDProgram.DoesNotExist:
        return "Program not found."

@tool
def get_script(script_name: str):
    """Retrieves the code of a Script program."""
    try:
        script = ScriptProgram.objects.get(name=script_name)
        return json.dumps({
            "name": script.name,
            "active": script.is_active,
            "code": script.code_text
        })
    except ScriptProgram.DoesNotExist:
        return "Script not found."

# ==========================================
# Action Tools (Requires Confirmation/Safety)
# ==========================================

@tool
def set_point_value(point_id: int, value: str):
    """
    Sets a forced value for a Point.
    WARNING: This tool must ONLY be called after explicit user confirmation.
    """
    # This is a stub calling the content - the actual execution logic 
    # should be part of the Agent's "tool execution" node which checks permissions.
    try:
        point = Point.objects.get(id=point_id)
        # Logic to write value (using existing device write mechanism)
        # For now, we simulate success or log it.
        # point.write_value = value
        # point.save()
        
        AutonomousLog.objects.create(
            action_type="WRITE_POINT",
            target=point.name,
            reason="AI Agent Action",
            status="PENDING_CONFIRMATION", # Agent initiates, system confirms
            details={"value": value}
        )
        return f"Request to set {point.name} to {value} has been logged for confirmation."
    except Point.DoesNotExist:
        return "Point not found."
