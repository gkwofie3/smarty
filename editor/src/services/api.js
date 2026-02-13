import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api/',
    // Content-Type will be set automatically by Axios (json by default, multipart for FormData)
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
