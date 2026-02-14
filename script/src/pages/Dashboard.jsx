import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getScripts } from '../api';

const Dashboard = () => {
    const [scripts, setScripts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        getScripts().then(res => setScripts(res.data))
            .catch(err => {
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    navigate('/login');
                }
            });
    }, []);

    return (
        <Container className="py-5">
            <h1 className="mb-4">Script Dashboard</h1>
            <Card className="border-0 shadow-sm">
                <Table hover responsive className="mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th>Script Name</th>
                            <th>Status</th>
                            <th>Last Executed</th>
                            <th className="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scripts.map(s => (
                            <tr key={s.id}>
                                <td className="fw-bold">{s.name}</td>
                                <td>
                                    <Badge bg={s.is_active ? 'success' : 'secondary'}>
                                        {s.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </td>
                                <td>{s.last_execution_time ? new Date(s.last_execution_time).toLocaleString() : 'Never'}</td>
                                <td className="text-end">
                                    <Button variant="primary" size="sm" onClick={() => navigate(`/editor/${s.id}`)}>
                                        <i className="fa fa-code"></i> Open Editor
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>
        </Container>
    );
};

export default Dashboard;
