
import React from 'react';
import { Form, Card, Accordion } from 'react-bootstrap';

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
        // Handle params separately
        if (selectedNode.params && Object.keys(selectedNode.params).includes(key)) {
            setNodes(nodes.map(n => n.id === selectedId ? { ...n, params: { ...n.params, [key]: value } } : n));
        } else {
            // Handle top-level props
            setNodes(nodes.map(n => n.id === selectedId ? { ...n, [key]: value } : n));
        }
    };

    // Check if variable inputs allowed (Logic gates, Math)
    const isVariableInput = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR', 'ADD', 'MUL'].includes(selectedNode.type);

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
                            onChange={(e) => handleChange('label', e.target.value)}
                        />
                    </Form.Group>

                    {/* Appearance */}
                    <Accordion defaultActiveKey="0" className="mb-2">
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>Appearance</Accordion.Header>
                            <Accordion.Body className="p-2">
                                <Form.Group className="mb-2">
                                    <Form.Label>Color</Form.Label>
                                    <Form.Control
                                        type="color"
                                        size="sm"
                                        value={selectedNode.params?.color || '#ffffff'}
                                        onChange={(e) => setNodes(nodes.map(n => n.id === selectedId ? { ...n, params: { ...n.params, color: e.target.value } } : n))}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Width</Form.Label>
                                    <Form.Control
                                        type="number"
                                        size="sm"
                                        value={Math.round(selectedNode.width || 100)}
                                        onChange={(e) => handleChange('width', parseInt(e.target.value))}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Height</Form.Label>
                                    <Form.Control
                                        type="number"
                                        size="sm"
                                        value={Math.round(selectedNode.height || 0)}
                                        onChange={(e) => handleChange('height', parseInt(e.target.value))}
                                    />
                                </Form.Group>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>

                    {/* Inputs Config */}
                    {isVariableInput && (
                        <Form.Group className="mb-2">
                            <Form.Label>Inputs Count</Form.Label>
                            <Form.Control
                                type="number"
                                min={2}
                                max={20}
                                size="sm"
                                value={selectedNode.inputs}
                                onChange={(e) => handleChange('inputs', parseInt(e.target.value))}
                            />
                        </Form.Group>
                    )}

                    {/* Block Specific Params */}
                    {selectedNode.params && Object.keys(selectedNode.params).map(key => {
                        if (key === 'color') return null; // Already handled
                        return (
                            <Form.Group className="mb-2" key={key}>
                                <Form.Label>{key.toUpperCase()}</Form.Label>
                                <Form.Control
                                    type="text"
                                    size="sm"
                                    value={selectedNode.params[key]}
                                    onChange={(e) => setNodes(nodes.map(n => n.id === selectedId ? { ...n, params: { ...n.params, [key]: e.target.value } } : n))}
                                />
                            </Form.Group>
                        );
                    })}
                </Card.Body>
            </Card>
        </div>
    );
};

export default PropertiesPanel;
