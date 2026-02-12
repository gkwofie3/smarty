import re
import math
import logging
# from asteval import Interpreter (Moved to local import in execute)
from django.utils import timezone
from devices.models import Point

logger = logging.getLogger(__name__)

class ScriptExecutor:
    def __init__(self, script_program):
        self.script_program = script_program
        self.code = script_program.code_text or ""
        self.declarations = []
        self.python_code = ""
        self.inputs = {}  # var_name: value
        self.outputs = {} # var_name: value
        self.bindings = script_program.bindings.all()

    def parse(self):
        """
        Parses the custom DSL declarations at the top of the script.
        Format: <type> <var_name>;
        Types: digital_input, digital_output, analogue_input, analogue_output
        """
        lines = self.code.splitlines()
        # Allows optional semicolon and optional trailing comment
        decl_pattern = re.compile(r'^\s*(digital_input|digital_output|analogue_input|analogue_output)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;?(\s*#.*)?$', re.IGNORECASE)
        
        process_decls = True
        python_lines = []
        
        for line in lines:
            stripped = line.strip()
            
            # Skip empty lines and comments but remain in declaration mode
            if not stripped or stripped.startswith('#'):
                python_lines.append(line)
                continue
                
            match = decl_pattern.match(stripped)
            if process_decls and match:
                dtype, var_name, _ = match.groups()
                self.declarations.append({
                    'type': dtype.lower(),
                    'name': var_name
                })
                # Comment out the line in the target python buffer
                python_lines.append(f"# {line}")
            else:
                # Once we hit a non-declaration line (that isn't a comment/empty),
                # we stop processing declarations.
                process_decls = False
                python_lines.append(line)
        
        self.python_code = "\n".join(python_lines)
        return self.declarations

    def gather_inputs(self):
        """Fetches current values from bound Points for all input declarations."""
        # Create a mapping for quick lookup
        binding_map = {b.variable_name: b for b in self.bindings}
        
        for decl in self.declarations:
            var_name = decl['name']
            dtype = decl['type']
            
            if 'input' in dtype:
                binding = binding_map.get(var_name)
                if binding:
                    val = binding.point.current_value
                    # Cast based on declaration type
                    if 'digital' in dtype:
                        self.inputs[var_name] = self._to_bool(val)
                    else:
                        self.inputs[var_name] = self._to_float(val)
                else:
                    self.inputs[var_name] = False if 'digital' in dtype else 0.0
            
            elif 'output' in dtype:
                # Outputs are initialized with current values if available, or defaults
                binding = binding_map.get(var_name)
                if binding:
                    val = binding.point.current_value
                    if 'digital' in dtype:
                        self.outputs[var_name] = self._to_bool(val)
                    else:
                        self.outputs[var_name] = self._to_float(val)
                else:
                    self.outputs[var_name] = False if 'digital' in dtype else 0.0

    def execute(self):
        """Executes the Python code in a restricted sandbox."""
        self.parse()
        self.gather_inputs()
        
        # Build symbols for the interpreter
        symbols = {
            **self.inputs,
            **self.outputs,
            'math': math,
            'min': min,
            'max': max,
            'round': round,
            'abs': abs,
        }
        
        try:
            from asteval import Interpreter
        except ImportError:
            status = "error"
            logs = ["Execution failed: 'asteval' package is not installed on the server. Please run 'pip install asteval'."]
            self.script_program.last_execution_status = status
            self.script_program.last_execution_time = timezone.now()
            self.script_program.last_execution_log = "\n".join(logs)
            self.script_program.save()
            return status

        aeval = Interpreter(
            usersyms=symbols, 
            no_if_expression=False, 
            no_assert=True, 
            no_delete=True,
            no_print=True,
            builtins_readonly=True
        )
        
        # Security Hardening: Remove potentially sensitive/leaky built-ins
        for name in ['print', 'pprint', 'eval', 'exec', 'getattr', 'setattr', 'hasattr', 'type', 'id']:
            if name in aeval.symtable:
                del aeval.symtable[name]
        
        logs = []
        try:
            aeval(self.python_code)
            
            if aeval.error:
                # Capture asteval specific errors
                for err in aeval.error:
                    logs.append(f"Exec Error: {err.msg} at line {err.lineno}")
                status = "error"
            else:
                # Update outputs from the symbols
                for var_name in self.outputs:
                    if var_name in aeval.symtable:
                        self.outputs[var_name] = aeval.symtable[var_name]
                status = "success"
                logs.append("Execution completed successfully.")
                
        except Exception as e:
            status = "error"
            logs.append(f"Runtime Crash: {str(e)}")
            
        # Update script metadata
        self.script_program.last_execution_status = status
        self.script_program.last_execution_time = timezone.now()
        self.script_program.last_execution_log = "\n".join(logs)
        self.script_program.save()
        
        if status == "success":
            self.write_outputs()
            
        return status

    def write_outputs(self):
        """Persists modified output variables back to bound Points."""
        binding_map = {b.variable_name: b for b in self.bindings}
        for var_name, value in self.outputs.items():
            binding = binding_map.get(var_name)
            if binding:
                point = binding.point
                point.write_value = str(value)
                point.save()

    def _to_bool(self, val):
        if isinstance(val, bool): return val
        if isinstance(val, (int, float)): return val > 0.5
        if isinstance(val, str): return val.lower() in ['1', 'true', 'on', 'yes']
        return False

    def _to_float(self, val):
        try: return float(val)
        except: return 0.0
