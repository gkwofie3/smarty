import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import { createRegister, updateRegister } from '../../services/deviceService';

const RegisterModal = ({ show, onHide, register, deviceId, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        address: 0,
        read_function_code: '04',
        write_function_code: '06',
        signal_type: 'Digital',
        direction: 'Input',
        data_type: 'Real',
        is_writeable: true,
        is_active: true,
        device: deviceId,
        gain: 1.0,
        offset: 0.0,
        unit: ''
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (register) {
            setFormData({
                name: register.name || '',
                address: register.address || 0,
                read_function_code: register.read_function_code || '04',
                write_function_code: register.write_function_code || '06',
                signal_type: register.signal_type || 'Digital',
                direction: register.direction || 'Input',
                data_type: register.data_type || 'Real',
                is_writeable: register.is_writeable !== undefined ? register.is_writeable : true,
                is_active: register.is_active !== undefined ? register.is_active : true,
                device: register.device || deviceId,
                gain: register.gain || 1.0,
                offset: register.offset || 0.0,
                unit: register.unit || ''
            });
        } else {
            setFormData({
                name: '',
                address: 0,
                read_function_code: '04',
                write_function_code: '06',
                signal_type: 'Digital',
                direction: 'Input',
                data_type: 'Real',
                is_writeable: true,
                is_active: true,
                device: deviceId,
                gain: 1.0,
                offset: 0.0,
                unit: ''
            });
        }
        setError(null);
    }, [register, show, deviceId]);

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
            if (register) {
                await updateRegister(register.id, formData);
            } else {
                await createRegister(formData);
            }
            onSave();
            onHide();
        } catch (err) {
            setError('Failed to save register. Please check your inputs (Name must be unique).');
            console.error(err);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{register ? 'Edit Register' : 'Add Register'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Name</Form.Label>
                                <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Address</Form.Label>
                                <Form.Control type="number" name="address" value={formData.address} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Signal Type</Form.Label>
                                <Form.Select name="signal_type" value={formData.signal_type} onChange={handleChange}>
                                    <option value="Digital">Digital</option>
                                    <option value="Analog">Analog</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Direction</Form.Label>
                                <Form.Select name="direction" value={formData.direction} onChange={handleChange}>
                                    <option value="Input">Input</option>
                                    <option value="Output">Output</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Data Type</Form.Label>
                                <Form.Select name="data_type" value={formData.data_type} onChange={handleChange}>
                                    <option value="Real">Real</option>
                                    <option value="Integer">Integer</option>
                                    <option value="Boolean">Boolean</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Read Function Code</Form.Label>
                                <Form.Select name="read_function_code" value={formData.read_function_code} onChange={handleChange}>
                                    <option value="01">01 (Read Coils)</option>
                                    <option value="02">02 (Read Discrete Inputs)</option>
                                    <option value="03">03 (Read Holding Registers)</option>
                                    <option value="04">04 (Read Input Registers)</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Write Function Code</Form.Label>
                                <Form.Select name="write_function_code" value={formData.write_function_code} onChange={handleChange}>
                                    <option value="05">05 (Write Single Coil)</option>
                                    <option value="06">06 (Write Single Register)</option>
                                    <option value="15">15 (Write Multiple Coils)</option>
                                    <option value="16">16 (Write Multiple Registers)</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Gain</Form.Label>
                                <Form.Control type="number" step="0.01" name="gain" value={formData.gain} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Offset</Form.Label>
                                <Form.Control type="number" step="0.01" name="offset" value={formData.offset} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Check type="checkbox" label="Is Writeable" name="is_writeable" checked={formData.is_writeable} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Check type="checkbox" label="Is Active" name="is_active" checked={formData.is_active} onChange={handleChange} />
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

export default RegisterModal;
