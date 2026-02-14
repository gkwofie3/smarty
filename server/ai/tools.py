from langchain.tools import tool
from django.utils.text import slugify
from devices.models import Point, Device, Register, PointGroup
from fbd.models import FBDProgram
from script.models import ScriptProgram
from modules.models import Module, Page
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
@tool
def create_device(name: str, protocol: str = "Modbus TCP", ip_address: str = "127.0.0.1"):
    """Creates a new hardware device in the system."""
    try:
        dev, created = Device.objects.get_or_create(
            name=name,
            defaults={
                'protocol': protocol,
                'ip_address': ip_address,
                'slug': slugify(name)
            }
        )
        status = "Created" if created else "Already exists"
        return f"Device '{name}' {status} with IP {ip_address}."
    except Exception as e:
        return f"Error creating device: {str(e)}"

@tool
def create_point_group(name: str):
    """Creates a new IO Group (Point Group) for organizing points."""
    try:
        group, created = PointGroup.objects.get_or_create(
            name=name,
            defaults={'slug': slugify(name)}
        )
        status = "Created" if created else "Already exists"
        return f"Point Group '{name}' {status}."
    except Exception as e:
        return f"Error creating group: {str(e)}"

@tool
def create_point(name: str, group_name: str, device_name: str, address: int, data_type: str = "Real", unit: str = ""):
    """
    Creates a Point and its underlying hardware Register.
    Requires an existing Device and Point Group.
    """
    try:
        device = Device.objects.get(name=device_name)
        group = PointGroup.objects.get(name=group_name)
        
        # 1. Create Register
        reg, _ = Register.objects.get_or_create(
            name=f"REG_{slugify(name)}",
            device=device,
            defaults={
                'address': address,
                'data_type': data_type,
            }
        )
        
        # 2. Create Point
        point, created = Point.objects.get_or_create(
            name=name,
            point_group=group,
            defaults={
                'register': reg,
                'point_type': 'REGISTER',
                'data_type': data_type,
                'unit': unit,
                'slug': slugify(name)
            }
        )
        
        status = "Created" if created else "Already exists"
        return f"Point '{name}' {status} on device '{device_name}' at address {address}."
    except Device.DoesNotExist:
        return f"Error: Device '{device_name}' not found. Create it first."
    except PointGroup.DoesNotExist:
        return f"Error: Group '{group_name}' not found. Create it first."
    except Exception as e:
        return f"Error: {str(e)}"

@tool
def create_module(name: str, description: str = ""):
    """Creates a new high-level Module (e.g., 'HVAC', 'Lifts')."""
    try:
        mod, created = Module.objects.get_or_create(
            name=name,
            defaults={'slug': slugify(name), 'description': description}
        )
        status = "Created" if created else "Already exists"
        return f"Module '{name}' {status}."
    except Exception as e:
        return f"Error creating module: {str(e)}"

@tool
def create_script(name: str, code_text: str, description: str = "", bindings: str = "[]"):
    """
    Creates a Python Script program with optional IO bindings.
    bindings should be a JSON array of: {"variable_name": "...", "point_name": "...", "direction": "input|output"}
    """
    try:
        from script.models import ScriptBinding
        script, created = ScriptProgram.objects.get_or_create(
            name=name,
            defaults={'code_text': code_text, 'description': description}
        )
        
        if not created:
            script.code_text = code_text
            script.description = description
            script.save()

        # Handle bindings
        try:
            binding_list = json.loads(bindings) if isinstance(bindings, str) else bindings
            for b in binding_list:
                try:
                    point = Point.objects.get(name=b['point_name'])
                    ScriptBinding.objects.update_or_create(
                        script=script,
                        variable_name=b['variable_name'],
                        defaults={'point': point, 'direction': b['direction']}
                    )
                except Point.DoesNotExist:
                    pass
        except Exception as e:
            return f"Script '{name}' created, but bindings failed: {str(e)}"

        return f"Script '{name}' successfully created/updated."
    except Exception as e:
        return f"Error creating script: {str(e)}"

@tool
def create_fbd_program(name: str, diagram_json: str, description: str = ""):
    """
    Creates an FBD (Function Block Diagram) program.
    diagram_json should be a JSON string representing nodes and edges.
    """
    try:
        diagram_data = json.loads(diagram_json) if isinstance(diagram_json, str) else diagram_json
        prog, created = FBDProgram.objects.get_or_create(
            name=name,
            defaults={'diagram_json': diagram_data, 'description': description}
        )
        if not created:
            prog.diagram_json = diagram_data
            prog.description = description
            prog.save()
        return f"FBD Program '{name}' successfully created/updated."
    except Exception as e:
        return f"Error creating FBD: {str(e)}"

@tool
def create_hmi_page(module_name: str, page_name: str, content_json: str, page_type: str = "CUSTOM"):
    """
    Designs/Creates an HMI Page for a specific module.
    content_json should be the Graphic Editor JSON format.
    """
    try:
        module = Module.objects.get(name=module_name)
        content_data = json.loads(content_json) if isinstance(content_json, str) else content_json
        
        page, created = Page.objects.get_or_create(
            module=module,
            name=page_name,
            defaults={
                'content': content_data,
                'page_type': page_type,
                'slug': slugify(page_name)
            }
        )
        if not created:
            page.content = content_data
            page.save()
            
        return f"HMI Page '{page_name}' for module '{module_name}' successfully created/updated."
    except Module.DoesNotExist:
        return f"Error: Module '{module_name}' not found."
    except Exception as e:
        return f"Error creating HMI page: {str(e)}"
