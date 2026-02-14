import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Form, Badge, Card, Tab, Tabs } from 'react-bootstrap';
import { getPointGroups, createPointGroup, updatePointGroup, deletePointGroup, duplicatePointGroup, getPoints, createPoint, updatePoint, deletePoint, duplicatePoint } from '../../services/deviceService';
import DuplicateModal from '../../components/DuplicateModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import ToastNotification from '../../components/ToastNotification';
import TreeView from '../../components/TreeView';
import { useForm, Controller } from 'react-hook-form';
import * as Enums from '../../constants/enums';
import Select from 'react-select';
import { getDevices } from '../../services/deviceService'; // Need to fetch registers via devices or direct
// Ideally we need a way to search all registers available. 
// Let's assume we can fetch all point groups for FK


const IOGroupsPage = () => {
    // Data State
    const [groups, setGroups] = useState([]);
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
    const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm();

    // Lookup Data
    const [allGroups, setAllGroups] = useState([]);
    const [allRegisters, setAllRegisters] = useState([]); // Array of  {value, label}

    // Fetch Data
    const loadData = async () => {
        try {
            const res = await getPointGroups();
            setGroups(res.data);
            setGroups(res.data);
            setAllGroups(res.data.map(g => ({ value: g.id, label: g.name })));

            // Also fetch devices to get all registers for the register selector
            const devRes = await getDevices();
            // Flatten registers
            let regs = [];
            devRes.data.forEach(d => {
                if (d.registers) {
                    d.registers.forEach(r => {
                        regs.push({ value: r.id, label: `${d.name} - ${r.name} (${r.address})` });
                    })
                }
            });
            setAllRegisters(regs);

            const tData = buildTreeData(res.data);
            setTreeData(tData);
        } catch (error) {
            console.error("Failed to load groups", error);
            showToast('danger', 'Failed to load groups');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const buildTreeData = (list) => {
        return list.map(grp => ({
            id: `group_${grp.id}`,
            text: grp.name,
            type: 'group',
            data: { type: 'group', ...grp },
            state: { opened: false },
            children: grp.points ? grp.points.map(pt => ({
                id: `point_${pt.id}`,
                text: pt.name,
                type: 'point',
                data: { type: 'point', ...pt }
            })) : []
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

        if (item.type === 'point') {
            setValue('point_group', item.point_group);
        }
    };

    const handleCreateNewGroup = () => {
        setSelectedNode({ type: 'group' });
        setEditMode(true);
        reset({
            name: '', description: '', is_active: true
        });
    };

    const handleCreateNewPoint = () => {
        if (selectedNode?.type !== 'group' && selectedNode?.type !== 'point') return;

        const parentId = selectedNode.type === 'group' ? selectedNode.id : selectedNode.point_group;

        setSelectedNode({ type: 'point', point_group: parentId });
        setEditMode(true);
        reset({
            name: '', slug: '', point_group: parentId, point_type: 'REGISTER',
            register: null,
            direction: 'Input', data_type: 'Real',
            gain: 1.0, offset: 0.0, decimal_places: 2,
            is_active: true, frequency: 1.0,
            range_min: 4, range_max: 20, scale_min: 0, scale_max: 100,
            threshold_high: 100, threshold_low: 0,
            is_writeable: true,
            unit: '', pulse_width: null,
            is_forced: false, forced_value: '',
            can_be_faulty: false,
            description: ''
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
            if (itemToDelete.type === 'group') {
                await deletePointGroup(itemToDelete.id);
            } else {
                await deletePoint(itemToDelete.id);
            }
            loadData();
            setSelectedNode(null);
            setEditMode(false);
            showToast('success', 'Item deleted successfully');
        } catch (error) {
            showToast('danger', 'Failed to delete item');
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
            if (duplicateTarget.type === 'group') {
                await duplicatePointGroup(duplicateTarget.id, { count, include_children: includeChildren, names });
                showToast('success', 'Group duplicated successfully');
            } else {
                await duplicatePoint(duplicateTarget.id, { count, include_children: false, names });
                showToast('success', 'Point duplicated successfully');
            }
            loadData();
            setShowDuplicateModal(false);
        } catch (error) {
            showToast('danger', "Duplication failed");
        }
    };

    const onSubmit = async (data) => {
        // Sanitize data: convert empty strings to null for numeric fields
        const cleanedData = { ...data };
        Object.keys(cleanedData).forEach(key => {
            if (cleanedData[key] === '') {
                cleanedData[key] = null;
            }
        });

        try {
            if (selectedNode.type === 'group') {
                if (selectedNode.id) {
                    await updatePointGroup(selectedNode.id, cleanedData);
                } else {
                    await createPointGroup(cleanedData);
                }
            } else if (selectedNode.type === 'point') {
                const payload = { ...cleanedData }; // Trust form data for point_group
                if (selectedNode.id) {
                    await updatePoint(selectedNode.id, payload);
                } else {
                    await createPoint(payload);
                }
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
                <h2 className="page-header m-0">IO Groups & Points</h2>
                <div>
                    <Button variant="primary" size="sm" className="me-2" onClick={handleCreateNewGroup}><i className="fa fa-plus"></i> New Group</Button>
                    <Button variant="info" size="sm" onClick={handleCreateNewPoint} disabled={!selectedNode}><i className="fa fa-plus"></i> New Point</Button>
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
                                    {selectedNode.id ? `Edit ${selectedNode.type === 'group' ? 'Group' : 'Point'}` : `New ${selectedNode.type === 'group' ? 'Group' : 'Point'}`}
                                </h3>
                                <div>
                                    {selectedNode.id && (
                                        <>
                                            <Button variant="outline-secondary" className="me-2" onClick={onDuplicate}><i className="fa fa-copy"></i> Duplicate</Button>
                                            <Button variant="outline-danger" className="me-2" onClick={confirmDelete}><i className="fa fa-trash"></i> Delete</Button>
                                        </>
                                    )}
                                    <Button variant="primary" type="submit"><i className="fa fa-save"></i> Save</Button>
                                </div>
                            </div>

                            {selectedNode.type === 'group' && (
                                <Tabs defaultActiveKey="general" id="group-tabs" className="mb-3">
                                    <Tab eventKey="general" title="General">
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control {...register('name', { required: true })} isInvalid={!!errors.name} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Slug</Form.Label><Form.Control {...register('slug')} /></Form.Group></Col>
                                            {selectedNode.id && <Col md={6}><Form.Group className="mb-3"><Form.Label>Order</Form.Label><Form.Control type="number" {...register('order')} /></Form.Group></Col>}
                                            <Col md={6}><Form.Group className="mb-3 pt-4"><Form.Check type="checkbox" label="Active" {...register('is_active')} /></Form.Group></Col>
                                            <Col md={12}><Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} {...register('description')} /></Form.Group></Col>
                                        </Row>
                                    </Tab>
                                </Tabs>
                            )}

                            {selectedNode.type === 'point' && (
                                <Tabs defaultActiveKey="general" id="point-tabs" className="mb-3">
                                    <Tab eventKey="general" title="General">
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control {...register('name', { required: true })} isInvalid={!!errors.name} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Slug</Form.Label><Form.Control {...register('slug')} /></Form.Group></Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Point Type</Form.Label>
                                                    <Controller
                                                        name="point_type"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Select
                                                                {...field}
                                                                options={Enums.IO_TYPE_CHOICES}
                                                                value={Enums.IO_TYPE_CHOICES.find(c => c.value === field.value)}
                                                                onChange={val => field.onChange(val.value)}
                                                            />
                                                        )}
                                                    />
                                                </Form.Group>
                                            </Col>

                                            {/* Register Select - Moved from Hardware Tab */}
                                            {watch('point_type') === 'REGISTER' && (
                                                <Col md={12}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Register (Link ID)</Form.Label>
                                                        <Controller
                                                            name="register"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <Select
                                                                    {...field}
                                                                    options={allRegisters}
                                                                    value={allRegisters.find(c => c.value === field.value)}
                                                                    onChange={val => field.onChange(val ? val.value : null)}
                                                                    isClearable
                                                                    placeholder="Select Register..."
                                                                />
                                                            )}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            )}
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Direction</Form.Label>
                                                    <Controller
                                                        name="direction"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Select
                                                                {...field}
                                                                options={Enums.DIRECTION_CHOICES}
                                                                value={Enums.DIRECTION_CHOICES.find(c => c.value === field.value)}
                                                                onChange={val => field.onChange(val.value)}
                                                            />
                                                        )}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Point Group (Parent)</Form.Label>
                                                    <Controller
                                                        name="point_group"
                                                        control={control}
                                                        rules={{ required: true }}
                                                        render={({ field }) => (
                                                            <Select
                                                                {...field}
                                                                options={allGroups}
                                                                value={allGroups.find(c => c.value === field.value)}
                                                                onChange={val => field.onChange(val.value)}
                                                                placeholder="Select Parent Group"
                                                            />
                                                        )}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}><Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} {...register('description')} /></Form.Group></Col>
                                        </Row>
                                    </Tab>
                                    <Tab eventKey="hardware" title="Hardware & Data">
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Data Type</Form.Label>
                                                    <Controller
                                                        name="data_type"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Select
                                                                {...field}
                                                                options={Enums.DATA_TYPE_CHOICES}
                                                                value={Enums.DATA_TYPE_CHOICES.find(c => c.value === field.value)}
                                                                onChange={val => field.onChange(val.value)}
                                                            />
                                                        )}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}><Form.Group className="mb-3 p-4"><Form.Check type="checkbox" label="Is Active" {...register('is_active')} /></Form.Group></Col>
                                            <Col md={4}><Form.Group className="mb-3 p-4"><Form.Check type="checkbox" label="Isolated" {...register('is_isolated')} /></Form.Group></Col>
                                            <Col md={4}><Form.Group className="mb-3 p-4"><Form.Check type="checkbox" label="Single Bit" {...register('is_single_bit')} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Frequency</Form.Label><Form.Control type="number" step="0.1" {...register('frequency')} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Bit Index</Form.Label><Form.Control type="number" {...register('bit')} /></Form.Group></Col>
                                        </Row>
                                    </Tab>
                                    <Tab eventKey="scaling" title="Scaling & Units">
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Unit</Form.Label><Form.Control {...register('unit')} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Decimals</Form.Label><Form.Control type="number" {...register('decimal_places')} /></Form.Group></Col>
                                            <Col md={3}><Form.Group className="mb-3"><Form.Label>Gain</Form.Label><Form.Control type="number" step="0.01" {...register('gain')} /></Form.Group></Col>
                                            <Col md={3}><Form.Group className="mb-3"><Form.Label>Offset</Form.Label><Form.Control type="number" step="0.01" {...register('offset')} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3 p-4"><Form.Check type="checkbox" label="Offset Before Gain" {...register('offset_before_gain')} /></Form.Group></Col>

                                            <Col md={3}><Form.Group className="mb-3"><Form.Label>Range Min</Form.Label><Form.Control type="number" step="0.01" {...register('range_min')} /></Form.Group></Col>
                                            <Col md={3}><Form.Group className="mb-3"><Form.Label>Range Max</Form.Label><Form.Control type="number" step="0.01" {...register('range_max')} /></Form.Group></Col>
                                            <Col md={3}><Form.Group className="mb-3"><Form.Label>Scale Min</Form.Label><Form.Control type="number" step="0.01" {...register('scale_min')} /></Form.Group></Col>
                                            <Col md={3}><Form.Group className="mb-3"><Form.Label>Scale Max</Form.Label><Form.Control type="number" step="0.01" {...register('scale_max')} /></Form.Group></Col>
                                        </Row>
                                    </Tab>
                                    <Tab eventKey="logic" title="Logic & Thresholds">
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>High Threshold</Form.Label><Form.Control type="number" {...register('threshold_high')} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Low Threshold</Form.Label><Form.Control type="number" {...register('threshold_low')} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Pulse Width</Form.Label><Form.Control type="number" {...register('pulse_width')} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3 p-4"><Form.Check type="checkbox" label="Can Be Faulty" {...register('can_be_faulty')} /></Form.Group></Col>
                                        </Row>
                                    </Tab>
                                    <Tab eventKey="override" title="Force/Override">
                                        <Row>
                                            <Col md={12}><Form.Group className="mb-3"><Form.Check type="checkbox" label="Force Value" {...register('is_forced')} /></Form.Group></Col>
                                            <Col md={12}><Form.Group className="mb-3"><Form.Label>Forced Value</Form.Label><Form.Control {...register('forced_value')} /></Form.Group></Col>
                                        </Row>
                                    </Tab>
                                    <Tab eventKey="realtime" title="Real-time">
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Read Value</Form.Label><Form.Control readOnly value={selectedNode.read_value || ''} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Write Value</Form.Label><Form.Control readOnly value={selectedNode.write_value || ''} /></Form.Group></Col>
                                            <Col md={12}><Form.Group className="mb-3"><Form.Label>Error</Form.Label><Form.Control readOnly value={selectedNode.error_message || selectedNode.error_status} /></Form.Group></Col>
                                        </Row>
                                    </Tab>
                                </Tabs>
                            )}

                        </Form>
                    ) : (
                        <div className="text-center text-muted p-5">
                            <h4>Select an item from the tree to view details</h4>
                        </div>
                    )}
                </Col>
            </Row>

            <DuplicateModal
                show={showDuplicateModal}
                onHide={() => setShowDuplicateModal(false)}
                onDuplicate={onDuplicateConfirm}
                itemName={duplicateTarget?.name}
                hasChildren={duplicateTarget?.type === 'group'}
            />
        </div>
    );
};

export default IOGroupsPage;
