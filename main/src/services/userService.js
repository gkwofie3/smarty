import api from './api';

export const getUsers = () => api.get('users/');
export const getUser = (id) => api.get(`users/${id}/`);
export const createUser = (userData) => api.post('users/', userData);
export const updateUser = (id, userData) => api.patch(`users/${id}/`, userData); // Using PATCH for partial updates usually
export const deleteUser = (id) => api.delete(`users/${id}/`);
export const resetPassword = (id, password) => api.post(`users/${id}/reset-password/`, { password });
