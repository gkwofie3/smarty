import React, { useState } from 'react';
import { Form, Button, Card, Container, Toast, ToastContainer } from 'react-bootstrap';
import { login } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await login({ username, password });
            if (data.user.admin_type !== 'superadmin') {
                setError('Access Denied: This application is for Super Admins only.');
                // Clear storage if it was set
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                return;
            }
            navigate('/'); // Redirect to dashboard
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid credentials');
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '400px' }}>
                <Card.Body>
                    <h2 className="text-center mb-4">Login</h2>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Button className="w-100" type="submit">Log In</Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Login;
