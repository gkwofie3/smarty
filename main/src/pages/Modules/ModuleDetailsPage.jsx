import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Toast, ToastContainer } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { getModule, getPages, createPage, duplicatePage, updatePage, patchPage } from '../../services/moduleService';
import Header from '../../components/Header';
import DuplicateModal from '../../components/DuplicateModal';

const ModuleDetailsPage = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const [module, setModule] = useState(null);
    const [pages, setPages] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newPage, setNewPage] = useState({ name: '', page_type: 'CUSTOM', description: '' });

    // Duplicate State
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateTarget, setDuplicateTarget] = useState(null);

    // Toast State
    const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

    const showToastMessage = (message, variant = 'success') => {
        setToast({ show: true, message, variant });
    };

    useEffect(() => {
        loadData();
    }, [moduleId]);

    const loadData = async () => {
        try {
            const [modRes, pagesRes] = await Promise.all([
                getModule(moduleId),
                getPages(moduleId)
            ]);
            setModule(modRes.data);
            setPages(pagesRes.data);
        } catch (error) {
            console.error('Error loading module data:', error);
        }
    };

    const handleCreatePage = async () => {
        try {
            await createPage({ ...newPage, module: moduleId });
            setShowModal(false);
            loadData();
        } catch (error) {
            console.error('Error creating page:', error);
            alert('Failed to create page: ' + JSON.stringify(error.response?.data || error.message));
        }
    };

    const handleDesign = (pageId) => {
        // Open Editor App (assuming standard port 5174)
        // Adjust port if needed based on execution environment
        const port = window.location.port ? parseInt(window.location.port) + 1 : 5174;
        // Heuristic: usually next port. Or default 5174.
        const editorUrl = `${window.location.protocol}//${window.location.hostname}:5174/editor/${pageId}`;
        window.open(editorUrl, '_blank');
    };

    const handlePreview = (pageId) => {
        navigate(`/view/${pageId}`);
    };

    const handleDuplicate = (page) => {
        setDuplicateTarget(page);
        setShowDuplicateModal(true);
    };

    const onDuplicateConfirm = async (count, includeChildren, names) => {
        try {
            await duplicatePage(duplicateTarget.id, { count, include_children: includeChildren, names });
            setShowDuplicateModal(false);
            loadData();
        } catch (error) {
            console.error('Error duplicating page:', error);
            alert('Failed to duplicate page: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleSetDashboard = async (page) => {
        try {
            await patchPage(page.id, { is_dashboard: true });
            loadData();
            showToastMessage(`Set "${page.name}" as Dashboard`, 'success');
        } catch (error) {
            console.error('Error setting dashboard:', error);
            showToastMessage('Failed to set dashboard.', 'danger');
        }
    };

    if (!module) return <div>Loading...</div>;

    return (
        <div className="d-flex" id="wrapper">
            <div id="page-content-wrapper" className="w-100">
                <Header toggleSidebar={() => { }} />
                <Container fluid className="p-4">
                    <div className="mb-4">
                        <Button variant="link" onClick={() => navigate('/modules')}>
                            <i className="bi bi-arrow-left"></i> Back to Modules
                        </Button>
                        <h2 className="mt-2">{module.name} - Pages</h2>
                        <p className="text-muted">{module.description}</p>
                    </div>

                    <div className="d-flex justify-content-end mb-3">
                        <Button variant="primary" onClick={() => setShowModal(true)}>
                            <i className="bi bi-plus-lg me-2"></i>New Page
                        </Button>
                    </div>

                    <Row>
                        {pages.map((page) => (
                            <Col md={3} key={page.id} className="mb-4">
                                <Card className="h-100 shadow-sm">
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title>{page.name}</Card.Title>
                                        <Card.Subtitle className="mb-2 text-muted">{page.page_type}</Card.Subtitle>
                                        <Card.Text className="small flex-grow-1">
                                            {page.description}
                                        </Card.Text>
                                        <div className="d-grid gap-2 mt-3">
                                            <Button variant="outline-primary" size="sm" onClick={() => handleDesign(page.id)}>
                                                <i className="bi bi-pencil-square me-2"></i>Design
                                            </Button>
                                            <Button variant="outline-success" size="sm" onClick={() => handlePreview(page.id)}>
                                                <i className="bi bi-eye me-2"></i>Preview
                                            </Button>
                                            <Button
                                                variant={page.is_dashboard ? "success" : "outline-warning"}
                                                size="sm"
                                                onClick={() => handleSetDashboard(page)}
                                                disabled={page.is_dashboard}
                                            >
                                                <i className={`bi ${page.is_dashboard ? 'bi-star-fill' : 'bi-star'} me-2`}></i>
                                                {page.is_dashboard ? 'Dashboard' : 'Set Dashboard'}
                                            </Button>
                                            <Button variant="outline-secondary" size="sm" onClick={() => handleDuplicate(page)}>
                                                <i className="bi bi-files me-2"></i>Duplicate
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>

                <Modal show={showModal} onHide={() => setShowModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Create New Page</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newPage.name}
                                    onChange={(e) => setNewPage({ ...newPage, name: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Type</Form.Label>
                                <Form.Select
                                    value={newPage.page_type}
                                    onChange={(e) => setNewPage({ ...newPage, page_type: e.target.value })}
                                >
                                    <option value="MAIN">Main</option>
                                    <option value="ALARMS">Alarms</option>
                                    <option value="MAP">Map</option>
                                    <option value="ANALYSIS">Analysis</option>
                                    <option value="REPORTS">Reports</option>
                                    <option value="CUSTOM">Custom</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    value={newPage.description}
                                    onChange={(e) => setNewPage({ ...newPage, description: e.target.value })}
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreatePage}>Create Page</Button>
                    </Modal.Footer>
                </Modal>

                <DuplicateModal
                    show={showDuplicateModal}
                    handleClose={() => setShowDuplicateModal(false)}
                    handleDuplicate={onDuplicateConfirm}
                    title="Duplicate Page"
                    targetName={duplicateTarget?.name}
                    type="page"
                />

                <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1050 }}>
                    <Toast onClose={() => setToast({ ...toast, show: false })} show={toast.show} delay={3000} autohide bg={toast.variant}>
                        <Toast.Header>
                            <img src="holder.js/20x20?text=%20" className="rounded me-2" alt="" />
                            <strong className="me-auto">Notification</strong>
                        </Toast.Header>
                        <Toast.Body className={toast.variant === 'light' ? '' : 'text-white'}>{toast.message}</Toast.Body>
                    </Toast>
                </ToastContainer>
            </div>
        </div>
    );
};

export default ModuleDetailsPage;
