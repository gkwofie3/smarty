import React from 'react';
import { Form, Button, InputGroup, Row, Col, Spinner, Modal } from 'react-bootstrap';
import { BiTrash, BiUpload, BiChevronUp, BiChevronDown, BiEdit } from 'react-icons/bi';
import api from '../services/api';
import { ICON_LIST } from '../constants/icon_lists';
import IconPicker from './IconPicker';
import { GOOGLE_FONTS } from '../constants/fonts';
import { loadGoogleFont } from '../utils/FontLoader';

import { ELEMENT_SCHEMA } from '../constants/schema';

const PropertiesPanel = ({ element, onChange, onDelete }) => {
    const [uploading, setUploading] = React.useState(false);
    const [showIconPicker, setShowIconPicker] = React.useState(false);
    const [pages, setPages] = React.useState([]);
    const [points, setPoints] = React.useState([]);


    // Bar Chart Modal State
    const [showBarModal, setShowBarModal] = React.useState(false);
    const [editingBarIndex, setEditingBarIndex] = React.useState(null);
    const [editingBarData, setEditingBarData] = React.useState({});

    // Pie/Donut Slice Modal State
    const [showSliceModal, setShowSliceModal] = React.useState(false);
    const [editingSliceIndex, setEditingSliceIndex] = React.useState(null);
    const [editingSliceData, setEditingSliceData] = React.useState({});

    // Line Chart Point Modal State
    const [showPointModal, setShowPointModal] = React.useState(false);
    const [editingPointIndex, setEditingPointIndex] = React.useState(null);
    const [editingPointData, setEditingPointData] = React.useState({});

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [pagesRes, pointsRes] = await Promise.all([
                    api.get('pages/'),
                    api.get('points/')
                ]);
                setPages(pagesRes.data);
                setPoints(pointsRes.data);
            } catch (err) {
                console.error("Failed to fetch data:", err);
            }
        };
        fetchData();
    }, []);

    if (!element) return <div className="p-3 text-muted">Select an element</div>;

    const schemaInfo = ELEMENT_SCHEMA.elements.find(e => e.name === element.type);
    let propertiesList = schemaInfo ? [...schemaInfo.properties] : Object.keys(element);

    // Special handling for Icon: Hide width/height, show size
    if (element.type === 'Icon') {
        propertiesList = propertiesList.filter(p => p !== 'width' && p !== 'height');
    }

    const handleChange = (key, value) => {
        onChange({ ...element, [key]: value });
    };

    // Helper: Font Families
    // Helper: Font Families - Merge Web Safe with Google Fonts
    const fontFamilies = [
        'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
        'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
        'Arial Black', 'Impact', 'Lucida Sans Unicode', 'Tahoma',
        ...GOOGLE_FONTS
    ];

    // Helper: Font Weights
    const fontWeights = ['normal', 'bold', 'lighter', 'bolder', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

    const renderInput = (prop) => {
        // IO Point Selection for current_value or data_binding_source
        if (prop === 'current_value' || prop === 'data_binding_source') {
            return (
                <InputGroup size="sm">
                    <Form.Select
                        value={element[prop] || ''}
                        onChange={(e) => handleChange(prop, e.target.value)}
                    >
                        <option value="">-- Select IO Point --</option>
                        {points.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                        ))}
                    </Form.Select>
                    {/* Optional: Allow manual input if basic value? No, stick to select as requested. */}
                    {/* For current_value, maybe we want a fallback input if not an ID? 
                         But handling mixed type is messy. We'll stick to Select. 
                     */}
                </InputGroup>
            );
        }

        // Explicitly handle Axis Labels as Text Inputs (Override any boolean inference)
        if (prop === 'x_axis_label' || prop === 'y_axis_label') {
            return (
                <Form.Control
                    type="text"
                    size="sm"
                    value={element[prop] || ''}
                    onChange={(e) => handleChange(prop, e.target.value)}
                />
            );
        }

        // Handle Font Properties Specifically
        if (prop.includes('font_family')) {
            return (
                <Form.Select
                    size="sm"
                    value={element[prop] || 'Arial'}
                    onChange={(e) => {
                        const newFont = e.target.value;
                        loadGoogleFont(newFont);
                        handleChange(prop, newFont);
                    }}
                    style={{ fontFamily: element[prop] || 'Arial' }}
                >
                    {fontFamilies.map(f => (
                        <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                    ))}
                </Form.Select>
            );
        }
        if (prop.includes('font_weight')) {
            return (
                <Form.Select
                    size="sm"
                    value={element[prop] || 'normal'}
                    onChange={(e) => handleChange(prop, e.target.value)}
                    style={{ fontWeight: element[prop] || 'normal' }}
                >
                    {fontWeights.map(w => (
                        <option key={w} value={w} style={{ fontWeight: w }}>{w}</option>
                    ))}
                </Form.Select>
            );
        }
        if (prop.includes('font_style')) {
            return (
                <Form.Select
                    size="sm"
                    value={element[prop] || 'normal'}
                    onChange={(e) => handleChange(prop, e.target.value)}
                    style={{ fontStyle: element[prop] || 'normal' }}
                >
                    <option value="normal">Normal</option>
                    <option value="bold" style={{ fontWeight: 'bold' }}>Bold</option>
                    <option value="italic" style={{ fontStyle: 'italic' }}>Italic</option>
                    <option value="bold italic" style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Bold Italic</option>
                </Form.Select>
            );
        }
        if (prop.includes('font_size')) {
            return (
                <InputGroup size="sm">
                    <Form.Control
                        type="number"
                        value={element[prop] || 12}
                        onChange={(e) => handleChange(prop, parseInt(e.target.value))}
                    />
                    <Form.Select
                        style={{ maxWidth: '60px' }}
                        value={element[prop] || 12}
                        onChange={(e) => handleChange(prop, parseInt(e.target.value))}
                    >
                        {[8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </Form.Select>
                </InputGroup>
            );
        }

        if (prop === 'icon_set') {
            return (
                <Form.Select
                    size="sm"
                    value={element[prop] || 'Font Awesome'}
                    onChange={(e) => handleChange(prop, e.target.value)}
                >
                    {Object.keys(ICON_LIST).map(set => (
                        <option key={set} value={set}>{set}</option>
                    ))}
                </Form.Select>
            );
        }

        if (prop === 'icon_name') {
            return (
                <div className="d-flex gap-2">
                    <Form.Control
                        type="text"
                        size="sm"
                        value={element[prop] || ''}
                        placeholder="Click to select icon"
                        readOnly
                        onClick={() => setShowIconPicker(true)}
                        style={{ cursor: 'pointer' }}
                    />
                    <Button variant="outline-secondary" size="sm" onClick={() => setShowIconPicker(true)}>
                        <bi-search />
                        ...
                    </Button>
                </div>
            );
        }

        if (prop === 'navigation_target_page_id' || prop === 'target_url_or_screen') {
            return (
                <Form.Select
                    size="sm"
                    value={element[prop] || ''}
                    onChange={(e) => handleChange(prop, e.target.value)}
                >
                    <option value="">-- Select Target Page --</option>
                    {pages.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                    ))}
                    {prop === 'target_url_or_screen' && <option disabled>For external URLs, use text input (Not implemented)</option>}
                </Form.Select>
            );
        }

        if (prop === 'bars_list') {
            return (
                <div className="bg-light p-2 rounded border">
                    {(element[prop] || []).map((bar, idx) => (
                        <div key={idx} className="bg-white border rounded p-2 mb-2 shadow-sm d-flex justify-content-between align-items-center">
                            <div>
                                <div className="fw-bold small">{bar.label || `Bar ${idx + 1}`}</div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Value: {bar.value}</div>
                            </div>
                            <div>
                                <Button
                                    variant="link"
                                    className="text-primary p-0 me-2"
                                    size="sm"
                                    onClick={() => {
                                        setEditingBarIndex(idx);
                                        setEditingBarData({ ...bar });
                                        setShowBarModal(true);
                                    }}
                                    title="Edit Bar"
                                >
                                    <BiEdit />
                                </Button>
                                <Button
                                    variant="link"
                                    className="text-danger p-0"
                                    size="sm"
                                    onClick={() => {
                                        const newList = [...(element[prop] || [])];
                                        newList.splice(idx, 1);
                                        handleChange(prop, newList);
                                    }}
                                    title="Delete Bar"
                                >
                                    <BiTrash />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button
                        variant="outline-primary"
                        size="sm"
                        className="w-100"
                        onClick={() => {
                            setEditingBarIndex((element[prop] || []).length);
                            setEditingBarData({ label: 'New Bar', value: 0, color: '#3498db' });
                            setShowBarModal(true);
                        }}
                    >
                        + Add Bar
                    </Button>
                </div>
            );
        }

        if (prop === 'slices_list') {
            return (
                <div className="bg-light p-2 rounded border">
                    {(element[prop] || []).map((slice, idx) => (
                        <div key={idx} className="bg-white border rounded p-2 mb-2 shadow-sm d-flex justify-content-between align-items-center">
                            <div>
                                <div className="fw-bold small">{slice.label || `Slice ${idx + 1}`}</div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Value: {slice.value}</div>
                                <div className="d-flex align-items-center mt-1">
                                    <div style={{ width: 12, height: 12, backgroundColor: slice.color, marginRight: 4, border: '1px solid #ccc' }}></div>
                                </div>
                            </div>
                            <div>
                                <Button
                                    variant="link"
                                    className="text-primary p-0 me-2"
                                    size="sm"
                                    onClick={() => {
                                        setEditingSliceIndex(idx);
                                        setEditingSliceData({ ...slice });
                                        setShowSliceModal(true);
                                    }}
                                    title="Edit Slice"
                                >
                                    <BiEdit />
                                </Button>
                                <Button
                                    variant="link"
                                    className="text-danger p-0"
                                    size="sm"
                                    onClick={() => {
                                        const newList = [...(element[prop] || [])];
                                        newList.splice(idx, 1);
                                        handleChange(prop, newList);
                                    }}
                                    title="Delete Slice"
                                >
                                    <BiTrash />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button
                        variant="outline-primary"
                        size="sm"
                        className="w-100"
                        onClick={() => {
                            setEditingSliceIndex((element[prop] || []).length);
                            setEditingSliceData({ label: 'New Slice', value: 10, color: '#e74c3c' });
                            setShowSliceModal(true);
                        }}
                    >
                        + Add Slice
                    </Button>
                </div>
            );
        }

        if (prop === 'points_list') {
            return (
                <div className="bg-light p-2 rounded border">
                    {(element[prop] || []).map((point, idx) => (
                        <div key={idx} className="bg-white border rounded p-2 mb-2 shadow-sm d-flex justify-content-between align-items-center">
                            <div>
                                <div className="fw-bold small">{point.label || `Point ${idx + 1}`}</div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    {point.point_id ? `Source: ${points.find(p => p.id == point.point_id)?.name || point.point_id}` : `Val: ${point.value}`}
                                </div>
                            </div>
                            <div>
                                <Button
                                    variant="link"
                                    className="text-primary p-0 me-2"
                                    size="sm"
                                    onClick={() => {
                                        setEditingPointIndex(idx);
                                        setEditingPointData({ ...point });
                                        setShowPointModal(true);
                                    }}
                                    title="Edit Point"
                                >
                                    <BiEdit />
                                </Button>
                                <Button
                                    variant="link"
                                    className="text-danger p-0"
                                    size="sm"
                                    onClick={() => {
                                        const newList = [...(element[prop] || [])];
                                        newList.splice(idx, 1);
                                        handleChange(prop, newList);
                                    }}
                                    title="Delete Point"
                                >
                                    <BiTrash />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button
                        variant="outline-primary"
                        size="sm"
                        className="w-100"
                        onClick={() => {
                            setEditingPointIndex((element[prop] || []).length);
                            setEditingPointData({ label: 'New Point', value: 0 }); // Default
                            setShowPointModal(true);
                        }}
                    >
                        + Add Data Point
                    </Button>
                </div>
            );
        }

        if (prop === 'image_source_url' || prop === 'video_source_url' || prop === 'image_icon') {
            const handleFileChange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('file', file);

                setUploading(true);
                try {
                    const res = await api.post('graphics/upload/', formData);

                    let fileUrl = res.data.file;
                    if (fileUrl && !fileUrl.startsWith('http')) {
                        fileUrl = 'http://localhost:8000' + fileUrl;
                    }

                    handleChange(prop, fileUrl);
                } catch (err) {
                    console.error("Upload failed", err);
                    alert("Upload failed");
                } finally {
                    setUploading(false);
                }
            };

            return (
                <div>
                    <Form.Control
                        type="text"
                        size="sm"
                        value={element[prop] || ''}
                        onChange={(e) => handleChange(prop, e.target.value)}
                        placeholder="Enter URL or Upload"
                        className="mb-1"
                    />
                    <div className="d-flex align-items-center">
                        <Form.Control
                            type="file"
                            size="sm"
                            onChange={handleFileChange}
                            accept={prop.includes('video') ? "video/*" : "image/*"}
                        />
                        {uploading && <Spinner size="sm" animation="border" className="ms-2" />}
                    </div>
                </div>
            );
        }

        // Generic Inference
        const isColor = prop.includes('color');

        // Strict Number Check (avoiding 'text' matching 'x' or similar)
        const numberKeywords = ['width', 'height', 'radius', 'opacity', 'rotation', 'angle', 'sides', 'z_index', 'size', 'stroke', 'border', 'thickness', 'min_', 'max_', 'mid_', 'current_value', 'divisions'];
        const isNumber = (numberKeywords.some(k => prop.includes(k)) || prop === 'x_position' || prop === 'y_position') && !prop.includes('text') && !prop.includes('content') && prop !== 'data_binding_source' && prop !== 'inner_radius';

        const isBoolean = ['visible', 'checked', 'enabled', 'show_', 'is_', 'toggle'].some(k => prop.includes(k)) && !prop.includes('condition');

        // Exclude specific text fields from Select inference if needed
        const isSelect = ['style', 'alignment', 'align', 'type', 'orientation', 'line_type', 'font_weight'].some(k => prop.includes(k)) && !prop.includes('content') && prop !== 'tooltip_text' || prop === 'line_type';

        if (isSelect) {
            let options = [];
            if (prop.includes('orientation')) options = ['vertical', 'horizontal'];
            else if (prop.includes('align')) options = ['left', 'center', 'right', 'justify'];
            else if (prop.includes('style')) options = ['solid', 'dashed', 'dotted'];
            else if (prop.includes('weight')) options = ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
            else if (prop === 'line_type') options = ['spline', 'step', 'linear', 'state'];
            // Add more as needed

            if (options.length > 0) {
                return (
                    <Form.Select
                        size="sm"
                        value={element[prop] || options[0]}
                        onChange={(e) => handleChange(prop, e.target.value)}
                    >
                        {options.map(opt => (
                            <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                        ))}
                    </Form.Select>
                );
            }
        }

        if (isColor) {
            return (
                <div className="d-flex gap-2">
                    <Form.Control
                        type="color"
                        value={element[prop] || '#000000'}
                        onChange={(e) => handleChange(prop, e.target.value)}
                        className="p-1"
                        style={{ width: '40px', height: '31px' }}
                    />
                    <Form.Control
                        type="text"
                        size="sm"
                        value={element[prop] || '#000000'}
                        onChange={(e) => handleChange(prop, e.target.value)}
                    />
                </div>
            );
        }

        if (isNumber) {
            return (
                <Form.Control
                    type="number"
                    size="sm"
                    value={element[prop] !== undefined ? element[prop] : ''}
                    onChange={(e) => handleChange(prop, parseFloat(e.target.value))}
                />
            );
        }

        if (isBoolean) {
            return (
                <Form.Check
                    type="switch"
                    checked={!!element[prop]}
                    onChange={(e) => handleChange(prop, e.target.checked)}
                />
            );
        }

        // Default Text/Textarea
        // Ensure text_content, x_axis_label, y_axis_label are captured here as text inputs
        if (prop.includes('text') || prop.includes('content') || prop.includes('script') || prop.includes('condition') || prop === 'x_axis_label' || prop === 'y_axis_label') {
            return (
                <Form.Control
                    as={prop.length > 20 ? "textarea" : "input"}
                    rows={3}
                    size="sm"
                    value={element[prop] || ''}
                    onChange={(e) => handleChange(prop, e.target.value)}
                />
            );
        }

        return (
            <Form.Control
                type="text"
                size="sm"
                value={element[prop] || ''}
                onChange={(e) => handleChange(prop, e.target.value)}
            />
        );
    };

    return (
        <div className="p-3">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                <h6 className="mb-0 text-truncate" title={element.name}>{element.name}</h6>
                <Button variant="outline-danger" size="sm" onClick={onDelete} title="Delete Element">
                    <BiTrash />
                </Button>
            </div>

            <Form>
                {propertiesList.map(prop => (
                    <Form.Group key={prop} className="mb-2">
                        <Form.Label className="small text-muted mb-1 text-capitalize">{prop.replace(/_/g, ' ')}</Form.Label>
                        {renderInput(prop)}
                    </Form.Group>
                ))}

                {/* Convert Value Section (Custom Rule Engine) */}
                <hr className="my-3" />
                <h6 className="small fw-bold text-uppercase text-muted mb-2">Convert Values (Rules)</h6>
                <div className="bg-light p-2 rounded border mb-2">
                    {(!element.convert_values || element.convert_values.length === 0) && (
                        <div className="text-center text-muted small my-2">No conversion rules defined.</div>
                    )}

                    {(element.convert_values || []).map((rule, idx) => (
                        <div key={idx} className="bg-white border rounded p-2 mb-2 shadow-sm position-relative">
                            <div className="position-absolute top-0 end-0 me-2 mt-1 d-flex">
                                <Button
                                    variant="link"
                                    className="text-secondary p-0 me-1"
                                    size="sm"
                                    disabled={idx === 0}
                                    onClick={() => {
                                        const newRules = [...(element.convert_values || [])];
                                        if (idx > 0) {
                                            [newRules[idx - 1], newRules[idx]] = [newRules[idx], newRules[idx - 1]];
                                            handleChange('convert_values', newRules);
                                        }
                                    }}
                                    title="Move Up (Higher Priority)"
                                >
                                    <BiChevronUp />
                                </Button>
                                <Button
                                    variant="link"
                                    className="text-secondary p-0 me-1"
                                    size="sm"
                                    disabled={idx === (element.convert_values || []).length - 1}
                                    onClick={() => {
                                        const newRules = [...(element.convert_values || [])];
                                        if (idx < newRules.length - 1) {
                                            [newRules[idx + 1], newRules[idx]] = [newRules[idx], newRules[idx + 1]];
                                            handleChange('convert_values', newRules);
                                        }
                                    }}
                                    title="Move Down (Lower Priority)"
                                >
                                    <BiChevronDown />
                                </Button>
                                <Button
                                    variant="link"
                                    className="text-danger p-0"
                                    size="sm"
                                    onClick={() => {
                                        const newRules = [...(element.convert_values || [])];
                                        newRules.splice(idx, 1);
                                        handleChange('convert_values', newRules);
                                    }}
                                    title="Delete Rule"
                                >
                                    <BiTrash />
                                </Button>
                            </div>

                            <Row className="g-1 mb-2 align-items-center">
                                <Col xs={4}>
                                    <Form.Select
                                        size="sm"
                                        value={rule.operator || '='}
                                        onChange={(e) => {
                                            const newRules = [...(element.convert_values || [])];
                                            newRules[idx] = { ...rule, operator: e.target.value };
                                            handleChange('convert_values', newRules);
                                        }}
                                    >
                                        <option value="=">=</option>
                                        <option value=">">&gt;</option>
                                        <option value="<">&lt;</option>
                                        <option value=">=">&gt;=</option>
                                        <option value="<=">&lt;=</option>
                                        <option value="!=">!=</option>
                                        <option value="is_even">Is Even</option>
                                        <option value="is_odd">Is Odd</option>
                                    </Form.Select>
                                </Col>
                                <Col xs={8}>
                                    {!['is_even', 'is_odd'].includes(rule.operator) && (
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            placeholder="Value"
                                            value={rule.value !== undefined ? rule.value : ''}
                                            onChange={(e) => {
                                                const newRules = [...(element.convert_values || [])];
                                                newRules[idx] = { ...rule, value: e.target.value };
                                                handleChange('convert_values', newRules);
                                            }}
                                        />
                                    )}
                                </Col>
                            </Row>

                            <div className="small text-muted mb-1">Styles to Apply:</div>
                            <Row className="g-1">
                                <Col xs={6}>
                                    <Form.Label className="small mb-0">Colors</Form.Label>
                                    <div className="d-flex">
                                        <Form.Control
                                            type="color"
                                            size="sm"
                                            title="Main Color (Shape Fill, Text Color, Icon, Button Bg)"
                                            value={rule.color || '#000000'}
                                            onChange={(e) => {
                                                const newRules = [...(element.convert_values || [])];
                                                newRules[idx] = { ...rule, color: e.target.value };
                                                handleChange('convert_values', newRules);
                                            }}
                                            className="p-0 border-0"
                                            style={{ width: '24px', height: '24px' }}
                                        />
                                        <Form.Control
                                            type="color"
                                            size="sm"
                                            title="Secondary Color (Shape Border, Button Text)"
                                            value={rule.bg_color || '#ffffff'}
                                            onChange={(e) => {
                                                const newRules = [...(element.convert_values || [])];
                                                newRules[idx] = { ...rule, bg_color: e.target.value };
                                                handleChange('convert_values', newRules);
                                            }}
                                            className="p-0 border-0 ms-1"
                                            style={{ width: '24px', height: '24px' }}
                                        />
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <Form.Check
                                        type="switch"
                                        label="Blink"
                                        className="small"
                                        checked={!!rule.blink}
                                        onChange={(e) => {
                                            const newRules = [...(element.convert_values || [])];
                                            newRules[idx] = { ...rule, blink: e.target.checked };
                                            handleChange('convert_values', newRules);
                                        }}
                                    />
                                </Col>
                            </Row>

                            {rule.blink && (
                                <Row className="g-1 mt-1">
                                    <Col xs={12}>
                                        <div className="d-flex align-items-center">
                                            <span className="small me-2">Blink Cols:</span>
                                            <Form.Control
                                                type="color"
                                                size="sm"
                                                title="Blink Text/Stroke Color"
                                                value={rule.blink_color || '#ff0000'}
                                                onChange={(e) => {
                                                    const newRules = [...(element.convert_values || [])];
                                                    newRules[idx] = { ...rule, blink_color: e.target.value };
                                                    handleChange('convert_values', newRules);
                                                }}
                                                className="p-0 border-0"
                                                style={{ width: '20px', height: '20px' }}
                                            />
                                            <Form.Control
                                                type="color"
                                                size="sm"
                                                title="Blink Background Color"
                                                value={rule.blink_bg_color || '#ffff00'}
                                                onChange={(e) => {
                                                    const newRules = [...(element.convert_values || [])];
                                                    newRules[idx] = { ...rule, blink_bg_color: e.target.value };
                                                    handleChange('convert_values', newRules);
                                                }}
                                                className="p-0 border-0 ms-1"
                                                style={{ width: '20px', height: '20px' }}
                                            />
                                        </div>
                                    </Col>
                                </Row>
                            )}

                            {element.type && element.type.includes('Text') && (
                                <div className="mt-2">
                                    <Form.Control
                                        size="sm"
                                        placeholder="Display Text (Optional)"
                                        value={rule.display_text || ''}
                                        onChange={(e) => {
                                            const newRules = [...(element.convert_values || [])];
                                            newRules[idx] = { ...rule, display_text: e.target.value };
                                            handleChange('convert_values', newRules);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    <Button
                        variant="outline-primary"
                        size="sm"
                        className="w-100"
                        onClick={() => {
                            const newRules = [...(element.convert_values || []), {
                                operator: '=',
                                value: '0',
                                color: '#000000',
                                bg_color: '#ffffff'
                            }];
                            handleChange('convert_values', newRules);
                        }}
                    >
                        + Add Rule
                    </Button>

                </div>

                {/* Custom Labels List Section */}
                {
                    schemaInfo && schemaInfo.properties.includes('custom_labels_list') && (
                        <>
                            <hr className="my-3" />
                            <h6 className="small fw-bold text-uppercase text-muted mb-2">Custom Labels</h6>
                            <div className="bg-light p-2 rounded border mb-2">
                                {(!element.custom_labels_list || element.custom_labels_list.length === 0) && (
                                    <div className="text-center text-muted small my-2">No custom labels.</div>
                                )}

                                {(element.custom_labels_list || []).map((labelItem, idx) => (
                                    <div key={idx} className="bg-white border rounded p-2 mb-2 shadow-sm position-relative">
                                        <Button
                                            variant="link"
                                            className="text-danger p-0 position-absolute top-0 end-0 me-2 mt-1"
                                            size="sm"
                                            onClick={() => {
                                                const newList = [...(element.custom_labels_list || [])];
                                                newList.splice(idx, 1);
                                                handleChange('custom_labels_list', newList);
                                            }}
                                            title="Delete Label"
                                        >
                                            <BiTrash />
                                        </Button>

                                        <Row className="g-1">
                                            <Col xs={4}>
                                                <Form.Label className="small mb-0">Value</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    size="sm"
                                                    value={labelItem.value !== undefined ? labelItem.value : ''}
                                                    onChange={(e) => {
                                                        const newList = [...(element.custom_labels_list || [])];
                                                        newList[idx] = { ...labelItem, value: parseFloat(e.target.value) };
                                                        handleChange('custom_labels_list', newList);
                                                    }}
                                                />
                                            </Col>
                                            <Col xs={8}>
                                                <Form.Label className="small mb-0">Label Text</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    size="sm"
                                                    value={labelItem.text || ''}
                                                    onChange={(e) => {
                                                        const newList = [...(element.custom_labels_list || [])];
                                                        newList[idx] = { ...labelItem, text: e.target.value };
                                                        handleChange('custom_labels_list', newList);
                                                    }}
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                ))}

                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    className="w-100"
                                    onClick={() => {
                                        const newList = [...(element.custom_labels_list || []), { value: 0, text: 'Label' }];
                                        handleChange('custom_labels_list', newList);
                                    }}
                                >
                                    + Add Label
                                </Button>
                            </div>
                        </>
                    )
                }

                {/* Bars List Section (New for Bar Chart) */}
                {
                    schemaInfo && schemaInfo.properties.includes('bars_list') && (
                        <>
                            <hr className="my-3" />
                            <h6 className="small fw-bold text-uppercase text-muted mb-2">Data Bars</h6>
                            <div className="bg-light p-2 rounded border mb-2">
                                {(!element.bars_list || element.bars_list.length === 0) && (
                                    <div className="text-center text-muted small my-2">No bars defined.</div>
                                )}

                                {(element.bars_list || []).map((bar, idx) => (
                                    <div key={idx} className="bg-white border rounded p-2 mb-2 shadow-sm position-relative">
                                        <Button
                                            variant="link"
                                            className="text-danger p-0 position-absolute top-0 end-0 me-2 mt-1"
                                            size="sm"
                                            onClick={() => {
                                                const newList = [...(element.bars_list || [])];
                                                newList.splice(idx, 1);
                                                handleChange('bars_list', newList);
                                            }}
                                            title="Delete Bar"
                                        >
                                            <BiTrash />
                                        </Button>

                                        <Row className="g-1 mb-2">
                                            <Col xs={6}>
                                                <Form.Label className="small mb-0">Label (X-Axis)</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    size="sm"
                                                    value={bar.label || ''}
                                                    onChange={(e) => {
                                                        const newList = [...(element.bars_list || [])];
                                                        newList[idx] = { ...bar, label: e.target.value };
                                                        handleChange('bars_list', newList);
                                                    }}
                                                />
                                            </Col>
                                            <Col xs={6}>
                                                <Form.Label className="small mb-0">Value / Point</Form.Label>
                                                {/* Allow selecting a Point OR manual value */}
                                                <InputGroup size="sm">
                                                    <Form.Select
                                                        value={bar.point_id || ''}
                                                        onChange={(e) => {
                                                            const newList = [...(element.bars_list || [])];
                                                            newList[idx] = { ...bar, point_id: e.target.value, value: null }; // Reset manual val if point selected? 
                                                            handleChange('bars_list', newList);
                                                        }}
                                                    >
                                                        <option value="">-- Static --</option>
                                                        {points.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </Form.Select>
                                                    {!bar.point_id && (
                                                        <Form.Control
                                                            type="number"
                                                            placeholder="Val"
                                                            value={bar.value !== undefined ? bar.value : ''}
                                                            onChange={(e) => {
                                                                const newList = [...(element.bars_list || [])];
                                                                newList[idx] = { ...bar, value: parseFloat(e.target.value) };
                                                                handleChange('bars_list', newList);
                                                            }}
                                                        />
                                                    )}
                                                </InputGroup>
                                            </Col>
                                        </Row>
                                        <Row className="g-1">
                                            <Col xs={6}>
                                                <Form.Label className="small mb-0">Color</Form.Label>
                                                <Form.Control
                                                    type="color"
                                                    size="sm"
                                                    value={bar.color || '#3498db'}
                                                    onChange={(e) => {
                                                        const newList = [...(element.bars_list || [])];
                                                        newList[idx] = { ...bar, color: e.target.value };
                                                        handleChange('bars_list', newList);
                                                    }}
                                                    className="w-100 p-0 border-0"
                                                    style={{ height: '24px' }}
                                                />
                                            </Col>
                                            <Col xs={6}>
                                                <Form.Label className="small mb-0">Thickness (px)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    size="sm"
                                                    value={bar.thickness || 20}
                                                    onChange={(e) => {
                                                        const newList = [...(element.bars_list || [])];
                                                        newList[idx] = { ...bar, thickness: parseInt(e.target.value) };
                                                        handleChange('bars_list', newList);
                                                    }}
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                ))}

                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    className="w-100"
                                    onClick={() => {
                                        const newList = [...(element.bars_list || []), { label: 'New Bar', value: 50, color: '#3498db', thickness: 30 }];
                                        handleChange('bars_list', newList);
                                    }}
                                >
                                    + Add Bar
                                </Button>
                            </div>
                        </>
                    )
                }

                {/* Color Ranges Section */}
                {schemaInfo && schemaInfo.properties.includes('ranges') && (
                    <>
                        <hr className="my-3" />
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="small fw-bold text-uppercase text-muted mb-0">Color Ranges</h6>
                            <Form.Check
                                type="switch"
                                id="range-gradient-switch"
                                label="Gradient"
                                className="small"
                                checked={element.range_color_mode === 'gradient'}
                                onChange={(e) => handleChange('range_color_mode', e.target.checked ? 'gradient' : 'solid')}
                            />
                        </div>

                        <div className="bg-light p-2 rounded border mb-2">
                            {(!element.ranges || element.ranges.length === 0) && (
                                <div className="text-center text-muted small my-2">No ranges defined.</div>
                            )}

                            {(element.ranges || []).map((range, idx) => (
                                <div key={idx} className="bg-white border rounded p-2 mb-2 shadow-sm position-relative">
                                    <Button
                                        variant="link"
                                        className="text-danger p-0 position-absolute top-0 end-0 me-2 mt-1"
                                        size="sm"
                                        onClick={() => {
                                            const newList = [...(element.ranges || [])];
                                            newList.splice(idx, 1);
                                            handleChange('ranges', newList);
                                        }}
                                        title="Delete Range"
                                    >
                                        <BiTrash />
                                    </Button>

                                    <Row className="g-2 align-items-end">
                                        <Col xs={4}>
                                            <Form.Label className="small mb-1">From</Form.Label>
                                            <Form.Control
                                                type="number"
                                                size="sm"
                                                value={range.start !== undefined ? range.start : ''}
                                                onChange={(e) => {
                                                    const newList = [...(element.ranges || [])];
                                                    newList[idx] = { ...range, start: parseFloat(e.target.value) };
                                                    handleChange('ranges', newList);
                                                }}
                                            />
                                        </Col>
                                        <Col xs={4}>
                                            <Form.Label className="small mb-1">To</Form.Label>
                                            <Form.Control
                                                type="number"
                                                size="sm"
                                                value={range.end !== undefined ? range.end : ''}
                                                onChange={(e) => {
                                                    const newList = [...(element.ranges || [])];
                                                    newList[idx] = { ...range, end: parseFloat(e.target.value) };
                                                    handleChange('ranges', newList);
                                                }}
                                            />
                                        </Col>
                                        <Col xs={4}>
                                            <Form.Label className="small mb-1">Color</Form.Label>
                                            <Form.Control
                                                type="color"
                                                size="sm"
                                                value={range.color || '#000000'}
                                                onChange={(e) => {
                                                    const newList = [...(element.ranges || [])];
                                                    newList[idx] = { ...range, color: e.target.value };
                                                    handleChange('ranges', newList);
                                                }}
                                                className="w-100 p-0 border-0"
                                                style={{ height: '31px' }}
                                            />
                                        </Col>
                                    </Row>
                                </div>
                            ))}

                            <Button
                                variant="outline-secondary"
                                size="sm"
                                className="w-100"
                                onClick={() => {
                                    const min = Number(element.min_value) || 0;
                                    const max = Number(element.max_value) || 100;
                                    const newList = [...(element.ranges || []), { start: min, end: max, color: '#00ff00' }];
                                    handleChange('ranges', newList);
                                }}
                            >
                                + Add Range
                            </Button>
                        </div>
                    </>
                )}
            </Form >

            <IconPicker
                show={showIconPicker}
                onHide={() => setShowIconPicker(false)}
                currentSet={element.icon_set || 'Font Awesome'}
                currentIcon={element.icon_name}
                onSelect={(set, name) => {
                    // Update both set and name
                    onChange({
                        ...element,
                        icon_set: set,
                        icon_name: name
                    });
                }}
            />

            {/* Bar Chart Modal */}
            <Modal show={showBarModal} onHide={() => setShowBarModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingBarIndex !== null && element.bars_list && element.bars_list[editingBarIndex] ? 'Edit Bar' : 'Add Bar'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Label Text</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editingBarData.label || ''}
                                        onChange={(e) => setEditingBarData({ ...editingBarData, label: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Value</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={editingBarData.value !== undefined ? editingBarData.value : 0}
                                        onChange={(e) => setEditingBarData({ ...editingBarData, value: parseFloat(e.target.value) })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Bar Color</Form.Label>
                                    <Form.Control
                                        type="color"
                                        value={editingBarData.color || '#3498db'}
                                        onChange={(e) => setEditingBarData({ ...editingBarData, color: e.target.value })}
                                        style={{ height: '38px' }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr />
                        <h6 className="text-muted mb-3">Label Typography</h6>
                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small">Font Family</Form.Label>
                                    <Form.Select
                                        size="sm"
                                        value={editingBarData.label_font_family || 'Arial'}
                                        onChange={(e) => {
                                            loadGoogleFont(e.target.value);
                                            setEditingBarData({ ...editingBarData, label_font_family: e.target.value });
                                        }}
                                        style={{ fontFamily: editingBarData.label_font_family || 'Arial' }}
                                    >
                                        {fontFamilies.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small">Size</Form.Label>
                                    <InputGroup size="sm">
                                        <Form.Control
                                            type="number"
                                            value={editingBarData.label_font_size || 10}
                                            onChange={(e) => setEditingBarData({ ...editingBarData, label_font_size: parseInt(e.target.value) })}
                                        />
                                        <Form.Select
                                            style={{ maxWidth: '60px' }}
                                            value={editingBarData.label_font_size || 10}
                                            onChange={(e) => setEditingBarData({ ...editingBarData, label_font_size: parseInt(e.target.value) })}
                                        >
                                            {[8, 10, 11, 12, 14, 16, 18, 20, 24].map(s => <option key={s} value={s}>{s}</option>)}
                                        </Form.Select>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small">Weight</Form.Label>
                                    <Form.Select
                                        size="sm"
                                        value={editingBarData.label_font_weight || 'normal'}
                                        onChange={(e) => setEditingBarData({ ...editingBarData, label_font_weight: e.target.value })}
                                        style={{ fontWeight: editingBarData.label_font_weight || 'normal' }}
                                    >
                                        {fontWeights.map(w => <option key={w} value={w} style={{ fontWeight: w }}>{w}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small">Text Color</Form.Label>
                                    <div className="d-flex align-items-center">
                                        <Form.Control
                                            type="color"
                                            value={editingBarData.label_font_color || '#000000'}
                                            onChange={(e) => setEditingBarData({ ...editingBarData, label_font_color: e.target.value })}
                                            style={{ width: '40px', height: '31px', padding: 0, border: 'none' }}
                                            className="me-2"
                                        />
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            value={editingBarData.label_font_color || '#000000'}
                                            onChange={(e) => setEditingBarData({ ...editingBarData, label_font_color: e.target.value })}
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowBarModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={() => {
                        const newList = [...(element.bars_list || [])];
                        // If editingBarIndex is effectively "new" (>= length) or specifically -1? 
                        // Actually in renderInput I set it to length for new.
                        if (editingBarIndex !== null && editingBarIndex < newList.length) {
                            // Edit
                            newList[editingBarIndex] = editingBarData;
                        } else {
                            // Add
                            newList.push(editingBarData);
                        }
                        newList[editingBarIndex] = editingBarData;
                        handleChange('bars_list', newList);
                        setShowBarModal(false);
                    }}>Save</Button>
                </Modal.Footer>
            </Modal>

            {/* Slice Edit Modal */}
            <Modal show={showSliceModal} onHide={() => setShowSliceModal(false)} size="sm">
                <Modal.Header closeButton>
                    <Modal.Title className="h6">Edit Slice</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-2">
                        <Form.Label className="small">Label</Form.Label>
                        <Form.Control
                            type="text"
                            size="sm"
                            value={editingSliceData.label || ''}
                            onChange={(e) => setEditingSliceData({ ...editingSliceData, label: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label className="small">Value / Point</Form.Label>
                        <InputGroup size="sm">
                            <Form.Select
                                value={editingSliceData.point_id || ''}
                                onChange={(e) => setEditingSliceData({ ...editingSliceData, point_id: e.target.value })}
                            >
                                <option value="">-- Manual --</option>
                                <option disabled>Select Point (TODO)</option>
                                {/* Re-use points from props or context if available, currently 'points' state exists in component */}
                                {points.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </Form.Select>
                            <Form.Control
                                type="number"
                                placeholder={editingSliceData.point_id ? "Preview Val" : "Value"}
                                value={editingSliceData.value !== undefined ? editingSliceData.value : ''}
                                onChange={(e) => setEditingSliceData({ ...editingSliceData, value: parseFloat(e.target.value) })}
                            />
                        </InputGroup>
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label className="small">Color</Form.Label>
                        <Form.Control
                            type="color"
                            size="sm"
                            className="w-100 p-0"
                            value={editingSliceData.color || '#e74c3c'}
                            onChange={(e) => setEditingSliceData({ ...editingSliceData, color: e.target.value })}
                            style={{ height: 30 }}
                        />
                    </Form.Group>

                    <hr className="my-2" />
                    <h6 className="small fw-bold text-muted">Label Font</h6>
                    <Row className="g-1 mb-2">
                        <Col xs={12}>
                            <Form.Select
                                size="sm"
                                value={editingSliceData.label_font_family || 'Arial'}
                                onChange={(e) => setEditingSliceData({ ...editingSliceData, label_font_family: e.target.value })}
                            >
                                {fontFamilies.map(f => (
                                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                                ))}
                            </Form.Select>
                        </Col>
                    </Row>
                    <Row className="g-1">
                        <Col xs={4}>
                            <Form.Control
                                type="number"
                                size="sm"
                                placeholder="Size"
                                value={editingSliceData.label_font_size || 10}
                                onChange={(e) => setEditingSliceData({ ...editingSliceData, label_font_size: parseInt(e.target.value) })}
                            />
                        </Col>
                        <Col xs={4}>
                            <Form.Select
                                size="sm"
                                value={editingSliceData.label_font_weight || 'normal'}
                                onChange={(e) => setEditingSliceData({ ...editingSliceData, label_font_weight: e.target.value })}
                            >
                                <option value="normal">Normal</option>
                                <option value="bold">Bold</option>
                            </Form.Select>
                        </Col>
                        <Col xs={4}>
                            <Form.Control
                                type="color"
                                size="sm"
                                className="w-100 p-0"
                                value={editingSliceData.label_color || '#ffffff'}
                                onChange={(e) => setEditingSliceData({ ...editingSliceData, label_color: e.target.value })}
                                style={{ height: 31 }}
                                title="Label Color"
                            />
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setShowSliceModal(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={() => {
                        const newList = [...(element.slices_list || [])];
                        newList[editingSliceIndex] = editingSliceData;
                        handleChange('slices_list', newList);
                        setShowSliceModal(false);
                    }}>Save Slice</Button>
                </Modal.Footer>
            </Modal>

            {/* Line Chart Point Modal */}
            <Modal show={showPointModal} onHide={() => setShowPointModal(false)} centered size="md">
                <Modal.Header closeButton>
                    <Modal.Title>{editingPointIndex !== null && element.points_list && element.points_list[editingPointIndex] ? 'Edit Data Point' : 'Add Data Point'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Label (X-Axis)</Form.Label>
                            <Form.Control
                                type="text"
                                value={editingPointData.label || ''}
                                onChange={(e) => setEditingPointData({ ...editingPointData, label: e.target.value })}
                                placeholder="Time, Category, etc."
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Data Source (Point)</Form.Label>
                            <Form.Select
                                value={editingPointData.point_id || ''}
                                onChange={(e) => setEditingPointData({ ...editingPointData, point_id: e.target.value })}
                            >
                                <option value="">-- Select IO Point --</option>
                                {points.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        {/* Optional: Add override value for static testing? */}
                        <Form.Group className="mb-3">
                            <Form.Label>Static Value (Testing)</Form.Label>
                            <Form.Control
                                type="number"
                                value={editingPointData.value !== undefined ? editingPointData.value : 0}
                                onChange={(e) => setEditingPointData({ ...editingPointData, value: parseFloat(e.target.value) })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Point Color</Form.Label>
                            <Form.Control
                                type="color"
                                value={editingPointData.color || '#3498db'}
                                onChange={(e) => setEditingPointData({ ...editingPointData, color: e.target.value })}
                                style={{ height: '38px' }}
                            />
                        </Form.Group>

                        <hr />
                        <h6 className="text-muted mb-3">Label Typography</h6>
                        <Row className="g-2">
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small">Font Family</Form.Label>
                                    <Form.Select
                                        size="sm"
                                        value={editingPointData.label_font_family || 'Arial'}
                                        onChange={(e) => {
                                            loadGoogleFont(e.target.value);
                                            setEditingPointData({ ...editingPointData, label_font_family: e.target.value });
                                        }}
                                        style={{ fontFamily: editingPointData.label_font_family || 'Arial' }}
                                    >
                                        {fontFamilies.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small">Size</Form.Label>
                                    <InputGroup size="sm">
                                        <Form.Control
                                            type="number"
                                            value={editingPointData.label_font_size || 10}
                                            onChange={(e) => setEditingPointData({ ...editingPointData, label_font_size: parseInt(e.target.value) })}
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small">Weight</Form.Label>
                                    <Form.Select
                                        size="sm"
                                        value={editingPointData.label_font_weight || 'normal'}
                                        onChange={(e) => setEditingPointData({ ...editingPointData, label_font_weight: e.target.value })}
                                        style={{ fontWeight: editingPointData.label_font_weight || 'normal' }}
                                    >
                                        {fontWeights.map(w => <option key={w} value={w} style={{ fontWeight: w }}>{w}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small">Text Color</Form.Label>
                                    <div className="d-flex align-items-center">
                                        <Form.Control
                                            type="color"
                                            value={editingPointData.label_font_color || '#000000'}
                                            onChange={(e) => setEditingPointData({ ...editingPointData, label_font_color: e.target.value })}
                                            style={{ width: '40px', height: '31px', padding: 0, border: 'none' }}
                                            className="me-2"
                                        />
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            value={editingPointData.label_font_color || '#000000'}
                                            onChange={(e) => setEditingPointData({ ...editingPointData, label_font_color: e.target.value })}
                                        />
                                    </div>
                                </Form.Group>
                            </Col>

                        </Row>
                    </Form>
                </Modal.Body >
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPointModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={() => {
                        const newList = [...(element.points_list || [])];
                        // If static value is used, it overrides live? Or use as fallback?
                        // Let's store both.
                        console.log("Saving Point Data:", editingPointData);
                        newList[editingPointIndex] = editingPointData;
                        handleChange('points_list', newList);
                        setShowPointModal(false);
                    }}>Save Point</Button>
                </Modal.Footer>
            </Modal >
        </div >
    );
};

export default PropertiesPanel;
