import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import Sidebar from '../components/Sidebar';
import CanvasMap from '../components/CanvasMap';
import PropertiesPanel from '../components/PropertiesPanel';
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams } from 'react-router-dom';
// import axios from 'axios';
import api from '../api';

const EditorPage = () => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [layoutSize, setLayoutSize] = useState({ width: 1920, height: 1080 }); // Default
    const [searchParams] = useSearchParams();
    const programId = searchParams.get('id');
    const stageRef = useRef(null);
    const dragItem = useRef(null);

    useEffect(() => {
        if (programId) {
            loadProgram(programId);
        }
    }, [programId]);

    const loadProgram = async (id) => {
        try {
            const res = await api.get(`fbd/programs/${id}/`);
            const { diagram_json } = res.data;
            if (diagram_json) {
                setNodes(diagram_json.nodes || []);
                setEdges(diagram_json.edges || []);
                if (diagram_json.layout) {
                    setLayoutSize(diagram_json.layout);
                }
            }
        } catch (err) {
            console.error("Failed to load program", err);
        }
    };

    const saveProgram = async () => {
        if (!programId) return;
        try {
            const diagram_json = { nodes, edges, layout: layoutSize };
            await api.patch(`fbd/programs/${programId}/`, { diagram_json });
            alert('Saved successfully!');
        } catch (err) {
            console.error("Failed to save", err);
            alert('Failed to save');
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
            // Convert to relative position if stage is zoomed/panned (TODO)
            // For now assume no zoom/pan offset for simplicity or handle in CanvasMap
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

    // Delete Selection
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
                // Focus check: Don't delete if typing in an input
                if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

                handleDelete();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, nodes, edges]);

    const handleDelete = () => {
        if (!selectedId) return;
        // Check if it's an edge (future proofing, current selection is only nodes?)
        // Actually we only select nodes via state. Edges are not selectable yet?
        // If we want to delete edges, we need edge selection.
        // For now, delete node and associated edges.

        setNodes(nodes.filter(n => n.id !== selectedId));
        setEdges(edges.filter(e => e.fromNode !== selectedId && e.toNode !== selectedId));
        setSelectedId(null);
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="bg-dark text-white p-2 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                    <Button
                        variant="outline-light"
                        size="sm"
                        className="me-3"
                        onClick={() => window.location.href = '/'}
                    >
                        <i className="fa fa-arrow-left me-1"></i> Dashboard
                    </Button>
                    <span className="h5 mb-0">FBD Editor {programId && `(ID: ${programId})`}</span>
                </div>
                <Button variant="success" size="sm" onClick={saveProgram}>
                    <i className="fa fa-save me-1"></i> Save
                </Button>
            </div>
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
                />
            </div>
        </div>
    );
};

export default EditorPage;
