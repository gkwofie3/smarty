import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

export default api;

export const getScripts = () => api.get('/script/programs/');
export const getScript = (id) => api.get(`/script/programs/${id}/`);
export const updateScript = (id, data) => api.patch(`/script/programs/${id}/`, data);
export const validateScript = (id) => api.post(`/script/programs/${id}/validate/`);
export const executeScript = (id) => api.post(`/script/programs/${id}/execute/`);
export const saveBindings = (id, bindings) => api.post(`/script/programs/${id}/bindings/`, bindings);
export const getPoints = () => api.get('/points/');
