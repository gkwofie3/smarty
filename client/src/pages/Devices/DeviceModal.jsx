import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { createDevice, updateDevice } from '../../services/deviceService';

const DeviceModal = ({ show, onHide, device, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        device_type: '',
        ip_address: '127.0.0.1',
        port_number: 502,
        slave_id: 1,
        slug: '',
        protocol: 'ModbusTCP', // Default
        is_online: false,
        bacnet_device_instance: 0,
        bacnet_network_number: 0
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (device) {
            setFormData({
                name: device.name || '',
                description: device.description || '',
                device_type: device.device_type || '',
                ip_address: device.ip_address || '127.0.0.1',
                port_number: device.port_number || 502,
                slave_id: device.slave_id || 1,
                slug: device.slug || '',
                protocol: device.protocol || 'ModbusTCP',
                is_online: device.is_online || false,
                bacnet_device_instance: device.bacnet_device_instance || 0,
                bacnet_network_number: device.bacnet_network_number || 0
            });
        } else {
            setFormData({
                name: '',
                description: '',
                device_type: '',
                ip_address: '127.0.0.1',
                port_number: 502,
                slave_id: 1,
                slug: '',
                protocol: 'ModbusTCP',
                is_online: false,
                bacnet_device_instance: 0,
                bacnet_network_number: 0
            });
        }
        setError(null);
    }, [device, show]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            if (device) {
                await updateDevice(device.id, formData);
            } else {
                await createDevice(formData);
            }
            onSave();
            onHide();
        } catch (err) {
            setError('Failed to save device. Please check your inputs.');
            console.error(err);
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>{device ? 'Edit Device' : 'Add Device'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Slug</Form.Label>
                        <Form.Control type="text" name="slug" value={formData.slug} onChange={handleChange} required />
                        <Form.Text className="text-muted">Must be unique.</Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control as="textarea" rows={2} name="description" value={formData.description} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Protocol</Form.Label>
                        <Form.Select name="protocol" value={formData.protocol} onChange={handleChange}>
                            <option value="ModbusTCP">ModbusTCP</option>
                            <option value="ModbusRTU">ModbusRTU</option>
                            <option value="BACnetIP">BACnetIP</option>
                            <option value="BACnetMSTP">BACnetMSTP</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>IP Address</Form.Label>
                        <Form.Control type="text" name="ip_address" value={formData.ip_address} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Port Number</Form.Label>
                        <Form.Control type="number" name="port_number" value={formData.port_number} onChange={handleChange} />
                    </Form.Group>
                    {formData.protocol.startsWith('Modbus') && (
                        <Form.Group className="mb-3">
                            <Form.Label>Slave ID</Form.Label>
                            <Form.Control type="number" name="slave_id" value={formData.slave_id} onChange={handleChange} />
                        </Form.Group>
                    )}

                    {formData.protocol.startsWith('BACnet') && (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label>BACnet Device Instance</Form.Label>
                                <Form.Control type="number" name="bacnet_device_instance" value={formData.bacnet_device_instance} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>BACnet Network Number</Form.Label>
                                <Form.Control type="number" name="bacnet_network_number" value={formData.bacnet_network_number} onChange={handleChange} />
                            </Form.Group>
                        </>
                    )}
                    <Form.Group className="mb-3" controlId="formBasicCheckbox">
                        <Form.Check type="checkbox" label="Is Online" name="is_online" checked={formData.is_online} onChange={handleChange} />
                    </Form.Group>
                    <div className="d-flex justify-content-end">
                        <Button variant="secondary" onClick={onHide} className="me-2">Cancel</Button>
                        <Button variant="primary" type="submit">Save</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default DeviceModal;
