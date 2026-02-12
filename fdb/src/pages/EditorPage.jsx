import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import Sidebar from '../components/Sidebar';
import CanvasMap from '../components/CanvasMap';
import PropertiesPanel from '../components/PropertiesPanel';
import ToastNotification from '../components/ToastNotification';
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
import api from '../api';

const EditorPage = () => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [points, setPoints] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [layoutSize, setLayoutSize] = useState({ width: 1920, height: 1080 }); // Default
    const [searchParams] = useSearchParams();
    const programId = searchParams.get('id');
    const stageRef = useRef(null);
    const dragItem = useRef(null);

    // History for Undo/Redo
    const [history, setHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(-1);
    const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const navigate = useNavigate();

    // Clipboard
    const [clipboard, setClipboard] = useState(null);

    // Auto-save
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
        return localStorage.getItem('autoSaveEnabled') === 'true';
    });
    const [isSaving, setIsSaving] = useState(false);
    const autoSaveTimer = useRef(null);

    // Toast
    const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
    const showToast = (message, variant = 'success') => setToast({ show: true, message, variant });

    useEffect(() => {
        localStorage.setItem('autoSaveEnabled', autoSaveEnabled);
    }, [autoSaveEnabled]);

    useEffect(() => {
        if (programId) {
            loadProgram(programId);
        }
        fetchPoints();
        return () => {
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        };
    }, [programId]);

    const fetchPoints = async () => {
        try {
            const res = await api.get('points/');
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setPoints(data);
        } catch (err) {
            console.error("Failed to fetch points", err);
        }
    };

    // Handle History (Undo/Redo)
    useEffect(() => {
        if (isUndoRedoAction) {
            setIsUndoRedoAction(false);
            return;
        }

        const currentState = { nodes, edges, layout: layoutSize };

        // Use a functional update for history to avoid stale state in the effect
        setHistory(prevHistory => {
            const newHistory = prevHistory.slice(0, historyStep + 1);
            newHistory.push(currentState);
            if (newHistory.length > 50) newHistory.shift();
            return newHistory;
        });
        setHistoryStep(prevStep => {
            // If we shifted, the index stays the same (but points to new last element)
            // If we didn't shift, it increments.
            // Simplified: just point to the last element of what history will be.
            return Math.min(historyStep + 1, 49);
        });

        // Auto-save trigger
        if (isLoaded && autoSaveEnabled && programId) {
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
            autoSaveTimer.current = setTimeout(() => {
                saveProgram(true); // silent save
            }, 3000);
        }
    }, [nodes, edges, layoutSize, autoSaveEnabled, isLoaded]);

    // Re-calculating historyStep more accurately when history changes
    useEffect(() => {
        if (!isUndoRedoAction) {
            setHistoryStep(history.length - 1);
        }
    }, [history]);

    const handleUndo = () => {
        if (historyStep > 0) {
            const prevStep = historyStep - 1;
            const state = history[prevStep];
            setIsUndoRedoAction(true);
            setNodes(state.nodes);
            setEdges(state.edges);
            setLayoutSize(state.layout);
            setHistoryStep(prevStep);
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            const nextStep = historyStep + 1;
            const state = history[nextStep];
            setIsUndoRedoAction(true);
            setNodes(state.nodes);
            setEdges(state.edges);
            setLayoutSize(state.layout);
            setHistoryStep(nextStep);
        }
    };

    const handleCopy = () => {
        if (!selectedId) return;
        const node = nodes.find(n => n.id === selectedId);
        if (node) {
            setClipboard({ ...node });
        }
    };

    const handlePaste = () => {
        if (!clipboard) return;
        const newNode = {
            ...clipboard,
            id: uuidv4(),
            x: (clipboard.x || 0) + 20, // Offset paste
            y: (clipboard.y || 0) + 20
        };
        setNodes(prev => [...prev, newNode]);
    };

    const loadProgram = async (id) => {
        try {
            const res = await api.get(`fbd/programs/${id}/`);
            const { diagram_json } = res.data;
            if (diagram_json) {
                const loadedNodes = diagram_json.nodes || [];
                const loadedEdges = diagram_json.edges || [];
                const loadedLayout = diagram_json.layout || layoutSize;

                // Initialize state
                setIsUndoRedoAction(true);
                setNodes(loadedNodes);
                setEdges(loadedEdges);
                setLayoutSize(loadedLayout);

                // Initialize history with loaded state
                const initialState = {
                    nodes: loadedNodes,
                    edges: loadedEdges,
                    layout: loadedLayout
                };
                setHistory([initialState]);
                setHistoryStep(0);
                setIsLoaded(true);
            } else {
                // If it's a new program with no diagram_json yet, we still mark as loaded
                setIsLoaded(true);
            }
        } catch (err) {
            console.error("Failed to load program", err);
            showToast("Failed to load program", "danger");
            // Don't mark as loaded on error to prevent overwriting
        }
    };

    const saveProgram = async (silent = false) => {
        if (!programId) return;
        if (isSaving) return;

        setIsSaving(true);
        try {
            const diagram_json = { nodes, edges, layout: layoutSize };
            await api.patch(`fbd/programs/${programId}/`, { diagram_json });
            if (!silent) showToast('Saved successfully!');
        } catch (err) {
            console.error("Failed to save", err);
            if (!silent) showToast('Failed to save', 'danger');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDragStart = (e, item) => {
        dragItem.current = item;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const stage = stageRef.current;
        stage.setPointersPositions(e);
        const stagePos = stage.getPointerPosition();

        if (dragItem.current && stagePos) {
            const newNode = {
                id: uuidv4(),
                type: dragItem.current.type,
                label: dragItem.current.label,
                x: stagePos.x,
                y: stagePos.y,
                inputs: dragItem.current.inputs,
                outputs: dragItem.current.outputs,
                params: { ...dragItem.current.params }
            };
            setNodes((prev) => [...prev, newNode]);
        }
        dragItem.current = null;
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDelete = () => {
        if (!selectedId) return;
        setNodes(nodes.filter(n => n.id !== selectedId));
        setEdges(edges.filter(e => e.fromNode !== selectedId && e.toNode !== selectedId));
        setSelectedId(null);
    };

    const handleMoveSelected = (dx, dy) => {
        if (!selectedId) return;
        setNodes(prevNodes => prevNodes.map(n =>
            n.id === selectedId ? { ...n, x: n.x + dx, y: n.y + dy } : n
        ));
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Focus check: Don't trigger if typing in an input
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        saveProgram();
                        break;
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) handleRedo();
                        else handleUndo();
                        break;
                    case 'u': // User specifically asked for Ctrl+U for undo
                        e.preventDefault();
                        handleUndo();
                        break;
                    case 'y': // Redo alternative
                        e.preventDefault();
                        handleRedo();
                        break;
                    case 'c':
                        // handleCopy(); // Don't prevent default for native copy if needed?
                        break;
                    case 'v':
                        // handlePaste();
                        break;
                    default:
                        break;
                }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedId) handleDelete();
            } else if (e.key.startsWith('Arrow') && selectedId) {
                e.preventDefault();
                const step = e.shiftKey ? 1 : 5;
                switch (e.key) {
                    case 'ArrowUp': handleMoveSelected(0, -step); break;
                    case 'ArrowDown': handleMoveSelected(0, step); break;
                    case 'ArrowLeft': handleMoveSelected(-step, 0); break;
                    case 'ArrowRight': handleMoveSelected(step, 0); break;
                }
            }
        };

        // Listen for copy/paste separately if needed, or use the switch above
        const handleNativeCopy = (e) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
            handleCopy();
        };
        const handleNativePaste = (e) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
            handlePaste();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('copy', handleNativeCopy);
        window.addEventListener('paste', handleNativePaste);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('copy', handleNativeCopy);
            window.removeEventListener('paste', handleNativePaste);
        };
    }, [selectedId, nodes, edges, historyStep, history, clipboard, layoutSize, autoSaveEnabled, isSaving]);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="bg-dark text-white p-2 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                    <Button
                        variant="outline-light"
                        size="sm"
                        className="me-3"
                        onClick={() => navigate('/')}
                    >
                        <i className="fa-solid fa-arrow-left me-1"></i> Dashboard
                    </Button>
                    <span className="h5 mb-0 me-3">FBD Editor {programId && `(ID: ${programId})`}</span>

                    <div className="btn-group me-3 shadow-sm">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); handleUndo(); }}
                            disabled={historyStep <= 0}
                            title="Undo (Ctrl+Z)"
                        >
                            <i className="fa-solid fa-rotate-left me-1"></i> Undo
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => { e.preventDefault(); handleRedo(); }}
                            disabled={historyStep >= history.length - 1}
                            title="Redo (Ctrl+Y)"
                        >
                            Undo <i className="fa-solid fa-rotate-right ms-1"></i>
                        </Button>
                    </div>

                    <div className="form-check form-switch text-white ms-2 d-flex align-items-center">
                        <input
                            className="form-check-input mt-0 me-2"
                            type="checkbox"
                            role="switch"
                            id="autoSaveSwitch"
                            checked={autoSaveEnabled}
                            onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label small" htmlFor="autoSaveSwitch" style={{ cursor: 'pointer' }}>
                            Auto-save {isSaving && <span className="ms-2 text-warning italic"><i className="fa-solid fa-spinner fa-spin me-1"></i>Saving...</span>}
                        </label>
                    </div>
                </div>
                <Button
                    variant="success"
                    size="sm"
                    onClick={() => saveProgram()}
                    disabled={isSaving}
                >
                    <i className={`fa-solid ${isSaving ? 'fa-spinner fa-spin' : 'fa-save'} me-1`}></i> {isSaving ? 'Saving...' : 'Save (Ctrl+S)'}
                </Button>
            </div>

            <ToastNotification
                show={toast.show}
                message={toast.message}
                variant={toast.variant}
                onClose={() => setToast({ ...toast, show: false })}
            />
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Sidebar onDragStart={handleDragStart} />
                <div
                    style={{ flex: 1, backgroundColor: '#333', position: 'relative', overflow: 'hidden' }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <CanvasMap
                        nodes={nodes}
                        edges={edges}
                        setNodes={setNodes}
                        setEdges={setEdges}
                        stageRef={stageRef}
                        selectedId={selectedId}
                        setSelectedId={setSelectedId}
                        layoutSize={layoutSize}
                    />
                </div>
                <PropertiesPanel
                    selectedId={selectedId}
                    nodes={nodes}
                    setNodes={setNodes}
                    layoutSize={layoutSize}
                    setLayoutSize={setLayoutSize}
                    onDelete={handleDelete}
                    points={points}
                />
            </div>
        </div>
    );
};

export default EditorPage;
