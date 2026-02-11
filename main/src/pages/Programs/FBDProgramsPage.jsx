import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Form, Card, Tab, Tabs } from 'react-bootstrap';
import { getFBDPrograms, createFBDProgram, updateFBDProgram, deleteFBDProgram, duplicateFBDProgram, executeFBDProgram } from '../../services/fbdService';
import DuplicateModal from '../../components/DuplicateModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import ToastNotification from '../../components/ToastNotification';
import TreeView from '../../components/TreeView';
import { useForm } from 'react-hook-form';

const FBDProgramsPage = () => {
    // Data State
    const [programs, setPrograms] = useState([]);
    const [treeData, setTreeData] = useState([]);

    // Selection State
    const [selectedNode, setSelectedNode] = useState(null);
    const [editMode, setEditMode] = useState(false);

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
            const res = await getFBDPrograms();
            setPrograms(res.data);
            const tData = buildTreeData(res.data);
            setTreeData(tData);
        } catch (error) {
            console.error("Failed to load FBD programs", error);
            showToast('danger', 'Failed to load FBD programs');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const buildTreeData = (programsList) => {
        return programsList.map(prog => ({
            id: `prog_${prog.id}`,
            text: prog.name,
            type: 'program',
            data: { type: 'program', ...prog },
            state: { opened: false },
            children: []
        }));
    };

    const handleTreeSelect = (node) => {
        const item = node.original.data;
        setSelectedNode(item);
        setEditMode(true);

        reset();
        Object.keys(item).forEach(key => {
            setValue(key, item[key]);
        });
    };

    const handleCreateNewProg = () => {
        setSelectedNode({ type: 'program' });
        setEditMode(true);
        reset({
            name: '', description: '', is_active: true, diagram_json: {}, bindings: {}
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
            await deleteFBDProgram(itemToDelete.id);
            loadData();
            setSelectedNode(null);
            setEditMode(false);
            showToast('success', 'Program deleted successfully');
        } catch (error) {
            showToast('danger', 'Failed to delete program');
        } finally {
            setShowConfirmModal(false);
            setItemToDelete(null);
        }
    };

    const onDuplicate = () => {
        if (!selectedNode?.id) return;
        setDuplicateTarget(selectedNode);
        setShowDuplicateModal(true);
    };

    const onDuplicateConfirm = async (count, includeChildren, names) => {
        try {
            await duplicateFBDProgram(duplicateTarget.id, { count, include_children: includeChildren, names });
            showToast('success', 'Program duplicated successfully');
            loadData();
            setShowDuplicateModal(false);
        } catch (error) {
            showToast('danger', "Duplication failed");
        }
    };

    const handleExecute = async () => {
        if (!selectedNode?.id) return;
        try {
            const res = await executeFBDProgram(selectedNode.id);
            showToast('info', `Program executed: ${res.data.status}`);
        } catch (error) {
            showToast('danger', "Execution failed");
        }
    }

    const onSubmit = async (data) => {
        try {
            if (selectedNode.id) {
                await updateFBDProgram(selectedNode.id, data);
            } else {
                await createFBDProgram(data);
            }
            loadData();
            showToast('success', "Saved successfully");
        } catch (error) {
            console.error(error);
            showToast('danger', "Failed to save: " + JSON.stringify(error.response?.data || error.message));
        }
    };

    return (
        <div className="d-flex flex-column h-100 p-3">
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
                <h2 className="page-header m-0">FBD Programs</h2>
                <div>
                    <Button variant="primary" size="sm" onClick={handleCreateNewProg}><i className="fa fa-plus"></i> New Program</Button>
                </div>
            </div>

            <Row className="flex-grow-1" style={{ minHeight: 0 }}>
                <Col md={3} className="border-end overflow-auto h-100 bg-white p-2">
                    <TreeView data={treeData} onSelect={handleTreeSelect} />
                </Col>

                <Col md={9} className="overflow-auto h-100 p-3 bg-light">
                    {selectedNode ? (
                        <Form onSubmit={handleSubmit(onSubmit)}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3>
                                    {selectedNode.id ? `Edit Program: ${selectedNode.name}` : `New FBD Program`}
                                </h3>
                                <div>
                                    {selectedNode.id && (
                                        <>
                                            <Button variant="outline-info" className="me-2" onClick={handleExecute}><i className="fa fa-play"></i> Execute</Button>
                                            <Button variant="outline-secondary" className="me-2" onClick={onDuplicate}><i className="fa fa-copy"></i> Duplicate</Button>
                                            <Button variant="outline-danger" className="me-2" onClick={confirmDelete}><i className="fa fa-trash"></i> Delete</Button>
                                        </>
                                    )}
                                    <Button variant="primary" type="submit"><i className="fa fa-save"></i> Save</Button>
                                </div>
                            </div>

                            <Tabs defaultActiveKey="general" id="prog-tabs" className="mb-3">
                                <Tab eventKey="general" title="General Info">
                                    <Row>
                                        <Col md={12}><Form.Group className="mb-3"><Form.Label>Program Name</Form.Label><Form.Control {...register('name', { required: true })} isInvalid={!!errors.name} /></Form.Group></Col>
                                        <Col md={12}><Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} {...register('description')} /></Form.Group></Col>
                                        <Col md={6}><Form.Group className="mb-3 pt-2"><Form.Check type="checkbox" label="Is Active" {...register('is_active')} /></Form.Group></Col>
                                    </Row>
                                </Tab>
                                <Tab eventKey="data" title="Program Data (JSON)">
                                    <Row>
                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Diagram JSON</Form.Label>
                                                <Form.Control as="textarea" rows={10} {...register('diagram_json', {
                                                    setValueAs: v => typeof v === 'string' ? JSON.parse(v) : v,
                                                    getValues: v => JSON.stringify(v, null, 2)
                                                })}
                                                    defaultValue={JSON.stringify(selectedNode.diagram_json, null, 2)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Bindings JSON</Form.Label>
                                                <Form.Control as="textarea" rows={5} {...register('bindings', {
                                                    setValueAs: v => typeof v === 'string' ? JSON.parse(v) : v,
                                                    getValues: v => JSON.stringify(v, null, 2)
                                                })}
                                                    defaultValue={JSON.stringify(selectedNode.bindings, null, 2)}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Tab>
                            </Tabs>

                        </Form>
                    ) : (
                        <div className="text-center text-muted p-5">
                            <h4>Select a program from the tree or create a new one</h4>
                        </div>
                    )}
                </Col>
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

export default FBDProgramsPage;
