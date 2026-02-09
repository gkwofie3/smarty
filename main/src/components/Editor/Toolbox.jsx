import React, { useState } from 'react';
import { Form, Accordion, Button } from 'react-bootstrap';
import { ELEMENT_SCHEMA } from '../../constants/schema';

const Toolbox = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const categories = {
        'Shapes': ['Line', 'Rectangle', 'Ellipse/Circle', 'Polygon', 'Arc'],
        'Text': ['Static Text Label', 'Dynamic Text (Variable Text)'],
        'Media': ['Static Image', 'Animated Image', 'Video Player', 'Web View'],
        'Controls': ['Push Button', 'Toggle Button/Switch', 'Slider', 'Knob'],
        'Gauges & Charts': ['Analog Gauge', 'Bar Gauge/Graph', 'Trend Chart/Graph'],
        'Lists & Tables': ['Data Table', 'Alarm List/Table'],
        'Others': ['Indicator Light/LED', 'Symbol/Component', 'Group', 'Hyperlink/Goto Tag', 'Snippet']
    };

    const handleDragStart = (e, type) => {
        e.dataTransfer.setData('elementType', type);
    };

    const filteredElements = ELEMENT_SCHEMA.elements.filter(el =>
        el.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="d-flex flex-column h-100 bg-white border-end">
            <div className="p-3 border-bottom bg-light">
                <h6 className="mb-2 fw-bold text-uppercase text-secondary" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Toolbox</h6>
                <Form.Control
                    type="text"
                    placeholder="Search components..."
                    size="sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white"
                />
            </div>

            <div className="flex-grow-1 overflow-auto custom-scrollbar">
                {searchTerm ? (
                    <div className="p-2 d-grid gap-2">
                        {filteredElements.map((el, idx) => (
                            <div
                                key={idx}
                                className="toolbox-item p-2 border rounded bg-light small shadow-sm user-select-none"
                                draggable
                                onDragStart={(e) => handleDragStart(e, el.name)}
                                style={{ cursor: 'grab' }}
                            >
                                <i className="bi bi-box me-2"></i>{el.name}
                            </div>
                        ))}
                    </div>
                ) : (
                    <Accordion defaultActiveKey="0" flush alwaysOpen>
                        {Object.entries(categories).map(([category, items], idx) => (
                            <Accordion.Item eventKey={idx.toString()} key={category} className="border-0">
                                <Accordion.Header className="small py-1">{category}</Accordion.Header>
                                <Accordion.Body className="p-2 bg-light">
                                    <div className="d-grid gap-2">
                                        {items.map(itemName => (
                                            <div
                                                key={itemName}
                                                className="toolbox-item p-2 border rounded bg-white small shadow-sm d-flex align-items-center user-select-none"
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, itemName)}
                                                style={{ cursor: 'grab', transition: 'all 0.2s' }}
                                                title={itemName}
                                            >
                                                <i className="bi bi-grip-vertical text-muted me-2"></i>
                                                <span className="text-truncate">{itemName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                )}
            </div>
            <style>{`
                .toolbox-item:hover {
                    background-color: #e9ecef !important;
                    border-color: #dee2e6 !important;
                    transform: translateX(2px);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #dee2e6;
                    border-radius: 3px;
                }
            `}</style>
        </div>
    );
};

export default Toolbox;
