import React, { useEffect, useState } from 'react';
import { Container, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GraphicViewer from '../../components/GraphicViewer';

const PageView = () => {
    const { pageId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(null);
    const [elements, setElements] = useState([]);
    const [loading, setLoading] = useState(true);

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
            setElements(res.data.content?.elements || []);
        } catch (error) {
            console.error('Error loading page:', error);
            alert('Failed to load page');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let interval;
        const fetchPoints = async () => {
            if (!page) return;
            try {
                console.log("Fetching points (single batch)...");
                const res = await api.get('points/?page_size=1000');
                const rawData = res.data;
                const points = Array.isArray(rawData) ? rawData : (rawData?.results || []);

                console.log(`Fetched ${points.length} points`);

                const pointMap = {};
                points.forEach(p => {
                    if (p && p.id != null) {
                        const val = p.live_value !== undefined ? p.live_value : p.current_value;
                        pointMap[String(p.id)] = val;
                        // Also store as number if possible
                        if (!isNaN(p.id)) pointMap[Number(p.id)] = val;
                    }
                });

                setElements(prev => {
                    if (!page.content || !page.content.elements) return prev;
                    return page.content.elements.map(el => {
                        const newEl = { ...el };

                        // Helper to find value
                        const getValue = (id) => {
                            if (!id) return undefined;
                            let rawId = id;
                            if (typeof id === 'object') {
                                rawId = id.id || id.value || JSON.stringify(id);
                            }
                            // Try multiple lookups
                            let val = pointMap[rawId];
                            if (val === undefined) val = pointMap[String(rawId).trim()];
                            if (val === undefined && !isNaN(rawId)) val = pointMap[Number(rawId)];

                            return val;
                        };

                        // 1. Data Binding Source (Dynamic Text, Images)
                        if (newEl.data_binding_source) {
                            let val = getValue(newEl.data_binding_source);
                            // Fallback: If not found, try using current_value as ID (legacy/gauge style)
                            if (val === undefined && newEl.current_value) {
                                val = getValue(newEl.current_value);
                            }

                            if (val !== undefined) newEl.current_value = val;
                        }
                        // 2. Fallback for Gauge (current_value as ID)
                        else if (newEl.type && newEl.type.includes('Gauge') && newEl.current_value) {
                            const val = getValue(newEl.current_value);
                            if (val !== undefined) newEl.current_value = val;
                        }
                        return newEl;
                    });
                });
            } catch (err) {
                console.error("Failed to fetch live data", err);
            }
        };

        if (page) {
            fetchPoints();
            interval = setInterval(fetchPoints, 2000);
        }
        return () => clearInterval(interval);
    }, [page]);

    if (loading) return <div className="p-4">Loading preview...</div>;
    if (!page) return <div className="p-4">Page not found</div>;

    return (
        <Container fluid className="p-0" style={{ height: 'calc(100vh - 0px)', overflow: 'hidden', background: '#f8f9fa' }}>
            {/* <div className="d-flex justify-content-between align-items-center p-2 bg-white border-bottom shadow-sm" style={{ height: '50px' }}>
                <div className="d-flex align-items-center">
                    <Button variant="outline-secondary" size="sm" className="me-3" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left"></i> Back
                    </Button>
                    <h5 className="mb-0">{page.name} <span className="text-muted small">(Preview)</span></h5>
                </div>
            </div> */}

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
