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
            // Adjust for layout (sidebar etc) - simplified to window size for now
            // Usually main content area is smaller. But let's use window size minus offsets if needed.
            // Better: use ResizeObserver on container.
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);

        loadDashboard();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadDashboard = async () => {
        try {
            const res = await api.get('pages/dashboard/');
            // Wait. PageViewSet is routed.
            // If I access /api/modules/pages/dashboard/ it works if router supports extra actions on list route.
            // Or /api/pages/dashboard/ ? 
            // PageViewSet is usually registered.
            setPage(res.data);
            setElements(res.data.content?.elements || []); // Assuming content stores elements
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

    if (loading) return <div className="p-5 text-center">Loading Dashboard...</div>;

    if (error) {
        return (
            <div className="p-5 text-center">
                <h3>{error}</h3>
                <p className="text-muted">Please configure a dashboard page in the Module settings.</p>
            </div>
        );
    }

    if (!page) return null;

    return (
        <div style={{ height: 'calc(100vh - 60px)', width: '100%', overflow: 'hidden' }}>
            <GraphicViewer
                elements={elements}
                width={dimensions.width}
                height={dimensions.height} // Subtract header height if needed
                onNavigate={handleNavigate}
            />
        </div>
    );
};

export default Dashboard;
