import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import Sidebar from '../components/Sidebar';
import CanvasMap from '../components/CanvasMap';
import PropertiesPanel from '../components/PropertiesPanel';
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const EditorPage = () => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
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
            const res = await axios.get(`/api/fbd/programs/${id}/`);
            const { diagram_json } = res.data;
            if (diagram_json) {
                setNodes(diagram_json.nodes || []);
                setEdges(diagram_json.edges || []);
            }
        } catch (err) {
            console.error("Failed to load program", err);
        }
    };

    const saveProgram = async () => {
        if (!programId) return;
        try {
            const diagram_json = { nodes, edges };
            await axios.patch(`/api/fbd/programs/${programId}/`, { diagram_json });
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

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="bg-dark text-white p-2 d-flex justify-content-between align-items-center">
                <span className="h5 mb-0">FBD Editor {programId && `(ID: ${programId})`}</span>
                <Button variant="success" size="sm" onClick={saveProgram}>Save</Button>
            </div>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Sidebar onDragStart={handleDragStart} />
                <div
                    style={{ flex: 1, backgroundColor: '#f0f0f0', position: 'relative' }}
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
                    />
                </div>
                <PropertiesPanel
                    selectedId={selectedId}
                    nodes={nodes}
                    setNodes={setNodes}
                />
            </div>
        </div>
    );
};

export default EditorPage;
