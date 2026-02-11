
import React from 'react';
import { Form, Card, Accordion, Button } from 'react-bootstrap';

const PropertiesPanel = ({ selectedId, nodes, setNodes, layoutSize, setLayoutSize, onDelete }) => {
    const selectedNode = nodes.find(n => n.id === selectedId);

    if (!selectedNode) {
        return (
            <div style={{ width: '250px', background: '#f8f9fa', borderLeft: '1px solid #dee2e6', padding: '10px' }}>
                <h6 className="mb-3">Program Layout</h6>
                <Form.Group className="mb-2">
                    <Form.Label>Width (px)</Form.Label>
                    <Form.Control
                        type="number"
                        size="sm"
                        value={layoutSize?.width || 1920}
                        onChange={(e) => setLayoutSize({ ...layoutSize, width: parseInt(e.target.value) || 0 })}
                    />
                </Form.Group>
                <Form.Group className="mb-2">
                    <Form.Label>Height (px)</Form.Label>
                    <Form.Control
                        type="number"
                        size="sm"
                        value={layoutSize?.height || 1080}
                        onChange={(e) => setLayoutSize({ ...layoutSize, height: parseInt(e.target.value) || 0 })}
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Background</Form.Label>
                    <Form.Control
                        type="color"
                        size="sm"
                        value={layoutSize?.backgroundColor || '#ffffff'}
                        onChange={(e) => setLayoutSize({ ...layoutSize, backgroundColor: e.target.value })}
                    />
                </Form.Group>
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

    // Check if variable inputs allowed (Logic gates, Math, etc.)
    const isVariableInput = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR', 'ADD', 'MUL', 'MUX', 'ENCODER', 'DECODER', 'DIG_TO_BIN', 'SPLITTER'].includes(selectedNode.type);
    const isVariableOutput = ['DEMUX', 'SPLITTER', 'DECODER', 'ENCODER', 'BIN_TO_DIG', 'MUX'].includes(selectedNode.type);

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
                                        onChange={(e) => handleChange('width', parseInt(e.target.value) || 50)}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Height</Form.Label>
                                    <Form.Control
                                        type="number"
                                        size="sm"
                                        value={Math.round(selectedNode.height || 0)}
                                        onChange={(e) => handleChange('height', parseInt(e.target.value) || 50)}
                                    />
                                </Form.Group>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>

                    {/* Configuration */}
                    <Accordion defaultActiveKey="0" className="mb-2">
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>Configuration</Accordion.Header>
                            <Accordion.Body className="p-2">
                                {isVariableInput && (
                                    <Form.Group className="mb-2">
                                        <Form.Label>Inputs Count</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min={0}
                                            max={64}
                                            size="sm"
                                            value={selectedNode.inputs || 0}
                                            onChange={(e) => handleChange('inputs', Math.max(0, parseInt(e.target.value) || 0))}
                                        />
                                    </Form.Group>
                                )}
                                {isVariableOutput && (
                                    <Form.Group className="mb-2">
                                        <Form.Label>Outputs Count</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min={0}
                                            max={64}
                                            size="sm"
                                            value={selectedNode.outputs || 0}
                                            onChange={(e) => handleChange('outputs', Math.max(0, parseInt(e.target.value) || 0))}
                                        />
                                    </Form.Group>
                                )}
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>

                    {/* Block Specific Params */}
                    {selectedNode.params && Object.keys(selectedNode.params).length > 1 && (
                        <div className="mt-2">
                            <p className="small fw-bold mb-1">Parameters</p>
                            {Object.keys(selectedNode.params).map(key => {
                                if (key === 'color') return null; // Already handled
                                return (
                                    <Form.Group className="mb-2" key={key}>
                                        <Form.Label className="small">{key.toUpperCase()}</Form.Label>
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            value={selectedNode.params[key]}
                                            onChange={(e) => setNodes(nodes.map(n => n.id === selectedId ? { ...n, params: { ...n.params, [key]: e.target.value } } : n))}
                                        />
                                    </Form.Group>
                                );
                            })}
                        </div>
                    )}
                </Card.Body>
                <Card.Footer className="text-center">
                    <Button variant="danger" size="sm" onClick={onDelete}>Delete Block</Button>
                </Card.Footer>
            </Card>
        </div>
    );
};

export default PropertiesPanel;
