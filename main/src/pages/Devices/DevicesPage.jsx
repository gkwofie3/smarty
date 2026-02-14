import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Form, Badge, Card, Tab, Tabs } from 'react-bootstrap';
import { getDevices, createDevice, updateDevice, deleteDevice, duplicateDevice, getRegisters, createRegister, updateRegister, deleteRegister, duplicateRegister } from '../../services/deviceService';
import DuplicateModal from '../../components/DuplicateModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import ToastNotification from '../../components/ToastNotification';
import TreeView from '../../components/TreeView';
import { useForm, Controller } from 'react-hook-form';
import * as Enums from '../../constants/enums';
import Select from 'react-select';

const DevicesPage = () => {
    // Data State
    const [devices, setDevices] = useState([]);
    const [treeData, setTreeData] = useState([]);

    // Lookup Data
    const [allDevices, setAllDevices] = useState([]);  // For FK selection in Register form

    // Selection State
    const [selectedNode, setSelectedNode] = useState(null); // { type: 'device'|'register', id: ..., original: ... }
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

    // Fetch Data
    const loadData = async () => {
        try {
            const res = await getDevices();
            setDevices(res.data);

            // Format for Select
            setAllDevices(res.data.map(d => ({ value: d.id, label: d.name })));

            const tData = buildTreeData(res.data);
            setTreeData(tData);
        } catch (error) {
            console.error("Failed to load devices", error);
            showToast('danger', 'Failed to load devices');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const buildTreeData = (devicesList) => {
        return devicesList.map(dev => ({
            id: `device_${dev.id}`,
            text: dev.name,
            type: 'device',
            data: { type: 'device', ...dev },
            state: { opened: false },
            children: dev.registers ? dev.registers.map(reg => ({
                id: `reg_${reg.id}`,
                text: reg.name,
                type: 'register',
                data: { type: 'register', ...reg }
            })) : []
        }));
    };

    const handleTreeSelect = (node) => {
        // node.original.data contains the item data
        const item = node.original.data;
        setSelectedNode(item);
        setEditMode(true); // Auto-enter edit/view mode

        // Populate form
        reset(); // Clear previous values
        Object.keys(item).forEach(key => {
            setValue(key, item[key]);
        });

        // Special mapping if needed (e.g. nested objects)
        if (item.type === 'register') {
            setValue('device', item.device); // ensure FK is set
        }
    };

    const handleCreateNewDevice = () => {
        setSelectedNode({ type: 'device' }); // Empty device
        setEditMode(true);
        reset({
            name: '', device_type: 'GENERATOR', protocol: 'ModbusTCP',
            ip_address: '127.0.0.1', port_number: 502, slave_id: 1,
            baud_rate: 9600, parity: 'Even', stop_bits: 1,
            is_online: false
        });
    };

    const handleCreateNewRegister = () => {
        if (selectedNode?.type !== 'device' && selectedNode?.type !== 'register') return;

        // If device selected, use it. If register selected, use its parent device.
        const parentDeviceId = selectedNode.type === 'device' ? selectedNode.id : selectedNode.device;

        setSelectedNode({ type: 'register', device: parentDeviceId }); // Empty register linked to device
        setEditMode(true);
        reset({
            name: '', address: 0, device: parentDeviceId,
            direction: 'Input', signal_type: 'Digital', data_type: 'Real',
            read_function_code: '04', write_function_code: '06',
            gain: 1.0, offset: 0.0,
            is_writeable: true, is_active: true
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
            if (itemToDelete.type === 'device') {
                await deleteDevice(itemToDelete.id);
            } else {
                await deleteRegister(itemToDelete.id);
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
            if (duplicateTarget.type === 'device') {
                await duplicateDevice(duplicateTarget.id, { count, include_children: includeChildren, names });
                showToast('success', 'Device duplicated successfully');
            } else {
                await duplicateRegister(duplicateTarget.id, { count, include_children: false, names });
                showToast('success', 'Register duplicated successfully');
            }
            loadData();
            setShowDuplicateModal(false);
        } catch (error) {
            showToast('danger', "Duplication failed");
        }
    };

    const onSubmit = async (data) => {
        // Sanitize data: convert empty strings to null ONLY for numeric/nullable fields
        const cleanedData = { ...data };
        const numericFields = ['port_number', 'slave_id', 'baud_rate', 'stop_bits', 'bacnet_device_instance', 'bacnet_network_number', 'module_number', 'count', 'address'];

        Object.keys(cleanedData).forEach(key => {
            if (cleanedData[key] === '' && numericFields.includes(key)) {
                cleanedData[key] = null;
            }
        });

        try {
            if (selectedNode.type === 'device') {
                if (selectedNode.id) {
                    await updateDevice(selectedNode.id, cleanedData);
                } else {
                    await createDevice(cleanedData);
                }
            } else if (selectedNode.type === 'register') {
                const payload = { ...cleanedData }; // Trust form data for device
                if (selectedNode.id) {
                    await updateRegister(selectedNode.id, payload);
                } else {
                    await createRegister(payload);
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
                <h2 className="page-header m-0">Devices & Registers</h2>
                <div>
                    <Button variant="primary" size="sm" className="me-2" onClick={handleCreateNewDevice}><i className="fa fa-plus"></i> New Device</Button>
                    <Button variant="info" size="sm" onClick={handleCreateNewRegister} disabled={!selectedNode}><i className="fa fa-plus"></i> New Register</Button>
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
                                    {selectedNode.id ? `Edit ${selectedNode.type === 'device' ? 'Device' : 'Register'}` : `New ${selectedNode.type === 'device' ? 'Device' : 'Register'}`}
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

                            {selectedNode.type === 'device' && (
                                <Tabs defaultActiveKey="general" id="device-tabs" className="mb-3">
                                    <Tab eventKey="general" title="General">
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control {...register('name', { required: true })} isInvalid={!!errors.name} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Slug</Form.Label><Form.Control {...register('slug', { required: true })} isInvalid={!!errors.slug} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Type</Form.Label><Form.Select {...register('device_type')}>{Enums.DEVICE_TYPE_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</Form.Select></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Protocol</Form.Label><Form.Select {...register('protocol')}>{Enums.PROTOCOL_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</Form.Select></Form.Group></Col>
                                            <Col md={12}><Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} {...register('description')} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Location</Form.Label><Form.Control {...register('location')} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Path</Form.Label><Form.Control {...register('path')} /></Form.Group></Col>
                                            <Col md={3}><Form.Group className="mb-3"><Form.Label>Module Number</Form.Label><Form.Control type="number" {...register('module_number')} /></Form.Group></Col>
                                            <Col md={3}><Form.Group className="mb-3"><Form.Label>Module Type</Form.Label><Form.Control {...register('module_type')} /></Form.Group></Col>
                                            <Col md={3}><Form.Group className="mb-3 pt-4"><Form.Check type="checkbox" label="Is Online" {...register('is_online')} /></Form.Group></Col>
                                        </Row>
                                    </Tab>
                                    <Tab eventKey="network" title="Network">
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>IP Address</Form.Label><Form.Control {...register('ip_address')} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Port Number</Form.Label><Form.Control type="number" {...register('port_number')} /></Form.Group></Col>
                                        </Row>
                                    </Tab>
                                    <Tab eventKey="modbus" title="Modbus">
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Slave ID</Form.Label><Form.Control type="number" {...register('slave_id')} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Baud Rate</Form.Label><Form.Select {...register('baud_rate')}>{Enums.BAUD_RATE_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</Form.Select></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Parity</Form.Label><Form.Select {...register('parity')}>{Enums.PARITY_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</Form.Select></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Stop Bits</Form.Label><Form.Select {...register('stop_bits')}>{Enums.STOP_BITS_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</Form.Select></Form.Group></Col>
                                        </Row>
                                    </Tab>
                                    <Tab eventKey="bacnet" title="BACnet">
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Device Instance</Form.Label><Form.Control type="number" {...register('bacnet_device_instance')} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Network Number</Form.Label><Form.Control type="number" {...register('bacnet_network_number')} /></Form.Group></Col>
                                        </Row>
                                    </Tab>
                                </Tabs>
                            )}

                            {selectedNode.type === 'register' && (
                                <Tabs defaultActiveKey="general" id="reg-tabs" className="mb-3">
                                    <Tab eventKey="general" title="General">
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control {...register('name', { required: true })} isInvalid={!!errors.name} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Address</Form.Label><Form.Control type="number" {...register('address')} /></Form.Group></Col>

                                            {/* FK Selection with Search */}
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Device</Form.Label>
                                                    <Controller
                                                        name="device"
                                                        control={control}
                                                        rules={{ required: true }}
                                                        render={({ field }) => (
                                                            <Select
                                                                {...field}
                                                                options={allDevices}
                                                                value={allDevices.find(c => c.value === field.value)}
                                                                onChange={val => field.onChange(val.value)}
                                                                placeholder="Select Device"
                                                            />
                                                        )}
                                                    />
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Signal Type</Form.Label>
                                                    <Controller
                                                        name="signal_type"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Select
                                                                {...field}
                                                                options={Enums.SIGNAL_TYPE_CHOICES}
                                                                value={Enums.SIGNAL_TYPE_CHOICES.find(c => c.value === field.value)}
                                                                onChange={val => field.onChange(val.value)}
                                                            />
                                                        )}
                                                    />
                                                </Form.Group>
                                            </Col>
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
                                        </Row>
                                    </Tab>
                                    <Tab eventKey="function" title="Functions">
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Read Function</Form.Label><Form.Select {...register('read_function_code')}>{Enums.FUNCTION_CODE_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</Form.Select></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Write Function</Form.Label><Form.Select {...register('write_function_code')}>{Enums.FUNCTION_CODE_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</Form.Select></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3 pt-4"><Form.Check type="checkbox" label="Is Single Bit" {...register('is_single_bit')} /></Form.Group></Col>
                                        </Row>
                                    </Tab>
                                    <Tab eventKey="scaling" title="Scaling">
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Count</Form.Label><Form.Control type="number" {...register('count')} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Gain</Form.Label><Form.Control type="number" step="0.01" {...register('gain')} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Offset</Form.Label><Form.Control type="number" step="0.01" {...register('offset')} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3 pt-4"><Form.Check type="checkbox" label="Offset Before Gain" {...register('offset_before_gain')} /></Form.Group></Col>
                                        </Row>
                                    </Tab>
                                    <Tab eventKey="status" title="Status & Flags">
                                        <Row>
                                            <Col md={3}><Form.Group className="mb-3"><Form.Check type="checkbox" label="Writeable" {...register('is_writeable')} /></Form.Group></Col>
                                            <Col md={3}><Form.Group className="mb-3"><Form.Check type="checkbox" label="Active" {...register('is_active')} /></Form.Group></Col>
                                            <Col md={3}><Form.Group className="mb-3"><Form.Check type="checkbox" label="Isolated" {...register('is_isolated')} /></Form.Group></Col>
                                            <Col md={3}><Form.Group className="mb-3"><Form.Check type="checkbox" label="Can be Faulty" {...register('can_be_faulty')} /></Form.Group></Col>
                                        </Row>
                                    </Tab>
                                    <Tab eventKey="diagnostic" title="Diagnostics">
                                        <Row>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Details</Form.Label><Form.Control readOnly value={`Current: ${selectedNode.current_value || ''}`} /></Form.Group></Col>
                                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Error</Form.Label><Form.Control readOnly value={selectedNode.error_status} /></Form.Group></Col>
                                            <Col md={12}><Form.Group className="mb-3"><Form.Label>Message</Form.Label><Form.Control as="textarea" readOnly value={selectedNode.error_message || ''} /></Form.Group></Col>
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
                hasChildren={duplicateTarget?.type === 'device'}
            />
        </div>
    );
};

export default DevicesPage;
