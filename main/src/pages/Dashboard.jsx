import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Tab, Tabs } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { getDashboardStats } from '../services/dashboardService';
import { Link } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
        // Poll every 30 seconds
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            const res = await getDashboardStats();
            setStats(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error loading stats", error);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-5 text-center">Loading Dashboard...</div>;
    if (!stats) return <div className="p-5 text-center text-danger">Failed to load dashboard data</div>;

    // Prepare Chart Data
    const alarmHistoryData = {
        labels: stats.alarms?.history?.map(h => h.start_time__date) || [],
        datasets: [
            {
                label: 'Alarms per Day',
                data: stats.alarms?.history?.map(h => h.count) || [],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.3
            }
        ]
    };

    const deviceStatusData = {
        labels: ['Online', 'Offline'],
        datasets: [
            {
                data: [stats.devices_status?.online || 0, stats.devices_status?.offline || 0],
                backgroundColor: ['#198754', '#dc3545'],
                borderWidth: 1,
            },
        ],
    };

    return (
        <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Dashboard</h2>
                <div className="text-muted">System Overview</div>
            </div>

            {/* Counts Section */}
            <Row className="mb-4">
                <Col md={2}>
                    <Card className="text-center shadow-sm border-0 bg-primary text-white">
                        <Card.Body>
                            <h3>{stats.counts?.devices || 0}</h3>
                            <div>Devices</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={2}>
                    <Card className="text-center shadow-sm border-0 bg-secondary text-white">
                        <Card.Body>
                            <h3>{stats.counts?.modules || 0}</h3>
                            <div>Modules</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={2}>
                    <Card className="text-center shadow-sm border-0 bg-info text-white">
                        <Card.Body>
                            <h3>{stats.counts?.points || 0}</h3>
                            <div>IO Points</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={2}>
                    <Card className="text-center shadow-sm border-0 bg-warning text-dark">
                        <Card.Body>
                            <h3>{stats.alarms?.active || 0}</h3>
                            <div>Active Alarms</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={2}>
                    <Card className="text-center shadow-sm border-0 bg-danger text-white">
                        <Card.Body>
                            <h3>{stats.faults?.active || 0}</h3>
                            <div>Active Faults</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={2}>
                    <Card className="text-center shadow-sm border-0 bg-dark text-white">
                        <Card.Body>
                            <h3>{stats.counts?.forced_points || 0}</h3>
                            <div>Forced Points</div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Charts & Graphs */}
            <Row className="mb-4">
                <Col md={8}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body>
                            <Card.Title>Alarm History (Last 7 Days)</Card.Title>
                            <div style={{ height: '300px' }}>
                                <Line options={{ maintainAspectRatio: false }} data={alarmHistoryData} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body>
                            <Card.Title>Device Connectivity</Card.Title>
                            <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
                                <Doughnut options={{ maintainAspectRatio: false }} data={deviceStatusData} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Functional Areas */}
            <Row>
                <Col md={8}>
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-white">
                            <Tabs defaultActiveKey="logs" id="dashboard-tabs" className="mb-3">
                                <Tab eventKey="logs" title="Recent Activity">
                                    <Table hover responsive>
                                        <thead>
                                            <tr>
                                                <th>Time</th>
                                                <th>Source</th>
                                                <th>Message</th>
                                                <th>Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.recent_logs?.map(log => (
                                                <tr key={log.id}>
                                                    <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                                                    <td>{log.source || '-'}</td>
                                                    <td>{log.message}</td>
                                                    <td>{log.value}</td>
                                                </tr>
                                            ))}
                                            {(!stats.recent_logs || stats.recent_logs.length === 0) && (
                                                <tr><td colSpan="4" className="text-center">No recent activity</td></tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </Tab>
                                {/* Future tabs: Forced Points list, Active Alarms list */}
                            </Tabs>
                        </Card.Header>
                    </Card>
                </Col>
                <Col md={4}>
                    {/* Quick Links */}
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-white">Quick Links</Card.Header>
                        <Card.Body>
                            <div className="d-grid gap-2">
                                <Button variant="outline-primary" as={Link} to="/modules">
                                    <i className="bi bi-box me-2"></i>Modules & Pages
                                </Button>
                                <Button variant="outline-success" as={Link} to="/devices">
                                    <i className="bi bi-cpu me-2"></i>Device Manager
                                </Button>
                                <Button variant="outline-secondary" href="/editor" target="_blank">
                                    <i className="bi bi-pencil-square me-2"></i>Graphic Editor
                                </Button>
                                <Button variant="outline-info" href="/api" target="_blank">
                                    <i className="bi bi-code-slash me-2"></i>API Documentation
                                </Button>
                                <Button variant="outline-dark" as={Link} to="/users/profile">
                                    <i className="bi bi-person-circle me-2"></i>System Settings
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Dashboard;
