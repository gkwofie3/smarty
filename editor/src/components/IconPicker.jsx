import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Pagination } from 'react-bootstrap';
import { ICON_LIST } from '../constants/icon_lists';
import { getIconComponent } from '../utils/IconLoader';

const ITEMS_PER_PAGE = 54; // 6x9 grid

const IconPicker = ({ show, onHide, onSelect, currentSet, currentIcon }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSet, setActiveSet] = useState(currentSet || 'Font Awesome');
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredIcons, setFilteredIcons] = useState([]);

    useEffect(() => {
        if (show) {
            // Reset state on open if needed, or keep previous/current
            setActiveSet(currentSet || 'Font Awesome');
            setSearchTerm('');
            setCurrentPage(1);
        }
    }, [show, currentSet]);

    useEffect(() => {
        const allIcons = ICON_LIST[activeSet] || [];
        const filtered = allIcons.filter(icon =>
            icon.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredIcons(filtered);
        setCurrentPage(1); // Reset to page 1 on search
    }, [activeSet, searchTerm]);

    const totalPages = Math.ceil(filteredIcons.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentIcons = filteredIcons.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleSetChange = (set) => {
        setActiveSet(set);
        setSearchTerm('');
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Select Icon</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                <div className="d-flex gap-2 mb-3">
                    <Form.Select
                        value={activeSet}
                        onChange={(e) => handleSetChange(e.target.value)}
                        style={{ width: '200px' }}
                    >
                        {Object.keys(ICON_LIST).map(set => (
                            <option key={set} value={set}>{set}</option>
                        ))}
                    </Form.Select>
                    <Form.Control
                        type="text"
                        placeholder="Search icons..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-grow-1 overflow-auto" style={{ maxHeight: '400px' }}>
                    <Row className="g-2">
                        {currentIcons.map(iconName => {
                            const IconComp = getIconComponent(activeSet, iconName);
                            const isSelected = iconName === currentIcon && activeSet === currentSet;
                            return (
                                <Col xs={2} sm={2} md={2} key={iconName}>
                                    <div
                                        className={`p-2 border rounded text-center cursor-pointer ${isSelected ? 'bg-primary text-white' : 'hover-bg-light'}`}
                                        style={{ cursor: 'pointer', height: '100%', minHeight: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                                        onClick={() => {
                                            onSelect(activeSet, iconName);
                                            onHide();
                                        }}
                                        title={iconName}
                                    >
                                        <div className="mb-1" style={{ fontSize: '1.5rem' }}>
                                            {IconComp ? <IconComp /> : '?'}
                                        </div>
                                        <div className="small text-truncate w-100" style={{ fontSize: '0.7rem' }}>
                                            {iconName}
                                        </div>
                                    </div>
                                </Col>
                            );
                        })}
                        {currentIcons.length === 0 && (
                            <div className="text-center text-muted p-5">No icons found.</div>
                        )}
                    </Row>
                </div>

                {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3">
                        <Pagination size="sm">
                            <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                            <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />

                            <Pagination.Item disabled>{`${currentPage} / ${totalPages}`}</Pagination.Item>

                            <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
                            <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                        </Pagination>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default IconPicker;
