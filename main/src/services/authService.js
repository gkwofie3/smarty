import api from './api';

export const login = async (credentials) => {
    const response = await api.post('login/', credentials);
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Store user type if needed
        localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return api.post('logout/');
};

export const forgotPassword = (email) => api.post('forgot-password/', { email });
