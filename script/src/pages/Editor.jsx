import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MonacoEditor, { loader } from '@monaco-editor/react';
import {
    Button, Container, Row, Col, Card, Form,
    Badge, Dropdown, Spinner, ListGroup
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
    getScript, updateScript, validateScript,
    executeScript, getPoints, saveBindings
} from '../api';

const Editor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [script, setScript] = useState(null);
    const [code, setCode] = useState('');
    const [points, setPoints] = useState([]);
    const [declarations, setDeclarations] = useState([]);
    const [bindings, setBindings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const editorRef = useRef(null);

    useEffect(() => {
        Promise.all([
            getScript(id),
            getPoints()
        ]).then(([sRes, pRes]) => {
            setScript(sRes.data);
            setCode(sRes.data.code_text);
            setBindings(sRes.data.bindings || []);
            setPoints(pRes.data);
            setLoading(false);
            // Initial validation to get declarations
            handleValidate(sRes.data.code_text);
        }).catch(err => {
            toast.error("Failed to load script data");
            navigate('/');
        });
    }, [id]);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        // Custom DSL Highlighting
        monaco.languages.register({ id: 'python-dsl' });
        monaco.languages.setMonarchTokensProvider('python-dsl', {
            tokenizer: {
                root: [
                    [/^\s*(digital_input|digital_output|analogue_input|analogue_output)\b/, 'keyword'],
                    [/[a-zA-Z_][a-zA-Z0-9_]*/, 'variable'],
                    [/;/, 'delimiter'],
                    { include: 'python' }
                ],
                python: [
                    [/[a-zA-Z_]\w*/, {
                        cases: {
                            '@keywords': 'keyword',
                            '@default': 'identifier'
                        }
                    }],
                    { include: '@whitespace' },
                    [/[{}()\[\]]/, '@brackets'],
                    [/[<>=\+\-\*\/%&|^!~]/, 'operator'],
                    [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                    [/\d+/, 'number'],
                    [/[;,.]/, 'delimiter'],
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
                ],
                whitespace: [
                    [/[ \t\r\n]+/, 'white'],
                    [/#.*$/, 'comment'],
                ],
                string: [
                    [/[^\\"]+/, 'string'],
                    [/\\./, 'string.escape'],
                    [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
                ],
            },
            keywords: [
                'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
                'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
                'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
                'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
            ]
        });

        // Apply theme
        monaco.editor.defineTheme('smarty-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
                { token: 'variable', foreground: '9cdcfe' },
                { token: 'comment', foreground: '6a9955' },
                { token: 'string', foreground: 'ce9178' },
            ],
            colors: {
                'editor.background': '#1e1e1e',
            }
        });
        monaco.editor.setTheme('smarty-dark');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateScript(id, { code_text: code });
            toast.success("Script saved");
        } catch (err) {
            toast.error("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleValidate = async (currentCode) => {
        try {
            const codeToValidate = currentCode !== undefined ? currentCode : code;
            console.log("Validating code:", codeToValidate);
            await updateScript(id, { code_text: codeToValidate });
            const res = await validateScript(id);
            console.log("Validation Result:", res.data);
            setDeclarations(res.data.declarations || []);

            let logMsg = "";
            if (res.data.status === 'invalid') {
                logMsg = `[Validation] Syntax Error: ${res.data.error}${res.data.line ? ` at line ${res.data.line}` : ''}`;
                toast.error("Syntax Error detected");
            } else if (res.data.status === 'error') {
                logMsg = `[Validation] Error: ${res.data.error}`;
                toast.error("Validation failed");
            } else {
                logMsg = "[Validation] Success: Script is valid.";
                toast.success("Validation successful!");
            }
            setScript(prev => ({ ...prev, last_execution_log: logMsg }));
        } catch (err) {
            console.warn("Validation failed", err);
            const msg = err.response?.data?.error || err.message;
            const logMsg = `[System] Validation Call Failed: ${msg}`;
            setScript(prev => ({ ...prev, last_execution_log: logMsg }));
            toast.error(`System error: ${msg}`);
        }
    };

    const updateBinding = (varName, pointId, direction) => {
        const newBindings = [...bindings.filter(b => b.variable_name !== varName)];
        if (pointId) {
            newBindings.push({
                variable_name: varName,
                point: pointId,
                direction: direction.includes('input') ? 'input' : 'output'
            });
        }
        setBindings(newBindings);
        saveBindings(id, newBindings).catch(() => toast.error("Failed to update binding"));
    };

    if (loading) return <div className="d-flex vh-100 justify-content-center align-items-center"><Spinner animation="border" /></div>;

    return (
        <div className="d-flex flex-column h-100 overflow-hidden">
            {/* Toolbar */}
            <div className="bg-dark text-white p-2 d-flex align-items-center justify-content-between border-bottom border-secondary">
                <div className="d-flex align-items-center">
                    <Button variant="link" className="text-white p-1 me-2" onClick={() => navigate('/')}>
                        <i className="fa fa-chevron-left"></i>
                    </Button>
                    <h5 className="mb-0 me-3">{script.name}</h5>
                    <Badge bg={script.last_execution_status === 'success' ? 'success' : 'danger'} className="me-2">
                        {script.last_execution_status || 'NOT EXECUTED'}
                    </Badge>
                </div>
                <div>
                    <Button variant="outline-light" size="sm" className="me-2" onClick={() => handleValidate()}>
                        <i className="fa fa-check"></i> Validate
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? <Spinner size="sm" /> : <i className="fa fa-save"></i>} Save
                    </Button>
                </div>
            </div>

            <Row className="flex-grow-1 g-0 overflow-hidden">
                {/* Left Sidebar: Bindings */}
                <Col md={2} className="h-100 d-flex flex-column bg-white border-end overflow-auto p-0">
                    <div className="p-3 border-bottom shadow-sm">
                        <h6>Variable Bindings ({declarations.length})</h6>
                        <small className="text-muted mb-3 d-block">Bind your DSL variables to IO Points</small>

                        <ListGroup variant="flush">
                            {declarations.map(decl => {
                                const currentBinding = bindings.find(b => b.variable_name === decl.name);
                                const isInput = decl.type.includes('input');
                                const filteredPoints = points.filter(p => isInput ? p.direction === 'Input' : p.direction === 'Output');

                                return (
                                    <ListGroup.Item key={decl.name} className="px-0 py-3 border-bottom">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <Badge bg={isInput ? 'info' : 'warning'} text="dark" className="me-2">
                                                    {decl.type.toUpperCase()}
                                                </Badge>
                                                <span className="font-monospace fw-bold">{decl.name}</span>
                                            </div>
                                        </div>

                                        <Form.Select
                                            size="sm"
                                            value={currentBinding?.point || ''}
                                            onChange={(e) => updateBinding(decl.name, e.target.value, decl.type)}
                                        >
                                            <option value="">-- No Binding --</option>
                                            {filteredPoints.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.point_type})</option>
                                            ))}
                                        </Form.Select>
                                    </ListGroup.Item>
                                );
                            })}
                            {declarations.length === 0 && (
                                <div className="text-center p-4 text-muted small border rounded bg-light">
                                    No declarations found. Add e.g.<br />
                                    <code>digital_input my_var;</code><br />
                                    at the top.
                                </div>
                            )}
                        </ListGroup>
                    </div>
                </Col>

                {/* Main Workspace (Editor + Logs) */}
                <Col md={10} className="h-100 d-flex flex-column">
                    {/* Monaco Editor */}
                    <div className="flex-grow-1 border-bottom border-secondary bg-dark">
                        <MonacoEditor
                            height="100%"
                            language="python"
                            value={code}
                            theme="smarty-dark"
                            onChange={(val) => setCode(val)}
                            onMount={handleEditorDidMount}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </div>

                    {/* Bottom Panel: Output / Logs */}
                    <div className="bg-light p-0" style={{ height: '200px' }}>
                        <div className="bg-secondary text-white px-3 py-1 d-flex justify-content-between align-items-center">
                            <small className="fw-bold">Execution & Validation Logs</small>
                            <Button variant="link" size="sm" className="text-white p-0" onClick={() => setScript(prev => ({ ...prev, last_execution_log: '' }))}>
                                <i className="fa fa-times-circle"></i> Clear
                            </Button>
                        </div>
                        <pre className="m-0 p-3 bg-dark text-info small overflow-auto font-monospace" style={{ height: 'calc(200px - 31px)' }}>
                            {script.last_execution_log || "Ready. Logs and validation errors will appear here."}
                        </pre>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default Editor;
