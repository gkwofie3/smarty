import api from './api';

// Devices
export const getDevices = () => api.get('devices/');
export const getDevice = (id) => api.get(`devices/${id}/`);
export const createDevice = (data) => api.post('devices/', data);
export const updateDevice = (id, data) => api.put(`devices/${id}/`, data); // or patch
export const deleteDevice = (id) => api.delete(`devices/${id}/`);
export const duplicateDevice = (id, data) => api.post(`devices/${id}/duplicate/`, data);

// Registers
export const getRegisters = (deviceId) => api.get(`registers/?device=${deviceId}`);
export const getRegister = (id) => api.get(`registers/${id}/`);
export const createRegister = (data) => api.post('registers/', data);
export const updateRegister = (id, data) => api.put(`registers/${id}/`, data);
export const deleteRegister = (id) => api.delete(`registers/${id}/`);
export const duplicateRegister = (id, data) => api.post(`registers/${id}/duplicate/`, data);
