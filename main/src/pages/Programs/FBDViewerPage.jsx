import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Container, Badge } from 'react-bootstrap';
import { getFBDProgram, executeFBDProgram } from '../../services/fbdService';
import FBDCanvasViewer from '../../components/FBD/FBDCanvasViewer';
import ToastNotification from '../../components/ToastNotification';

const FBDViewerPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [program, setProgram] = useState(null);
    const [runtimeData, setRuntimeData] = useState({});
    const [loading, setLoading] = useState(true);
    const [isActive, setIsActive] = useState(false);
    const [toast, setToast] = useState({ show: false, type: '', message: '' });

    const pollTimer = useRef(null);

    const showToast = (type, message) => setToast({ show: true, type, message });

    const loadProgram = async () => {
        try {
            const res = await getFBDProgram(id);
            setProgram(res.data);
            setIsActive(res.data.is_active);
        } catch (error) {
            console.error("Failed to load program", error);
            showToast('danger', 'Failed to load FBD Program');
        } finally {
            setLoading(false);
        }
    };

    const fetchRuntimeData = async () => {
        try {
            // In a real scenario, this would be an API call like:
            // const res = await api.get(`fbd/programs/${id}/runtime/`);
            // setRuntimeData(res.data.values);

            // For now, let's simulate/mock some data if the endpoint doesn't exist
            // This allows the user to see the visualization immediately.
            const mockData = {};
            if (program?.diagram_json?.nodes) {
                program.diagram_json.nodes.forEach(node => {
                    for (let i = 0; i < (node.outputs || 0); i++) {
                        const key = `${node.id}_out_${i}`;
                        // Random values for demo
                        if (node.type.includes('DIGITAL') || node.type.includes('Gate')) {
                            mockData[key] = Math.random() > 0.5;
                        } else {
                            mockData[key] = (Math.random() * 100).toFixed(2);
                        }
                    }
                });
            }
            setRuntimeData(mockData);
        } catch (error) {
            console.error("Runtime fetch failed", error);
        }
    };

    useEffect(() => {
        loadProgram();
        return () => {
            if (pollTimer.current) clearInterval(pollTimer.current);
        };
    }, [id]);

    useEffect(() => {
        if (program) {
            fetchRuntimeData();
            pollTimer.current = setInterval(fetchRuntimeData, 2000); // 2s polling
        }
        return () => {
            if (pollTimer.current) clearInterval(pollTimer.current);
        };
    }, [program]);

    const handleBack = () => navigate('/program/fbd');

    if (loading) return <div className="p-5 text-center">Loading FBD Viewer...</div>;
    if (!program) return (
        <div className="p-5 text-center">
            <h4 className="text-danger">Program not found</h4>
            <Button variant="primary" onClick={handleBack}>Back to Programs</Button>
        </div>
    );

    return (
        <Container fluid className="p-0" style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
            <ToastNotification
                show={toast.show}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, show: false })}
            />

            {/* Header Area */}
            <div className="bg-white border-bottom p-2 d-flex justify-content-between align-items-center" style={{ zIndex: 10 }}>
                <div className="d-flex align-items-center">
                    <Button variant="outline-dark" size="sm" className="me-3" onClick={handleBack}>
                        <i className="fa fa-arrow-left"></i> Back
                    </Button>
                    <h5 className="mb-0 me-3">{program.name}</h5>
                    <Badge bg={isActive ? "success" : "secondary"}>
                        {isActive ? "LIVE" : "INACTIVE"}
                    </Badge>
                </div>
                <div className="text-muted small">
                    <i className="fa-solid fa-clock me-1"></i> Polling every 2s
                </div>
            </div>

            {/* Viewer Area */}
            <div className="flex-grow-1 overflow-hidden">
                <FBDCanvasViewer
                    nodes={program.diagram_json?.nodes || []}
                    edges={program.diagram_json?.edges || []}
                    runtimeData={runtimeData}
                    layoutSize={program.diagram_json?.layoutSize}
                />
            </div>
        </Container>
    );
};

export default FBDViewerPage;
