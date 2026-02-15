import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { BiLayer, BiEdit, BiGridAlt, BiTrash, BiPlus } from 'react-icons/bi';
import api from '../services/api';

const Dashboard = () => {
    const [pages, setPages] = useState([]);
    const [activeModule, setActiveModule] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modals State
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [moduleFormData, setModuleFormData] = useState({ name: '', description: '' });
    const [isEditingModule, setIsEditingModule] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState({ type: '', id: null, name: '' });

    const [showPageModal, setShowPageModal] = useState(false);
    const [pageFormData, setPageFormData] = useState({ name: '', description: '', page_type: 'HMI' });
    const [editingPage, setEditingPage] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    // Parse query param for module selection
    const query = new URLSearchParams(location.search);
    const moduleId = query.get('module');

    useEffect(() => {
        if (moduleId) {
            loadModuleAndPages(moduleId);
        } else {
            setPages([]);
            setActiveModule(null);
            setLoading(false);
        }
    }, [moduleId]);

    const loadModuleAndPages = async (id) => {
        setLoading(true);
        try {
            const modRes = await api.get(`modules/${id}/`);
            setActiveModule(modRes.data);

            const pagesRes = await api.get(`pages/?module=${id}`);
            setPages(pagesRes.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    // Module Handlers
    const handleAddModule = () => {
        setModuleFormData({ name: '', description: '' });
        setIsEditingModule(false);
        setShowModuleModal(true);
    };

    const handleEditModule = () => {
        setModuleFormData({
            name: activeModule.name,
            description: activeModule.description || ''
        });
        setIsEditingModule(true);
        setShowModuleModal(true);
    };

    const handleModuleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditingModule) {
                await api.patch(`modules/${activeModule.id}/`, moduleFormData);
            } else {
                const res = await api.post('modules/', moduleFormData);
                navigate(`/?module=${res.data.id}`);
            }
            setShowModuleModal(false);
            if (moduleId) loadModuleAndPages(moduleId);
            // Re-fetch side bar modules? 
            // In a real app we might use a context or window event
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert("Failed to save module");
        }
    };

    const confirmDeleteModule = () => {
        setDeleteTarget({
            type: 'module',
            id: activeModule.id,
            name: activeModule.name
        });
        setShowDeleteModal(true);
    };

    // Page Handlers
    const handleAddPage = () => {
        setPageFormData({ name: '', description: '', page_type: 'HMI' });
        setEditingPage(null);
        setShowPageModal(true);
    };

    const handleEditPage = (page, e) => {
        e.stopPropagation();
        setEditingPage(page);
        setPageFormData({
            name: page.name,
            description: page.description || '',
            page_type: page.page_type || 'HMI'
        });
        setShowPageModal(true);
    };

    const confirmDeletePage = (page, e) => {
        e.stopPropagation();
        setDeleteTarget({
            type: 'page',
            id: page.id,
            name: page.name
        });
        setShowDeleteModal(true);
    };

    const handlePageSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPage) {
                await api.patch(`pages/${editingPage.id}/`, pageFormData);
            } else {
                await api.post('pages/', {
                    ...pageFormData,
                    module: moduleId,
                    content: { elements: [], layout: { width: 1920, height: 1080 } }
                });
            }
            setShowPageModal(false);
            loadModuleAndPages(moduleId);
        } catch (err) {
            console.error(err);
            alert("Failed to save page");
        }
    };

    const handleDelete = async () => {
        try {
            if (deleteTarget.type === 'module') {
                await api.delete(`modules/${deleteTarget.id}/`);
                setShowDeleteModal(false);
                navigate('/');
                window.location.reload();
            } else {
                await api.delete(`pages/${deleteTarget.id}/`);
                setShowDeleteModal(false);
                loadModuleAndPages(moduleId);
            }
        } catch (err) {
            console.error(err);
            alert(`Failed to delete ${deleteTarget.type}`);
        }
    };

    return (
        <div>
            {/* Breadcrumb / Title */}
            <div className="d-flex align-items-center justify-content-between mb-3 mt-2">
                <div>
                    <div className="d-flex align-items-center">
                        <h1 className="page-header mb-1">
                            {activeModule ? activeModule.name : 'Dashboard'} <small>Graphical Pages</small>
                        </h1>
                        {activeModule && (
                            <div className="ms-3">
                                <Button variant="link" className="p-1 text-muted" onClick={handleEditModule} title="Edit Module">
                                    <BiEdit size={18} />
                                </Button>
                                <Button variant="link" className="p-1 text-danger" onClick={confirmDeleteModule} title="Delete Module">
                                    <BiTrash size={18} />
                                </Button>
                            </div>
                        )}
                    </div>
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a href="/">Home</a></li>
                        {activeModule && <li className="breadcrumb-item active">{activeModule.name}</li>}
                    </ol>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" size="sm" className="btn-rounded" onClick={handleAddModule}>
                        <BiPlus className="me-1" /> New Module
                    </Button>
                    {activeModule && (
                        <Button variant="primary" size="sm" className="btn-rounded" onClick={handleAddPage}>
                            <BiPlus className="me-1" /> New Page
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="row">
                {activeModule ? (
                    <React.Fragment>
                        {pages.map(page => (
                            <div className="col-xl-3 col-md-6 mb-4" key={page.id}>
                                <PageCard
                                    page={page}
                                    navigate={navigate}
                                    onEdit={(e) => handleEditPage(page, e)}
                                    onDelete={(e) => confirmDeletePage(page, e)}
                                />
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

            {/* Module Modal */}
            <Modal show={showModuleModal} onHide={() => setShowModuleModal(false)}>
                <Form onSubmit={handleModuleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{isEditingModule ? 'Edit Module' : 'New Module'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                required
                                value={moduleFormData.name}
                                onChange={e => setModuleFormData({ ...moduleFormData, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                value={moduleFormData.description}
                                onChange={e => setModuleFormData({ ...moduleFormData, description: e.target.value })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModuleModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit">Save</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Page Modal */}
            <Modal show={showPageModal} onHide={() => setShowPageModal(false)}>
                <Form onSubmit={handlePageSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingPage ? 'Edit Page' : 'New Page'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                required
                                value={pageFormData.name}
                                onChange={e => setPageFormData({ ...pageFormData, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                value={pageFormData.description}
                                onChange={e => setPageFormData({ ...pageFormData, description: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Type</Form.Label>
                            <Form.Select
                                value={pageFormData.page_type}
                                onChange={e => setPageFormData({ ...pageFormData, page_type: e.target.value })}
                            >
                                <option value="HMI">HMI</option>
                                <option value="DASHBOARD">DASHBOARD</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowPageModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit">Save</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete the {deleteTarget.type} <strong>{deleteTarget.name}</strong>?
                    {deleteTarget.type === 'module' && <p className="text-danger mt-2"><small>Warning: This will delete all pages within this module.</small></p>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDelete}>Delete</Button>
                </Modal.Footer>
            </Modal>

            <style>{`
                .page-card:hover {
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }
                .transition-all { transition: all 0.2s ease; }
            `}</style>
        </div>
    );
};

const PageCard = ({ page, navigate, onEdit, onDelete }) => {
    return (
        <div className="card border-0 shadow-sm h-100 page-card transition-all" style={{ cursor: 'pointer' }} onClick={() => navigate(`/editor/${page.id}`)}>
            <div className="card-img-top bg-light d-flex align-items-center justify-content-center position-relative" style={{ height: '150px' }}>
                <BiGridAlt size={40} className="text-muted opacity-50" />
                <div className="position-absolute top-0 end-0 p-2 d-flex gap-1">
                    <Button variant="white" size="sm" className="shadow-sm border-0" onClick={onEdit} title="Edit Page">
                        <BiEdit className="text-primary" />
                    </Button>
                    <Button variant="white" size="sm" className="shadow-sm border-0" onClick={onDelete} title="Delete Page">
                        <BiTrash className="text-danger" />
                    </Button>
                </div>
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
