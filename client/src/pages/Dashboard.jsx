import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import GraphicViewer from '../components/GraphicViewer';

const Dashboard = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(null);
    const [elements, setElements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Responsive State
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        const handleResize = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);

        loadDashboard();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadDashboard = async () => {
        try {
            const res = await api.get('pages/dashboard/');
            setPage(res.data);
            setElements(res.data.content?.elements || []);
        } catch (err) {
            console.error('Error loading dashboard:', err);
            setError(err.response?.status === 404 ? "No Dashboard Page Configured" : "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (targetId) => {
        if (targetId) {
            navigate(`/view/${targetId}`);
        }
    };

    useEffect(() => {
        let interval;
        const fetchPoints = async () => {
            if (!page) return;
            try {
                // Determine API endpoint - use direct path to avoid double auth or prefix issues
                const res = await api.get('points/?page_size=1000');
                const rawData = res.data;
                const points = Array.isArray(rawData) ? rawData : (rawData?.results || []);

                const pointMap = {};
                points.forEach(p => {
                    if (p && p.id != null) {
                        const val = p.live_value !== undefined ? p.live_value : p.current_value;
                        pointMap[String(p.id)] = val;
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

                        // 1. Data Binding Source
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

    if (loading) return <div className="p-5 text-center">Loading Dashboard...</div>;

    if (error) {
        return (
            <div className="p-5 text-center">
                <h3>{error}</h3>
                <p className="text-muted">Please configure a dashboard page in the Module settings (via Main App).</p>
            </div>
        );
    }

    if (!page) return null;

    return (
        <div style={{ height: 'calc(100vh - 60px)', width: '100%', overflow: 'hidden' }}>
            <GraphicViewer
                elements={elements}
                width={dimensions.width}
                height={dimensions.height}
                onNavigate={handleNavigate}
            />
        </div>
    );
};

export default Dashboard;
