from celery import shared_task
from .rag import VectorStoreManager, format_point_for_rag, format_fbd_for_rag, format_script_for_rag
from devices.models import Point
from fbd.models import FBDProgram
from script.models import ScriptProgram

@shared_task
def update_vector_store():
    """
    Periodic task to refresh the vector store with latest system state.
    Running this too frequently might be expensive on embedding generation.
    """
    vsm = VectorStoreManager()
    
    # Fetch all data
    points = Point.objects.all()
    fbds = FBDProgram.objects.all()
    scripts = ScriptProgram.objects.all()
    
    docs = []
    
    for p in points:
        docs.append(format_point_for_rag(p))
        
    for f in fbds:
        docs.append(format_fbd_for_rag(f))
        
    for s in scripts:
        docs.append(format_script_for_rag(s))
        
    # In a real efficient system, we would diff or update only changed items.
    # For now, we'll clear and re-add or just add (which might duplicate if we don't manage IDs).
    # Strategy: Clear and Rebuild (simplest for consistency, acceptable for small scale)
    vsm.clear()
    vsm.add_documents(docs)
    
    return f"Updated vector store with {len(docs)} documents."

@shared_task
def system_monitor():
    """
    Lightweight monitor that runs frequently (e.g. 30s).
    Could check for critical alarms and trigger proactive AI analysis.
    """
    # Placeholder for proactive monitoring logic
    pass
