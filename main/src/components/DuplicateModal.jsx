import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table } from 'react-bootstrap';

const DuplicateModal = ({ show, onHide, onDuplicate, itemName, hasChildren }) => {
    const [count, setCount] = useState(1);
    const [includeChildren, setIncludeChildren] = useState(false);
    const [names, setNames] = useState([]);

    useEffect(() => {
        if (show) {
            setCount(1);
            setIncludeChildren(false);
            setNames([`${itemName}_copy_1`]);
        }
    }, [show, itemName]);

    const handleCountChange = (e) => {
        const newCount = parseInt(e.target.value) || 1;
        setCount(newCount);
        const newNames = [];
        for (let i = 0; i < newCount; i++) {
            newNames.push(names[i] || `${itemName}_copy_${i + 1}`);
        }
        setNames(newNames);
    };

    const handleNameChange = (index, value) => {
        const newNames = [...names];
        newNames[index] = value;
        setNames(newNames);
    };

    const handleDuplicate = () => {
        onDuplicate(count, includeChildren, names);
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Duplicate {itemName}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Number of Copies</Form.Label>
                        <Form.Control type="number" min="1" value={count} onChange={handleCountChange} />
                    </Form.Group>

                    {hasChildren && (
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Include Children?"
                                checked={includeChildren}
                                onChange={(e) => setIncludeChildren(e.target.checked)}
                            />
                        </Form.Group>
                    )}

                    <Form.Label>Names</Form.Label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {names.map((name, index) => (
                            <Form.Group key={index} className="mb-2">
                                <Form.Control
                                    type="text"
                                    value={name}
                                    onChange={(e) => handleNameChange(index, e.target.value)}
                                />
                            </Form.Group>
                        ))}
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cancel</Button>
                <Button variant="primary" onClick={handleDuplicate}>Duplicate</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DuplicateModal;
