import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import { getModules, createModule, updateModule, deleteModule, duplicateModule } from '../../services/moduleService';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import DuplicateModal from '../../components/DuplicateModal'; // Assuming Header component exists

const ModulesPage = () => {
    const [modules, setModules] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentModule, setCurrentModule] = useState({ name: '', description: '' });

    // Duplicate State
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateTarget, setDuplicateTarget] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        loadModules();
    }, []);

    const loadModules = async () => {
        try {
            const response = await getModules();
            setModules(response.data);
        } catch (error) {
            console.error('Error fetching modules:', error);
        }
    };

    const handleSave = async () => {
        try {
            if (editMode && currentModule.id) {
                await updateModule(currentModule.id, currentModule);
            } else {
                await createModule(currentModule);
            }
            setShowModal(false);
            loadModules();
        } catch (error) {
            console.error('Error saving module:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this module?')) {
            try {
                await deleteModule(id);
                loadModules();
            } catch (error) {
                console.error('Error deleting module:', error);
            }
        }
    };

    const handleEdit = (module) => {
        setCurrentModule(module);
        setEditMode(true);
        setShowModal(true);
    };

    const handleCreate = () => {
        setCurrentModule({ name: '', description: '' });
        setEditMode(false);
        setShowModal(true);
    };

    const handleOpenModule = (id) => {
        navigate(`/modules/${id}/pages`);
    };

    const handleDuplicate = (module) => {
        setDuplicateTarget(module);
        setShowDuplicateModal(true);
    };

    const onDuplicateConfirm = async (count, includeChildren, names) => {
        try {
            await duplicateModule(duplicateTarget.id, { count, include_children: includeChildren, names });
            setShowDuplicateModal(false);
            loadModules();
        } catch (error) {
            console.error('Error duplicating module:', error);
            alert('Failed to duplicate module: ' + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="d-flex" id="wrapper">
            {/* Sidebar would go here */}
            <div id="page-content-wrapper" className="w-100">
                <Header toggleSidebar={() => { }} />
                <Container fluid className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2>System Modules</h2>
                        <Button variant="primary" onClick={handleCreate}>
                            <i className="bi bi-plus-lg me-2"></i>New Module
                        </Button>
                    </div>

                    <Row>
                        {modules.map((module) => (
                            <Col md={4} lg={3} key={module.id} className="mb-4">
                                <Card className="h-100 shadow-sm module-card">
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title className="d-flex justify-content-between align-items-start">
                                            <span>{module.name}</span>
                                            <div className="dropdown">
                                                <button className="btn btn-link p-0 text-muted" type="button" data-bs-toggle="dropdown">
                                                    <i className="bi bi-three-dots-vertical"></i>
                                                </button>
                                                <ul className="dropdown-menu dropdown-menu-end">
                                                    <li><button className="dropdown-item" onClick={() => handleEdit(module)}>Edit</button></li>
                                                    <li><button className="dropdown-item" onClick={() => handleDuplicate(module)}>Duplicate</button></li>
                                                    <li><button className="dropdown-item text-danger" onClick={() => handleDelete(module.id)}>Delete</button></li>
                                                </ul>
                                            </div>
                                        </Card.Title>
                                        <Card.Text className="text-muted small flex-grow-1">
                                            {module.description || 'No description provided.'}
                                        </Card.Text>
                                        <div className="mt-3">
                                            <Button variant="outline-primary" className="w-100" onClick={() => handleOpenModule(module.id)}>
                                                Open Module
                                            </Button>
                                        </div>
                                    </Card.Body>
                                    <Card.Footer className="bg-transparent border-0 text-muted small">
                                        {module.pages ? module.pages.length : 0} Pages
                                    </Card.Footer>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>

                <Modal show={showModal} onHide={() => setShowModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editMode ? 'Edit Module' : 'Create Module'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={currentModule.name}
                                    onChange={(e) => setCurrentModule({ ...currentModule, name: e.target.value })}
                                    placeholder="Enter module name"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={currentModule.description}
                                    onChange={(e) => setCurrentModule({ ...currentModule, description: e.target.value })}
                                    placeholder="Enter description"
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSave}>{editMode ? 'Save Changes' : 'Create Module'}</Button>
                    </Modal.Footer>
                </Modal>

                <DuplicateModal
                    show={showDuplicateModal}
                    handleClose={() => setShowDuplicateModal(false)}
                    handleDuplicate={onDuplicateConfirm}
                    title={`Duplicate Module provided`}
                    targetName={duplicateTarget?.name}
                    type="module"
                />
            </div>
        </div>
    );
};

export default ModulesPage;
