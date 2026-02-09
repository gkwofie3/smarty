import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { BiLayer, BiEdit, BiGridAlt } from 'react-icons/bi';
import api from '../services/api';

const Dashboard = () => {
    const [pages, setPages] = useState([]);
    const [activeModule, setActiveModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Parse query param for module selection
    const query = new URLSearchParams(location.search);
    const moduleId = query.get('module');

    useEffect(() => {
        if (moduleId) {
            loadModuleAndPages(moduleId);
        } else {
            // Fallback? Load first module? 
            // Or just show "Select Module"
            setPages([]);
            setActiveModule(null);
            setLoading(false);
        }
    }, [moduleId]);

    const loadModuleAndPages = async (id) => {
        setLoading(true);
        try {
            // Fetch module details for name
            const modRes = await api.get(`modules/${id}/`);
            setActiveModule(modRes.data);

            // Fetch pages
            const pagesRes = await api.get(`pages/?module=${id}`);
            setPages(pagesRes.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Breadcrumb / Title */}
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                    <h1 className="page-header mb-1">
                        {activeModule ? activeModule.name : 'Dashboard'} <small>Graphical Pages</small>
                    </h1>
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a href="/">Home</a></li>
                        {activeModule && <li className="breadcrumb-item active">{activeModule.name}</li>}
                    </ol>
                </div>
                {activeModule && (
                    <Button variant="primary" size="sm" className="btn-rounded">
                        <i className="fa fa-plus me-1"></i> New Page
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="row">
                {activeModule ? (
                    <React.Fragment>
                        {pages.map(page => (
                            <div className="col-xl-3 col-md-6 mb-4" key={page.id}>
                                <PageCard page={page} navigate={navigate} />
                            </div>
                        ))}
                        {pages.length === 0 && !loading && (
                            <div className="col-12 text-center text-muted p-5">
                                <BiLayer size={48} className="opacity-25 mb-3" />
                                <h4>No pages found</h4>
                                <p>Create a new page to get started.</p>
                            </div>
                        )}
                        {loading && <div className="col-12 text-center p-5"><i className="fa fa-spinner fa-spin fa-2x"></i></div>}
                    </React.Fragment>
                ) : (
                    <div className="col-12">
                        <div className="panel panel-inverse">
                            <div className="panel-body text-center p-5">
                                <h2 className="text-muted"><i className="fa fa-arrow-left me-2"></i> Select a Module</h2>
                                <p>Please select a module from the sidebar to view its pages.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .page-card:hover {
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }
            `}</style>
        </div>

    );
};

const PageCard = ({ page, navigate }) => {
    return (
        <div className="card border-0 shadow-sm h-100 page-card transition-all" style={{ cursor: 'pointer' }} onClick={() => navigate(`/editor/${page.id}`)}>
            <div className="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: '150px' }}>
                <BiGridAlt size={40} className="text-muted opacity-50" />
            </div>
            <div className="card-body">
                <h5 className="card-title text-truncate fw-bold">{page.name}</h5>
                <p className="card-text text-muted small text-truncate">{page.description || 'No description'}</p>
                <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="badge bg-indigo">{page.page_type}</span>
                    <small className="text-muted">{new Date(page.updated_at).toLocaleDateString()}</small>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
