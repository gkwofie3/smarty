from server.fbd.models import FBDProgram
from server.fbd.executor import FBDExecutor
import time
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Runs active FBD programs continuously'

    def handle(self, *args, **options):
        self.stdout.write("Starting FBD Execution Loop...")
        while True:
            programs = FBDProgram.objects.filter(is_active=True)
            if not programs.exists():
                self.stdout.write("No active programs. Waiting...")
                time.sleep(5)
                continue

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
                    program.save(update_fields=['runtime_values', 'runtime_state', 'updated_at'])
                except Exception as e:
                    logger.error(f"Error executing {program.name}: {e}")
            
            time.sleep(0.1) # Shorter cycle for better timer resolution (100ms)
