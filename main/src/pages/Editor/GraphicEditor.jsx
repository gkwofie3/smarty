import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Button, Navbar, Spinner, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Toolbox from '../../components/Editor/Toolbox';
import PropertiesPanel from '../../components/Editor/PropertiesPanel';
import CanvasStage from '../../components/Editor/CanvasStage';
import ToastNotification from '../../components/Editor/ToastNotification';
import ElementsList from '../../components/Editor/ElementsList';

const GraphicEditor = () => {
    const { pageId } = useParams();
    const navigate = useNavigate();

    // State
    const [page, setPage] = useState(null);
    const [elements, setElements] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
    const [zoom, setZoom] = useState(0.8);
    const [showGrid, setShowGrid] = useState(true);
    const [toasts, setToasts] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

    const autoSaveTimerRef = useRef(null);
    const initialLoadDone = useRef(false);

    // Load Page Data
    useEffect(() => {
        loadPage();
    }, [pageId]);

    const loadPage = async () => {
        try {
            setLoading(true);
            const res = await api.get(`pages/${pageId}/`);
            setPage(res.data);
            if (res.data.content && res.data.content.elements) {
                setElements(res.data.content.elements);
            }
            if (res.data.content && res.data.content.layout) {
                setCanvasSize(res.data.content.layout);
            }
            setLoading(false);
            initialLoadDone.current = true;
        } catch (error) {
            console.error("Error loading page:", error);
            addToast('Error', 'Failed to load page data.', 'error');
            setLoading(false);
        }
    };

    // Initial Zoom Calculation
    useEffect(() => {
        if (!initialLoadDone.current) return;
        const availableWidth = window.innerWidth - 260 - 320 - 80;
        const initialZoom = Math.min(1, availableWidth / canvasSize.width);
        setZoom(Math.max(0.1, initialZoom));
    }, [canvasSize, loading]);

    // Auto-Save Logic
    useEffect(() => {
        if (!initialLoadDone.current || !autoSaveEnabled) return;

        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

        autoSaveTimerRef.current = setTimeout(() => {
            savePage(true); // silent auto-save
        }, 3000);

        return () => clearTimeout(autoSaveTimerRef.current);
    }, [elements, canvasSize, autoSaveEnabled]);

    const savePage = async (silent = false) => {
        if (!page) return;
        setSaving(true);
        try {
            const content = {
                elements: elements,
                layout: canvasSize
            };
            await api.patch(`pages/${pageId}/`, { content });
            setSaving(false);
            if (!silent) addToast('Success', 'Page saved successfully.', 'success');
        } catch (error) {
            console.error("Error saving:", error);
            addToast('Error', 'Failed to save.', 'error');
            setSaving(false);
        }
    };

    const addToast = (title, message, variant = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, title, message, variant }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const handleDropElement = (type, x, y) => {
        const newElement = {
            id: 'el_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            type: type,
            name: `${type} ${elements.filter(e => e.type === type).length + 1}`,
            x_position: Math.round(x),
            y_position: Math.round(y),
            width: 150,
            height: 100,
            rotation_angle: 0,
            opacity: 1,
            z_index: elements.length + 1,
            text_content: type.includes('Text') ? 'New Text' : undefined,
            background_color: type.includes('Button') ? '#e0e0e0' : 'transparent',
            fill_color: type === 'Rectangle' ? '#ffffff' : type === 'Ellipse/Circle' ? '#ffffff' : undefined,
            border_color: '#000000',
            border_width: 1,
            font_family: 'Arial',
            font_size: 16,
            font_weight: 'normal',
            font_style: 'normal'
        };

        setElements(prev => [...prev, newElement]);
        setSelectedId(newElement.id);
        addToast('Added', `Added new ${type}.`, 'success');
    };

    const handleElementChange = (updatedElement) => {
        setElements(prev => prev.map(el => el.id === updatedElement.id ? updatedElement : el));
    };

    const handleDelete = () => {
        if (selectedId) {
            setElements(prev => prev.filter(el => el.id !== selectedId));
            setSelectedId(null);
            addToast('Deleted', 'Element deleted.', 'info');
        }
    };

    const handleDuplicate = () => {
        if (selectedId) {
            const el = elements.find(e => e.id === selectedId);
            if (el) {
                const newEl = {
                    ...el,
                    id: 'el_' + Date.now(),
                    x_position: el.x_position + 20,
                    y_position: el.y_position + 20,
                    name: el.name + ' (Copy)'
                };
                setElements(prev => [...prev, newEl]);
                setSelectedId(newEl.id);
                addToast('Duplicated', 'Element duplicated.', 'success');
            }
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Shift') setIsShiftPressed(true);

            if (e.key === 'Delete') handleDelete();
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                handleDuplicate();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                savePage();
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Shift') setIsShiftPressed(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedId, elements, canvasSize]);

    const selectedElement = elements.find(el => el.id === selectedId);

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner animation="border" /></div>;
    }

    return (
        <div className="d-flex flex-column vh-100 overflow-hidden bg-light">
            <ToastNotification toasts={toasts} removeToast={removeToast} />

            {/* Header */}
            <div className="bg-white border-bottom px-3 py-2 d-flex justify-content-between align-items-center shadow-sm" style={{ zIndex: 10 }}>
                <div className="d-flex align-items-center">
                    <Button variant="outline-secondary" size="sm" onClick={() => navigate('/modules')} className="me-3 border-0">
                        <i className="bi bi-arrow-left"></i>
                    </Button>
                    <div>
                        <div className="fw-bold small text-uppercase text-muted">Page Editor</div>
                        <div className="h6 mb-0">{page ? page.name : 'Untitled'}</div>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <Form.Check
                        type="switch"
                        id="auto-save-switch"
                        label="Auto Save"
                        checked={autoSaveEnabled}
                        onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                        className="small me-3 mb-0"
                    />

                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => savePage(false)}
                        disabled={saving}
                        className="me-3"
                    >
                        {saving ? <><Spinner animation="border" size="sm" /> Saving...</> : <><i className="bi bi-save"></i> Save</>}
                    </Button>

                    <div className="border-start me-2" style={{ height: '20px' }}></div>

                    <InputGroup size="sm" style={{ width: '150px' }}>
                        <InputGroup.Text className="bg-light">W</InputGroup.Text>
                        <Form.Control
                            type="number"
                            value={canvasSize.width}
                            onChange={(e) => setCanvasSize({ ...canvasSize, width: parseInt(e.target.value) || 100 })}
                        />
                        <InputGroup.Text className="bg-light">H</InputGroup.Text>
                        <Form.Control
                            type="number"
                            value={canvasSize.height}
                            onChange={(e) => setCanvasSize({ ...canvasSize, height: parseInt(e.target.value) || 100 })}
                        />
                    </InputGroup>

                    <Button variant={showGrid ? "secondary" : "outline-secondary"} size="sm" onClick={() => setShowGrid(!showGrid)} title="Toggle Grid" className="ms-2">
                        <i className="bi bi-grid-3x3"></i>
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} title="Zoom Out">
                        <i className="bi bi-dash"></i>
                    </Button>
                    <span className="small text-muted" style={{ minWidth: '40px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
                    <Button variant="outline-secondary" size="sm" onClick={() => setZoom(z => Math.min(3, z + 0.1))} title="Zoom In">
                        <i className="bi bi-plus"></i>
                    </Button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="d-flex flex-grow-1 overflow-hidden">
                {/* TOOLBOX */}
                <div style={{ width: '260px', minWidth: '260px', zIndex: 5 }}>
                    <Toolbox />
                </div>

                {/* CANVAS */}
                <div className="flex-grow-1 position-relative overflow-hidden bg-secondary bg-opacity-10">
                    <CanvasStage
                        elements={elements}
                        selectedElementId={selectedId}
                        onSelect={setSelectedId}
                        onChange={handleElementChange}
                        onDropElement={handleDropElement}
                        zoom={zoom}
                        setZoom={setZoom}
                        canvasSize={canvasSize}
                        showGrid={showGrid}
                        isShiftPressed={isShiftPressed}
                    />
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="bg-white border-start d-flex flex-column" style={{ width: '320px', minWidth: '320px', zIndex: 5 }}>
                    <div style={{ height: '30%', overflowY: 'auto', borderBottom: '1px solid #dee2e6' }}>
                        <ElementsList
                            elements={elements}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                        />
                    </div>
                    <div className="flex-grow-1" style={{ height: '70%', overflowY: 'auto' }}>
                        {selectedElement ? (
                            <PropertiesPanel
                                element={selectedElement}
                                onChange={handleElementChange}
                                onDelete={handleDelete}
                            />
                        ) : (
                            <div className="p-3">
                                <h6 className="border-bottom pb-2 mb-3">Page Properties</h6>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small">Page Name</Form.Label>
                                    <Form.Control size="sm" value={page?.name || ''} readOnly />
                                </Form.Group>
                                <Row className="mb-3">
                                    <Col>
                                        <Form.Label className="small">Width</Form.Label>
                                        <Form.Control
                                            size="sm"
                                            type="number"
                                            value={canvasSize.width}
                                            onChange={(e) => setCanvasSize({ ...canvasSize, width: parseInt(e.target.value) || 100 })}
                                        />
                                    </Col>
                                    <Col>
                                        <Form.Label className="small">Height</Form.Label>
                                        <Form.Control
                                            size="sm"
                                            type="number"
                                            value={canvasSize.height}
                                            onChange={(e) => setCanvasSize({ ...canvasSize, height: parseInt(e.target.value) || 100 })}
                                        />
                                    </Col>
                                </Row>
                                <div className="alert alert-info small mt-4">
                                    Select an element from the list or canvas to edit its properties.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GraphicEditor;
