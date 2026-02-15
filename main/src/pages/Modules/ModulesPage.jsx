import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Tab, Tabs, InputGroup } from 'react-bootstrap';
import { getModules, createModule, updateModule, deleteModule, duplicateModule, getPages, createPage, updatePage, deletePage, duplicatePage } from '../../services/moduleService';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import TreeView from '../../components/TreeView';
import DuplicateModal from '../../components/DuplicateModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import ToastNotification from '../../components/ToastNotification';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';

const ModulesPage = () => {
    const [treeData, setTreeData] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null); // { type: 'module'|'page', ...data }
    const [allModules, setAllModules] = useState([]); // For page parent selection

    // UI State
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateTarget, setDuplicateTarget] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [toast, setToast] = useState({ show: false, type: '', message: '' });

    const navigate = useNavigate();
    const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm();

    const showToast = (type, message) => {
        setToast({ show: true, type, message });
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const response = await getModules();
            const modulesList = response.data;
            setAllModules(modulesList.map(m => ({ value: m.id, label: m.name })));

            const tData = buildTreeData(modulesList);
            setTreeData(tData);
        } catch (error) {
            console.error('Error fetching modules:', error);
            showToast('danger', 'Failed to load modules');
        }
    };

    const buildTreeData = (modules) => {
        return modules.map(mod => ({
            id: `module_${mod.id}`,
            text: mod.name,
            type: 'module',
            data: { type: 'module', ...mod },
            children: mod.pages ? mod.pages.map(page => ({
                id: `page_${page.id}`,
                text: page.name,
                type: 'page',
                data: { type: 'page', ...page }
            })) : []
        }));
    };

    const handleTreeSelect = (node) => {
        const item = node.data;
        setSelectedNode(item);

        reset();
        Object.keys(item).forEach(key => {
            setValue(key, item[key]);
        });

        if (item.type === 'page') {
            setValue('module', item.module); // Ensure FK is set
        }
    };

    const handleCreateNewModule = () => {
        setSelectedNode({ type: 'module' });
        reset({ name: '', slug: '', description: '' });
    };

    const handleCreateNewPage = () => {
        const parentModuleId = selectedNode?.type === 'module' ? selectedNode.id : selectedNode?.module;
        setSelectedNode({ type: 'page', module: parentModuleId });
        reset({
            name: '', slug: '', description: '',
            module: parentModuleId, page_type: 'CUSTOM', is_dashboard: false
        });
    };

    const confirmDelete = () => {
        if (!selectedNode?.id) return;
        setItemToDelete(selectedNode);
        setShowConfirmModal(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            if (itemToDelete.type === 'module') {
                await deleteModule(itemToDelete.id);
            } else {
                await deletePage(itemToDelete.id);
            }
            loadData();
            setSelectedNode(null);
            showToast('success', 'Deleted successfully');
        } catch (error) {
            showToast('danger', 'Failed to delete');
        } finally {
            setShowConfirmModal(false);
            setItemToDelete(null);
        }
    };

    const handleDuplicate = () => {
        if (!selectedNode?.id) return;
        setDuplicateTarget(selectedNode);
        setShowDuplicateModal(true);
    };

    const onDuplicateConfirm = async (count, includeChildren, names) => {
        try {
            if (duplicateTarget.type === 'module') {
                await duplicateModule(duplicateTarget.id, { count, include_children: includeChildren, names });
            } else {
                await duplicatePage(duplicateTarget.id, { count, include_children: false, names });
            }
            loadData();
            setShowDuplicateModal(false);
            showToast('success', 'Duplicated successfully');
        } catch (error) {
            showToast('danger', 'Duplication failed');
        }
    };

    const onSubmit = async (data) => {
        try {
            if (selectedNode.type === 'module') {
                if (selectedNode.id) {
                    await updateModule(selectedNode.id, data);
                } else {
                    await createModule(data);
                }
            } else {
                if (selectedNode.id) {
                    await updatePage(selectedNode.id, data);
                } else {
                    await createPage(data);
                }
            }
            loadData();
            showToast('success', 'Saved successfully');
        } catch (error) {
            showToast('danger', 'Failed to save: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleOpenEditor = (pageId) => {
        const editorUrl = `http://localhost:5002/editor/${pageId}`;
        window.open(editorUrl, '_blank');
    };

    const handleOpenPreview = (pageId) => {
        const previewUrl = `http://localhost:5004/view/${pageId}`;
        window.open(previewUrl, '_blank');
    };

    return (
        <div className="d-flex flex-column h-100">
            <Header toggleSidebar={() => { }} />

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

            <Container fluid className="p-3 flex-grow-1 overflow-hidden d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="m-0">Modules & Pages</h2>
                    <div>
                        <Button variant="primary" size="sm" className="me-2" onClick={handleCreateNewModule}>
                            <i className="bi bi-plus-lg me-1"></i> New Module
                        </Button>
                        <Button variant="info" size="sm" onClick={handleCreateNewPage} disabled={!selectedNode}>
                            <i className="bi bi-file-earmark-plus me-1"></i> New Page
                        </Button>
                    </div>
                </div>

                <Row className="flex-grow-1 overflow-hidden g-0 border rounded">
                    <Col md={3} className="border-end overflow-auto h-100 bg-white p-2">
                        <TreeView data={treeData} onSelect={handleTreeSelect} />
                    </Col>

                    <Col md={9} className="overflow-auto h-100 p-3 bg-light">
                        {selectedNode ? (
                            <Form onSubmit={handleSubmit(onSubmit)}>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h3>
                                        {selectedNode.id ? `Edit ${selectedNode.type === 'module' ? 'Module' : 'Page'}` : `New ${selectedNode.type === 'module' ? 'Module' : 'Page'}`}
                                    </h3>
                                    <div>
                                        {selectedNode.id && (
                                            <>
                                                {selectedNode.type === 'page' && (
                                                    <div className="d-inline-block me-3">
                                                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleOpenEditor(selectedNode.id)}>
                                                            <i className="bi bi-pencil-square me-1"></i> Design
                                                        </Button>
                                                        <Button variant="outline-success" size="sm" onClick={() => handleOpenPreview(selectedNode.id)}>
                                                            <i className="bi bi-eye me-1"></i> Preview
                                                        </Button>
                                                    </div>
                                                )}
                                                <Button variant="outline-secondary" size="sm" className="me-2" onClick={handleDuplicate}>
                                                    <i className="bi bi-layers me-1"></i> Duplicate
                                                </Button>
                                                <Button variant="outline-danger" size="sm" className="me-2" onClick={confirmDelete}>
                                                    <i className="bi bi-trash me-1"></i> Delete
                                                </Button>
                                            </>
                                        )}
                                        <Button variant="primary" size="sm" type="submit">
                                            <i className="bi bi-save me-1"></i> Save
                                        </Button>
                                    </div>
                                </div>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Name</Form.Label>
                                            <Form.Control {...register('name', { required: true })} isInvalid={!!errors.name} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Slug</Form.Label>
                                            <Form.Control {...register('slug')} placeholder="auto-generated if empty" />
                                        </Form.Group>
                                    </Col>

                                    {selectedNode.type === 'page' && (
                                        <>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Parent Module</Form.Label>
                                                    <Controller
                                                        name="module"
                                                        control={control}
                                                        rules={{ required: true }}
                                                        render={({ field }) => (
                                                            <Select
                                                                {...field}
                                                                options={allModules}
                                                                value={allModules.find(c => c.value === field.value)}
                                                                onChange={val => field.onChange(val.value)}
                                                                placeholder="Select Module"
                                                            />
                                                        )}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Page Type</Form.Label>
                                                    <Form.Select {...register('page_type')}>
                                                        <option value="MAIN">Main</option>
                                                        <option value="ALARMS">Alarms</option>
                                                        <option value="MAP">Map</option>
                                                        <option value="ANALYSIS">Analysis</option>
                                                        <option value="REPORTS">Reports</option>
                                                        <option value="CUSTOM">Custom</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Check
                                                        type="checkbox"
                                                        label="Set as Dashboard"
                                                        {...register('is_dashboard')}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </>
                                    )}

                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Description</Form.Label>
                                            <Form.Control as="textarea" rows={3} {...register('description')} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Form>
                        ) : (
                            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                                <i className="bi bi-diagram-3 mb-3" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                                <h4>Select a Module or Page to view details</h4>
                                <p>Use the tree on the left to navigate through your HMI pages.</p>
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>

            <DuplicateModal
                show={showDuplicateModal}
                onHide={() => setShowDuplicateModal(false)}
                onDuplicate={onDuplicateConfirm}
                itemName={duplicateTarget?.name}
                hasChildren={duplicateTarget?.type === 'module'}
            />
        </div>
    );
};

export default ModulesPage;
