import os
from django.conf import settings
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain_core.documents import Document

class VectorStoreManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorStoreManager, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        self.embeddings = OllamaEmbeddings(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_EMBED_MODEL
        )
        self.persist_directory = settings.CHROMA_DB_PATH
        
        # Ensure persist directory exists
        os.makedirs(self.persist_directory, exist_ok=True)
        
        self.vector_store = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings,
            collection_name="system_knowledge"
        )
        
    def add_documents(self, documents: list[Document]):
        """Adds or updates documents in the vector store."""
        if not documents:
            return
        # Basic implementation: add new docs. 
        # For a production system, we might want to track IDs and update instead of just adding.
        self.vector_store.add_documents(documents)
        # self.vector_store.persist() # Chroma 0.4+ persists automatically or implicitly
        
    def search(self, query: str, k: int = 4):
        """Semantic search with crash resilience."""
        try:
            return self.vector_store.similarity_search(query, k=k)
        except Exception as e:
            print(f"WARNING: RAG Search failed (likely model loading issue): {e}")
            return []
    
    def clear(self):
        """Clears the vector store."""
        self.vector_store.delete_collection()
        self.vector_store = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings,
            collection_name="system_knowledge"
        )

# Helper to format system objects into Documents
def format_point_for_rag(point) -> Document:
    content = f"""
    Point: {point.name}
    Slug: {point.slug}
    Description: {point.description}
    Type: {point.point_type}
    Value: {point.read_value}
    Unit: {point.unit}
    Group: {point.point_group.name}
    """
    return Document(page_content=content, metadata={"type": "point", "id": point.id, "slug": point.slug})

def format_fbd_for_rag(program) -> Document:
    content = f"""
    FBD Program: {program.name}
    Status: {'Active' if program.is_active else 'Inactive'}
    Description: {program.description}
    Bindings: {program.bindings}
    """
    # We could serialize the diagram structure too, but description/bindings are most critical for diagnosis
    return Document(page_content=content, metadata={"type": "fbd", "id": program.id})

def format_script_for_rag(script) -> Document:
    content = f"""
    Script: {script.name}
    Status: {'Active' if script.is_active else 'Inactive'}
    Description: {script.description}
    Code:
    {script.code_text}
    """
    return Document(page_content=content, metadata={"type": "script", "id": script.id})
def format_alarm_for_rag(alarm) -> Document:
    content = f"""
    Alarm: {alarm.name}
    Description: {alarm.description}
    Point: {alarm.point.name if alarm.point else 'System'}
    Severity: {alarm.severity}
    Status: {'ACTIVE' if alarm.is_active else 'Cleared'}
    Acknowledge: {'Yes' if alarm.is_acknowledged else 'No'}
    Time: {alarm.start_time}
    """
    return Document(page_content=content, metadata={"type": "alarm", "id": alarm.id})

def format_fault_for_rag(fault) -> Document:
    content = f"""
    Fault: {fault.name}
    Device: {fault.device.name}
    Description: {fault.description}
    Point: {fault.point.name if fault.point else 'N/A'}
    Status: {'UNRESOLVED' if not fault.is_resolved else 'Resolved'}
    Time: {fault.timestamp}
    """
    return Document(page_content=content, metadata={"type": "fault", "id": fault.id})
