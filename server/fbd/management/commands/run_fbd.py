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
                    # self.stdout.write(f"Executing {program.name}...")
                    executor = FBDExecutor(program)
                    executor.execute_cycle()
                except Exception as e:
                    logger.error(f"Error executing {program.name}: {e}")
            
            time.sleep(1) # Cycle time
