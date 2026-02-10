import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import { createPoint, updatePoint } from '../../services/pointService';
// We might need to fetch devices/registers to link them? 
// For now, let's just stick to basic Point properties and assume Register linking might ideally happen via a dropdown 
// but that requires fetching all registers. Let's start basic.

const PointModal = ({ show, onHide, point, groupId, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        point_group: groupId,
        point_type: 'REGISTER',
        data_type: 'Real',
        direction: 'Input',
        unit: '',
        is_active: true,
        register: null // This should ideally be a dropdown
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (point) {
            setFormData({
                name: point.name || '',
                description: point.description || '',
                point_group: point.point_group || groupId,
                point_type: point.point_type || 'REGISTER',
                data_type: point.data_type || 'Real',
                direction: point.direction || 'Input',
                unit: point.unit || '',
                is_active: point.is_active !== undefined ? point.is_active : true,
                register: point.register || null
            });
        } else {
            setFormData({
                name: '',
                description: '',
                point_group: groupId,
                point_type: 'REGISTER',
                data_type: 'Real',
                direction: 'Input',
                unit: '',
                is_active: true,
                register: null
            });
        }
        setError(null);
    }, [point, show, groupId]);

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
            if (point) {
                await updatePoint(point.id, formData);
            } else {
                await createPoint(formData);
            }
            onSave();
            onHide();
        } catch (err) {
            setError('Failed to save point. Name must be unique within the group.');
            console.error(err);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{point ? 'Edit Point' : 'Add Point'}</Modal.Title>
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
                                <Form.Label>Point Type</Form.Label>
                                <Form.Select name="point_type" value={formData.point_type} onChange={handleChange}>
                                    <option value="REGISTER">Register</option>
                                    <option value="VIRTUAL">Virtual</option>
                                    <option value="CALCULATED">Calculated</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control as="textarea" rows={2} name="description" value={formData.description} onChange={handleChange} />
                    </Form.Group>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Data Type</Form.Label>
                                <Form.Select name="data_type" value={formData.data_type} onChange={handleChange}>
                                    <option value="Real">Real</option>
                                    <option value="Integer">Integer</option>
                                    <option value="Boolean">Boolean</option>
                                    <option value="String">String</option>
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
                                <Form.Label>Unit</Form.Label>
                                <Form.Control type="text" name="unit" value={formData.unit} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                    </Row>
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

export default PointModal;
