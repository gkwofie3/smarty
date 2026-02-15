import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Button, Navbar, Spinner, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { BsArrowLeft, BsArrowCounterclockwise, BsArrowClockwise, BsSave, BsGrid, BsDash, BsPlus } from 'react-icons/bs';
import api from '../services/api';
import Toolbox from '../components/Toolbox';
import PropertiesPanel from '../components/PropertiesPanel';
import CanvasStage from '../components/CanvasStage';
import Header from '../components/Header';
import ToastNotification from '../components/ToastNotification';
import ElementsList from '../components/ElementsList';

const Editor = () => {
    const { pageId } = useParams();
    const navigate = useNavigate();

    // State
    const [page, setPage] = useState(null);
    const [elements, setElements] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
    const [zoom, setZoom] = useState(0.8);
    const [showGrid, setShowGrid] = useState(true);
    const [toasts, setToasts] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

    // History & Clipboard
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [clipboard, setClipboard] = useState(null);

    const autoSaveTimerRef = useRef(null);
    const initialLoadDone = useRef(false);

    // History Helper
    const updateElements = (newElements, saveHistory = true) => {
        setElements(newElements);
        if (saveHistory) {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newElements);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setElements(history[newIndex]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setElements(history[newIndex]);
        }
    };

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
                const els = res.data.content.elements;
                setElements(els);
                setHistory([els]);
                setHistoryIndex(0);
            } else {
                setHistory([[]]);
                setHistoryIndex(0);
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

        const newElements = [...elements, newElement];
        updateElements(newElements);
        setSelectedIds([newElement.id]);
        addToast('Added', `Added new ${type}.`, 'success');
    };

    const handleElementChange = (updatedElement) => {
        const newElements = elements.map(el => el.id === updatedElement.id ? updatedElement : el);
        updateElements(newElements);
    };

    const handleDelete = () => {
        if (selectedIds.length > 0) {
            const newElements = elements.filter(el => !selectedIds.includes(el.id));
            updateElements(newElements);
            setSelectedIds([]);
            addToast('Deleted', `${selectedIds.length} element(s) deleted.`, 'info');
        }
    };

    const handleDuplicate = () => {
        if (selectedIds.length > 0) {
            const newEls = [];
            selectedIds.forEach(id => {
                const el = elements.find(e => e.id === id);
                if (el) {
                    newEls.push({
                        ...el,
                        id: 'el_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                        x_position: el.x_position + 20,
                        y_position: el.y_position + 20,
                        name: el.name + ' (Copy)'
                    });
                }
            });
            const newElements = [...elements, ...newEls];
            updateElements(newElements);
            setSelectedIds(newEls.map(e => e.id));
            addToast('Duplicated', `${newEls.length} element(s) duplicated.`, 'success');
        }
    };

    const moveSelectedElements = (direction) => {
        if (selectedIds.length === 0) return;

        const newElements = [...elements];
        // Sort selected IDs by their current index to maintain relative order during move
        const selectedIndices = selectedIds
            .map(id => elements.findIndex(el => el.id === id))
            .filter(idx => idx !== -1)
            .sort((a, b) => a - b);

        if (selectedIndices.length === 0) return;

        const movedElements = selectedIndices.map(idx => elements[idx]);

        // Remove elements from list
        selectedIndices.reverse().forEach(idx => {
            newElements.splice(idx, 1);
        });

        switch (direction) {
            case 'front':
                newElements.push(...movedElements);
                break;
            case 'back':
                newElements.unshift(...movedElements);
                break;
            case 'forward':
                {
                    const maxIdx = Math.max(...selectedIndices);
                    const targetIdx = Math.min(newElements.length, maxIdx + 1 - (selectedIndices.length - 1));
                    newElements.splice(targetIdx, 0, ...movedElements);
                }
                break;
            case 'backward':
                {
                    const minIdx = Math.min(...selectedIndices);
                    const targetIdx = Math.max(0, minIdx - 1);
                    newElements.splice(targetIdx, 0, ...movedElements);
                }
                break;
            default:
                break;
        }

        updateElements(newElements);
        addToast('Moved', `${movedElements.length} element(s) moved ${direction}.`, 'info');
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Shift') setIsShiftPressed(true);

            // Delete
            if (e.key === 'Delete') handleDelete();

            // Undo/Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                handleRedo();
            }

            // Copy
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                e.preventDefault();
                if (selectedIds.length > 0) {
                    const els = elements.filter(e => selectedIds.includes(e.id));
                    setClipboard(els);
                    addToast('Copied', `${els.length} element(s) copied.`, 'success');
                }
            }

            // Paste
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                e.preventDefault();
                if (clipboard && Array.isArray(clipboard)) {
                    const newEls = clipboard.map(el => ({
                        ...el,
                        id: 'el_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                        x_position: el.x_position + 20,
                        y_position: el.y_position + 20,
                        name: el.name + ' (Copy)'
                    }));
                    const newElements = [...elements, ...newEls];
                    updateElements(newElements);
                    setSelectedIds(newEls.map(e => e.id));
                    addToast('Pasted', `${newEls.length} element(s) pasted.`, 'success');
                }
            }

            // Duplicate
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                handleDuplicate();
            }

            // Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                savePage();
            }

            // Arrow Keys Movement
            if (selectedIds.length > 0 && (e.key.startsWith('Arrow'))) {
                e.preventDefault();
                const step = e.shiftKey ? 10 : 1;
                const newElements = elements.map(el => {
                    if (selectedIds.includes(el.id)) {
                        let newX = el.x_position;
                        let newY = el.y_position;
                        if (e.key === 'ArrowUp') newY -= step;
                        if (e.key === 'ArrowDown') newY += step;
                        if (e.key === 'ArrowLeft') newX -= step;
                        if (e.key === 'ArrowRight') newX += step;
                        return { ...el, x_position: newX, y_position: newY };
                    }
                    return el;
                });
                updateElements(newElements);
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
    }, [selectedIds, elements, canvasSize, history, historyIndex, clipboard]);

    const selectedElements = elements.filter(el => selectedIds.includes(el.id));

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner animation="border" /></div>;
    }

    return (
        <div className="d-flex flex-column vh-100 overflow-hidden bg-light">
            <Header />
            <ToastNotification toasts={toasts} removeToast={removeToast} />

            {/* Secondary Toolbar */}
            <div className="bg-white border-bottom px-3 py-1 d-flex justify-content-between align-items-center shadow-sm" style={{ zIndex: 10, height: '45px' }}>
                <div className="d-flex align-items-center">
                    <Button variant="outline-secondary" size="sm" onClick={() => navigate('/')} className="me-3 border-0" title="Back to Dashboard">
                        <BsArrowLeft />
                    </Button>
                    <div className="border-start ps-3">
                        <span className="fw-bold small text-muted text-uppercase d-block" style={{ fontSize: '10px', lineHeight: 1 }}>Editing Page</span>
                        <span className="h6 mb-0">{page ? page.name : 'Untitled'}</span>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <div className="me-3 border-end pe-3">
                        <Button
                            variant="light"
                            size="sm"
                            onClick={handleUndo}
                            disabled={historyIndex <= 0}
                            title="Undo (Ctrl+Z)"
                            className="me-1"
                        >
                            <BsArrowCounterclockwise />
                        </Button>
                        <Button
                            variant="light"
                            size="sm"
                            onClick={handleRedo}
                            disabled={historyIndex >= history.length - 1}
                            title="Redo (Ctrl+Y)"
                        >
                            <BsArrowClockwise />
                        </Button>
                    </div>
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
                        {saving ? <><Spinner animation="border" size="sm" /> Saving...</> : <><BsSave className="me-1" /> Save</>}
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
                        <BsGrid />
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} title="Zoom Out">
                        <BsDash />
                    </Button>
                    <span className="small text-muted" style={{ minWidth: '40px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
                    <Button variant="outline-secondary" size="sm" onClick={() => setZoom(z => Math.min(3, z + 0.1))} title="Zoom In">
                        <BsPlus />
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
                        selectedIds={selectedIds}
                        onSelect={(ids) => setSelectedIds(ids)}
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
                            selectedIds={selectedIds}
                            onSelect={(ids) => setSelectedIds(ids)}
                        />
                    </div>
                    <div className="flex-grow-1" style={{ height: '70%', overflowY: 'auto' }}>
                        {selectedIds.length > 0 ? (
                            <PropertiesPanel
                                elements={selectedElements}
                                onChange={handleElementChange}
                                onDelete={handleDelete}
                                onMoveToFront={() => moveSelectedElements('front')}
                                onMoveToBack={() => moveSelectedElements('back')}
                                onMoveForward={() => moveSelectedElements('forward')}
                                onMoveBackward={() => moveSelectedElements('backward')}
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

export default Editor;
