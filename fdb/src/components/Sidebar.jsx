import React from 'react';
import { Accordion } from 'react-bootstrap';
import { BLOCK_CATEGORIES } from '../constants';

const Sidebar = ({ onDragStart }) => {
    return (
        <div style={{ width: '250px', background: '#e9ecef', borderRight: '1px solid #dee2e6', overflowY: 'auto', padding: '10px' }}>
            <h6 className="text-center mb-3">Toolbox</h6>
            <Accordion defaultActiveKey="0">
                {Object.keys(BLOCK_CATEGORIES).map((category, index) => (
                    <Accordion.Item eventKey={String(index)} key={category}>
                        <Accordion.Header>{category}</Accordion.Header>
                        <Accordion.Body className="p-2">
                            {BLOCK_CATEGORIES[category].map((block) => (
                                <div
                                    key={block.type}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, block)}
                                    className="d-flex align-items-center mb-2 p-2 bg-white border rounded"
                                    style={{ cursor: 'grab', userSelect: 'none' }}
                                >
                                    <div style={{ width: '30px', height: '30px', background: '#0d6efd', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '4px', marginRight: '10px', fontSize: '10px' }}>
                                        {block.type.substring(0, 3)}
                                    </div>
                                    <span style={{ fontSize: '14px' }}>{block.label}</span>
                                </div>
                            ))}
                        </Accordion.Body>
                    </Accordion.Item>
                ))}
            </Accordion>
        </div>
    );
};

export default Sidebar;
