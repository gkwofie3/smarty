import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Form, Card, Tab, Tabs, Table, Badge } from 'react-bootstrap';
import {
    getScripts, createScript, updateScript, deleteScript, duplicateScript
} from '../../services/scriptService';
import DuplicateModal from '../../components/DuplicateModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import ToastNotification from '../../components/ToastNotification';
import { useForm } from 'react-hook-form';

const ScriptsPage = () => {
    // Data State
    const [scripts, setScripts] = useState([]);
    const [selectedScript, setSelectedScript] = useState(null);

    // UI State
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateTarget, setDuplicateTarget] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [toast, setToast] = useState({ show: false, type: '', message: '' });

    const showToast = (type, message) => {
        setToast({ show: true, type, message });
    };

    // Forms
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    // Fetch Data
    const loadData = async () => {
        try {
            const res = await getScripts();
            setScripts(res.data);
        } catch (error) {
            console.error("Failed to load scripts", error);
            showToast('danger', 'Failed to load scripts');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSelectScript = (script) => {
        setSelectedScript(script);
        reset();
        Object.keys(script).forEach(key => {
            setValue(key, script[key]);
        });
    };

    const handleCreateNew = () => {
        setSelectedScript({ isNew: true });
        reset({
            name: '', description: '', is_active: true
        });
    };

    const confirmDelete = (script) => {
        setItemToDelete(script);
        setShowConfirmModal(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteScript(itemToDelete.id);
            loadData();
            if (selectedScript?.id === itemToDelete.id) setSelectedScript(null);
            showToast('success', 'Script deleted successfully');
        } catch (error) {
            showToast('danger', 'Failed to delete script');
        } finally {
            setShowConfirmModal(false);
            setItemToDelete(null);
        }
    };

    const onDuplicate = (script) => {
        setDuplicateTarget(script);
        setShowDuplicateModal(true);
    };

    const onDuplicateConfirm = async (count, includeChildren, names) => {
        try {
            await duplicateScript(duplicateTarget.id, { count, names });
            showToast('success', 'Script duplicated successfully');
            loadData();
            setShowDuplicateModal(false);
        } catch (error) {
            showToast('danger', "Duplication failed");
        }
    };

    const onSubmit = async (data) => {
        try {
            if (selectedScript.id) {
                await updateScript(selectedScript.id, data);
            } else {
                await createScript(data);
            }
            loadData();
            showToast('success', "Saved successfully");
            setSelectedScript(null);
        } catch (error) {
            showToast('danger', "Failed to save: " + JSON.stringify(error.response?.data || error.message));
        }
    };

    return (
        <div className="d-flex flex-column h-100 p-3 bg-light">
            <ToastNotification
                show={toast.show}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, show: false })}
            />

            <ConfirmationModal
                show={showConfirmModal}
                onHide={() => setShowConfirmModal(false)}
                onConfirm={handleDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete ${itemToDelete?.name}?`}
            />

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="page-header m-0">Script Programs</h2>
                <div>
                    <Button variant="primary" size="sm" onClick={handleCreateNew}>
                        <i className="fa fa-plus me-1"></i> New Script
                    </Button>
                </div>
            </div>

            <Row className="flex-grow-1" style={{ minHeight: 0 }}>
                <Col md={selectedScript ? 4 : 12} className="h-100 overflow-auto">
                    <Card className="border-0 shadow-sm">
                        <Table hover responsive className="mb-0 align-middle">
                            <thead className="bg-white">
                                <tr>
                                    <th>Name</th>
                                    <th>Status</th>
                                    {!selectedScript && <th>Description</th>}
                                    {!selectedScript && <th>Last Execution</th>}
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scripts.map(s => (
                                    <tr key={s.id} onClick={() => handleSelectScript(s)} style={{ cursor: 'pointer' }} className={selectedScript?.id === s.id ? 'table-primary' : ''}>
                                        <td>
                                            <div className="fw-bold">{s.name}</div>
                                        </td>
                                        <td>
                                            <Badge bg={s.is_active ? 'success' : 'secondary'}>
                                                {s.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        {!selectedScript && <td className="text-muted">{s.description}</td>}
                                        {!selectedScript && (
                                            <td>
                                                {s.last_execution_status ? (
                                                    <Badge bg={s.last_execution_status === 'success' ? 'info' : 'danger'}>
                                                        {s.last_execution_status}
                                                    </Badge>
                                                ) : 'Never'}
                                            </td>
                                        )}
                                        <td className="text-end" onClick={e => e.stopPropagation()}>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-1 hover-elevate"
                                                onClick={() => window.open(`http://localhost:5005/editor/${s.id}`, '_blank')}
                                            >
                                                <i className="fa fa-code"></i> Edit Code
                                            </Button>
                                            <Button variant="link" size="sm" className="text-secondary p-1" onClick={() => onDuplicate(s)}><i className="fa fa-copy"></i></Button>
                                            <Button variant="link" size="sm" className="text-danger p-1" onClick={() => confirmDelete(s)}><i className="fa fa-trash"></i></Button>
                                        </td>
                                    </tr>
                                ))}
                                {scripts.length === 0 && (
                                    <tr>
                                        <td colSpan={selectedScript ? 3 : 5} className="text-center text-muted p-4">
                                            No scripts found. Create your first one!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card>
                </Col>

                {selectedScript && (
                    <Col md={8} className="h-100 overflow-auto">
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">{selectedScript.isNew ? 'New Script' : `Properties: ${selectedScript.name}`}</h5>
                                <Button variant="close" onClick={() => setSelectedScript(null)}></Button>
                            </Card.Header>
                            <Card.Body>
                                <Form id="script-form" onSubmit={handleSubmit(onSubmit)}>
                                    <Row>
                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Name</Form.Label>
                                                <Form.Control {...register('name', { required: true })} isInvalid={!!errors.name} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Description</Form.Label>
                                                <Form.Control as="textarea" rows={3} {...register('description')} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Check type="checkbox" label="Script is Active" {...register('is_active')} />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Form>

                                {!selectedScript.isNew && (
                                    <Tabs defaultActiveKey="bindings" className="mt-3">
                                        <Tab eventKey="bindings" title="Bindings Management">
                                            <div className="p-3 text-center text-muted">
                                                <i className="fa fa-link fa-2x mb-2"></i>
                                                <p>Analyze code in editor to detect variables for binding.</p>
                                                <Button
                                                    variant="primary"
                                                    onClick={() => window.open(`http://localhost:5005/editor/${selectedScript.id}`, '_blank')}
                                                >
                                                    Go to Script Editor
                                                </Button>
                                            </div>
                                        </Tab>
                                        <Tab eventKey="logs" title="Last Execution Logs">
                                            <div className="bg-dark text-light p-3 mt-2 rounded font-monospace small" style={{ minHeight: '150px' }}>
                                                {selectedScript.last_execution_log || 'No logs available.'}
                                            </div>
                                        </Tab>
                                    </Tabs>
                                )}
                            </Card.Body>
                            <Card.Footer className="bg-white text-end">
                                <Button variant="secondary" className="me-2" onClick={() => setSelectedScript(null)}>Cancel</Button>
                                <Button variant="primary" form="script-form" type="submit">
                                    <i className="fa fa-save me-1"></i> {selectedScript.isNew ? 'Create Script' : 'Save Changes'}
                                </Button>
                            </Card.Footer>
                        </Card>
                    </Col>
                )}
            </Row>

            <DuplicateModal
                show={showDuplicateModal}
                onHide={() => setShowDuplicateModal(false)}
                onDuplicate={onDuplicateConfirm}
                itemName={duplicateTarget?.name}
                hasChildren={false}
            />
        </div>
    );
};

export default ScriptsPage;
