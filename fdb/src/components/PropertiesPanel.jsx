import React from 'react';
import { Form, Card } from 'react-bootstrap';

const PropertiesPanel = ({ selectedId, nodes, setNodes }) => {
    const selectedNode = nodes.find(n => n.id === selectedId);

    if (!selectedNode) {
        return (
            <div style={{ width: '250px', background: '#f8f9fa', borderLeft: '1px solid #dee2e6', padding: '10px' }}>
                <p className="text-muted text-center mt-3">Select a block to edit properties</p>
            </div>
        );
    }

    const handleChange = (key, value) => {
        setNodes(nodes.map(n => n.id === selectedId ? { ...n, params: { ...n.params, [key]: value } } : n));
    };

    return (
        <div style={{ width: '250px', background: '#f8f9fa', borderLeft: '1px solid #dee2e6', padding: '10px', overflowY: 'auto' }}>
            <h6 className="mb-3">Properties</h6>
            <Card className="mb-3">
                <Card.Body>
                    <Card.Title style={{ fontSize: '1rem' }}>{selectedNode.type}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">{selectedNode.id.substring(0, 8)}...</Card.Subtitle>

                    <Form.Group className="mb-2">
                        <Form.Label>Label</Form.Label>
                        <Form.Control
                            type="text"
                            size="sm"
                            value={selectedNode.label || ''}
                            onChange={(e) => setNodes(nodes.map(n => n.id === selectedId ? { ...n, label: e.target.value } : n))}
                        />
                    </Form.Group>

                    {selectedNode.params && Object.keys(selectedNode.params).map(key => (
                        <Form.Group className="mb-2" key={key}>
                            <Form.Label>{key.toUpperCase()}</Form.Label>
                            <Form.Control
                                type="text"
                                size="sm"
                                value={selectedNode.params[key]}
                                onChange={(e) => handleChange(key, e.target.value)}
                            />
                        </Form.Group>
                    ))}
                </Card.Body>
            </Card>
        </div>
    );
};

export default PropertiesPanel;
