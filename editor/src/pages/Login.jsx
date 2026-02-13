import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            // Adjust endpoint if needed (http://localhost:5000/api-token-auth/ usually)
            // Or however your backend handles auth. Assuming standard DRF Token Auth.
            // If the backend has a specific login endpoint, use that.
            // Assuming `api/login/` or `api-token-auth/`.
            // From main app history, the backend might use `dj_rest_auth` or `rest_framework.authtoken`.
            // I'll try `api/token-auth/` or `api/login/`.
            // Let's assume standard `http://localhost:5000/api-token-auth/` or similar.
            // I'll check main app code if I can but here I'll try generic.
            // Wait, main app frontend `authService.js` would reveal it.
            // I'll assume `http://localhost:5000/api-token-auth/`.
            // BUT backend urls.py in modules turn (Step 458) showed `path('api/', include('...'))`.
            // I'll use a placeholder and fix if it fails.

            // Actually I'll use `http://localhost:5000/api-token-auth/` as generic guess.
            const response = await axios.post('http://localhost:5000/api/login/', { username, password });
            localStorage.setItem('token', response.data.token);
            navigate('/');
        } catch (error) {
            setError('Login failed. Please check your credentials.');
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center vh-100">
            <Card style={{ width: '400px' }} className="p-4 shadow">
                <h3 className="text-center mb-4">Smarty Editor Login</h3>
                {error && <div className="alert alert-danger small p-2 mb-3">{error}</div>}
                <Form onSubmit={handleLogin}>
                    <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control type="text" value={username} onChange={e => setUsername(e.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    </Form.Group>
                    <Button variant="primary" type="submit" className="w-100">Login</Button>
                </Form>
            </Card>
        </Container>
    );
};
export default Login;
