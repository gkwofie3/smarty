import React from 'react';
import { Form, Button, InputGroup, Row, Col, Spinner } from 'react-bootstrap';
import { BiTrash, BiUpload } from 'react-icons/bi';
import api from '../../services/api';

import { ELEMENT_SCHEMA } from '../../constants/schema';

const PropertiesPanel = ({ element, onChange, onDelete }) => {
    // ... existing content without the helper logic which is inside ...
    // I need to paste the FULL content of PropertiesPanel logic here, just modifying imports.
    // Re-implemented logic from Step 892.
    const [uploading, setUploading] = React.useState(false);
    // ... existing content without the helper logic which is inside ...
    // I need to paste the FULL content of PropertiesPanel logic here, just modifying imports.
    // Re-implemented logic from Step 892.

    if (!element) return <div className="p-3 text-muted">Select an element</div>;

    const schemaInfo = ELEMENT_SCHEMA.elements.find(e => e.name === element.type);
    const propertiesList = schemaInfo ? schemaInfo.properties : Object.keys(element);

    const handleChange = (key, value) => {
        onChange({ ...element, [key]: value });
    };

    // Helper: Font Families
    const fontFamilies = [
        'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
        'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
        'Arial Black', 'Impact', 'Lucida Sans Unicode', 'Tahoma'
    ];

    // Helper: Font Weights
    const fontWeights = ['normal', 'bold', 'lighter', 'bolder', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

    const renderInput = (prop) => {
        // Handle Font Properties Specifically
        if (prop === 'font_family') {
            return (
                <Form.Select
                    size="sm"
                    value={element[prop] || 'Arial'}
                    onChange={(e) => handleChange(prop, e.target.value)}
                    style={{ fontFamily: element[prop] || 'Arial' }}
                >
                    {fontFamilies.map(f => (
                        <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                    ))}
                </Form.Select>
            );
        }
        if (prop === 'font_weight') {
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
        if (prop === 'font_style') {
            return (
                <Form.Select
                    size="sm"
                    value={element[prop] || 'normal'}
                    onChange={(e) => handleChange(prop, e.target.value)}
                    style={{ fontStyle: element[prop] || 'normal' }}
                >
                    <option value="normal">Normal</option>
                    <option value="italic" style={{ fontStyle: 'italic' }}>Italic</option>
                </Form.Select>
            );
        }
        if (prop === 'font_size') {
            return (
                <InputGroup size="sm">
                    <Form.Control
                        type="number"
                        value={element[prop] || 16}
                        onChange={(e) => handleChange(prop, parseInt(e.target.value))}
                    />
                    <Form.Select
                        style={{ maxWidth: '60px' }}
                        value={element[prop] || 16}
                        onChange={(e) => handleChange(prop, parseInt(e.target.value))}
                    >
                        {[8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </Form.Select>
                </InputGroup>
            );
        }

        if (prop === 'image_source_url' || prop === 'video_source_url') {
            const handleFileChange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('file', file);

                setUploading(true);
                try {
                    // API endpoint must be /api/graphics/upload/
                    // The view returns { "file": "/media/uploads/filename.ext", ... }
                    const res = await api.post('graphics/upload/', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });

                    // Assuming res.data.file is the relative URL or absolute URL
                    // If Django returns relative /media/..., we can use it directly if served by same host or add Base URL.
                    // Given proxy or CORS, usually relative path is fine if <img src={url} /> hits the server.
                    // But our dev server is on 5173, backend on 8000.
                    // So we might need full URL: http://localhost:8000/media/...
                    // Or api.defaults.baseURL is http://localhost:8000/api/.
                    // We need http://localhost:8000.

                    let fileUrl = res.data.file;
                    if (fileUrl && !fileUrl.startsWith('http')) {
                        // Construct full URL if needed, or rely on proxy.
                        // For now, let's assume simple relative path and we prepend backend URL in ElementRenderer?
                        // OR we prepend it here.
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
        const numberKeywords = ['width', 'height', 'radius', 'opacity', 'rotation', 'angle', 'sides', 'z_index', 'size', 'stroke', 'border'];
        const isNumber = (numberKeywords.some(k => prop.includes(k)) || prop === 'x_position' || prop === 'y_position') && !prop.includes('text') && !prop.includes('content');

        const isBoolean = ['visible', 'checked', 'enabled', 'show_', 'is_'].some(k => prop.includes(k)) && !prop.includes('condition');

        const isSelect = ['style', 'alignment', 'type', 'orientation'].some(k => prop.includes(k)) && !prop.includes('type') && !prop.includes('text') && !prop.includes('content');

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
        if (prop.includes('text') || prop.includes('content') || prop.includes('script') || prop.includes('condition')) {
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
            </Form>
        </div>
    );
};

export default PropertiesPanel;
