import time
import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from devices.models import Point
from fbd.models import FBDProgram
from fbd.executor import FBDExecutor
from script.models import ScriptProgram
from script.executor import ScriptExecutor

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Runs the unified Smarty Background Engine (Points, FBD, Scripts)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting Smarty Background Engine..."))
        cycle_count = 0
        
        while True:
            cycle_count += 1
            start_time = time.time()
            
            try:
                # --- Phase 1: Point Refresh (Alarms, Events, Logs) ---
                p_start = time.time()
                p_count = self._refresh_points()
                p_time = time.time() - p_start
                
                # --- Phase 2: FBD Execution ---
                f_start = time.time()
                f_count = self._execute_fbd_programs()
                f_time = time.time() - f_start
                
                # --- Phase 3: Script Execution ---
                s_start = time.time()
                s_count = self._execute_scripts()
                s_time = time.time() - s_start
                
                if cycle_count % 10 == 0:  # Log every 10 cycles (~1 second)
                    self.stdout.write(f"Cycle {cycle_count}: P:{p_count}({p_time:.3f}s) F:{f_count}({f_time:.3f}s) S:{s_count}({s_time:.3f}s)")
                
            except Exception as e:
                logger.error(f"Engine Loop Error: {e}")
                self.stdout.write(self.style.ERROR(f"Engine Loop Error: {e}"))

            # Maintain frequency (e.g., 100ms cycle)
            elapsed = time.time() - start_time
            sleep_time = max(0.01, 0.1 - elapsed)
            time.sleep(sleep_time)

    def _refresh_points(self):
        """Triggers PointProcessor for all active points and performs bulk updates."""
        # Use select_related to minimize queries for registers
        active_points = Point.objects.filter(is_active=True).select_related('register')
        modified_points = []
        
        for point in active_points:
            try:
                old_val = point.read_value
                # Process without immediate persistence
                from helper.processors import PointProcessor
                PointProcessor(point).process(persist=False)
                
                # Only add to bulk update if the value changed
                if point.read_value != old_val:
                    modified_points.append(point)
            except Exception as e:
                logger.error(f"Error refreshing Point {point.name}: {e}")
        
        if modified_points:
            Point.objects.bulk_update(modified_points, ['read_value', 'last_updated'])
            
        return active_points.count()

    def _execute_fbd_programs(self):
        """Runs active FBD programs and performs bulk update of results."""
        programs = list(FBDProgram.objects.filter(is_active=True))
        modified_programs = []
        
        for program in programs:
            try:
                executor = FBDExecutor(program)
                node_values = executor.execute_cycle()
                
                # Persist values and state
                flattened = {}
                for node_id, outputs in node_values.items():
                    if outputs is not None:
                        for i, val in enumerate(outputs):
                            flattened[f"{node_id}_out_{i}"] = val
                
                program.runtime_values = flattened
                program.runtime_state = executor.runtime_state
                modified_programs.append(program)
            except Exception as e:
                logger.error(f"Error executing FBD {program.name}: {e}")
        
        if modified_programs:
            FBDProgram.objects.bulk_update(modified_programs, ['runtime_values', 'runtime_state', 'updated_at'])
            
        return len(programs)

    def _execute_scripts(self):
        """Runs active Script programs. Scripts currently self-persist logs, but we collect them for counting."""
        scripts = ScriptProgram.objects.filter(is_active=True)
        for script in scripts:
            try:
                executor = ScriptExecutor(script)
                executor.execute()
            except Exception as e:
                logger.error(f"Error executing Script {script.name}: {e}")
        return scripts.count()
