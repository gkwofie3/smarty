import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
// import axios from 'axios';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadPrograms();
    }, []);

    const loadPrograms = async () => {
        try {
            const res = await api.get('fbd/programs/');
            // Handle both array and paginated response
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setPrograms(data);
        } catch (err) {
            console.error("Failed to load programs", err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id) => {
        navigate(`/editor?id=${id}`);
    };

    const handleCreateNew = async () => {
        try {
            const res = await api.post('fbd/programs/', {
                name: "New Program",
                description: "Created from dashboard",
                diagram_json: { nodes: [], edges: [], layout: { width: 1920, height: 1080 } }
            });
            navigate(`/editor?id=${res.data.id}`);
        } catch (err) {
            console.error("Failed to create program", err);
            alert("Failed to create new program");
        }
    };

    return (
        <Container fluid className="p-4 bg-light min-vh-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="display-6">FBD Program Dashboard</h2>
                <Button variant="primary" onClick={handleCreateNew}>
                    <i className="fa fa-plus me-2"></i> Create New Program
                </Button>
            </div>

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <Table hover responsive className="mb-0 align-middle text-nowrap">
                        <thead className="bg-dark text-white">
                            <tr>
                                <th className="ps-4">Name</th>
                                <th>Status</th>
                                <th>Created At</th>
                                <th>Updated At</th>
                                <th className="text-end pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-5">
                                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                                        Loading programs...
                                    </td>
                                </tr>
                            ) : (!Array.isArray(programs) || programs.length === 0) ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-5 text-muted">
                                        No programs found. Create your first one!
                                    </td>
                                </tr>
                            ) : (
                                programs.map(prog => (
                                    <tr key={prog.id}>
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                                <div className="bg-info bg-opacity-10 text-info p-2 rounded me-3">
                                                    <i className="fa fa-code-branch"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-semibold">{prog.name}</div>
                                                    <small className="text-muted">{prog.description || 'No description'}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <Badge bg={prog.is_active ? 'success' : 'secondary'} className="px-2 py-1">
                                                {prog.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td>{new Date(prog.created_at).toLocaleDateString()}</td>
                                        <td>{new Date(prog.updated_at).toLocaleDateString()}</td>
                                        <td className="text-end pe-4">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-2"
                                                onClick={() => handleEdit(prog.id)}
                                            >
                                                <i className="fa fa-edit me-1"></i> Edit
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default DashboardPage;
