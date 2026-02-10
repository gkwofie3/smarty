import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { createPointGroup, updatePointGroup } from '../../services/pointService';

const PointGroupModal = ({ show, onHide, group, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        slug: '',
        is_active: true
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (group) {
            setFormData({
                name: group.name || '',
                description: group.description || '',
                slug: group.slug || '',
                is_active: group.is_active !== undefined ? group.is_active : true
            });
        } else {
            setFormData({
                name: '',
                description: '',
                slug: '',
                is_active: true
            });
        }
        setError(null);
    }, [group, show]);

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
            if (group) {
                await updatePointGroup(group.id, formData);
            } else {
                await createPointGroup(formData);
            }
            onSave();
            onHide();
        } catch (err) {
            setError('Failed to save point group.');
            console.error(err);
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>{group ? 'Edit Point Group' : 'Add Point Group'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control as="textarea" rows={2} name="description" value={formData.description} onChange={handleChange} />
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

export default PointGroupModal;
