import React, { useEffect, useState } from 'react';
import { Container, Button, Card } from 'react-bootstrap';
import { Stage, Layer } from 'react-konva';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ElementRenderer from '../../components/Preview/ElementRenderer'; // Ideally remove if GraphicViewer handles it?
import GraphicViewer from '../../components/GraphicViewer';

const PageView = () => {
    const { pageId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(null);
    const [elements, setElements] = useState([]);
    const [loading, setLoading] = useState(true);

    // Responsive
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        loadPage();
    }, [pageId]);

    const loadPage = async () => {
        try {
            const res = await api.get(`pages/${pageId}/`);
            setPage(res.data);
            setElements(res.data.content?.elements || []); // Use content.elements if struct match
        } catch (error) {
            console.error('Error loading page:', error);
            alert('Failed to load page');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4">Loading preview...</div>;
    if (!page) return <div className="p-4">Page not found</div>;

    return (
        <Container fluid className="p-0" style={{ height: 'calc(100vh - 60px)', overflow: 'hidden', background: '#f8f9fa' }}>
            <div className="d-flex justify-content-between align-items-center p-2 bg-white border-bottom shadow-sm" style={{ height: '50px' }}>
                <div className="d-flex align-items-center">
                    <Button variant="outline-secondary" size="sm" className="me-3" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left"></i> Back
                    </Button>
                    <h5 className="mb-0">{page.name} <span className="text-muted small">(Preview)</span></h5>
                </div>
            </div>

            <div style={{ width: '100%', height: 'calc(100% - 50px)', overflow: 'hidden' }}>
                <GraphicViewer
                    elements={elements}
                    width={dimensions.width}
                    height={dimensions.height}
                    onNavigate={(targetId) => navigate(`/view/${targetId}`)}
                />
            </div>
        </Container>
    );
};

export default PageView;
