import api from './api';

// FBD Programs
export const getFBDPrograms = () => api.get('fbd/programs/');
export const getFBDProgram = (id) => api.get(`fbd/programs/${id}/`);
export const createFBDProgram = (data) => api.post('fbd/programs/', data);
export const updateFBDProgram = (id, data) => api.put(`fbd/programs/${id}/`, data);
export const deleteFBDProgram = (id) => api.delete(`fbd/programs/${id}/`);
export const duplicateFBDProgram = (id, data) => api.post(`fbd/programs/${id}/duplicate/`, data);
export const executeFBDProgram = (id) => api.post(`fbd/programs/${id}/execute/`);
