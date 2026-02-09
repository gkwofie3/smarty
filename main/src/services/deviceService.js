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
export const createRegister = (data) => api.post('registers/', data);
export const updateRegister = (id, data) => api.patch(`registers/${id}/`, data);
export const deleteRegister = (id) => api.delete(`registers/${id}/`);
export const duplicateRegister = (id, data) => api.post(`registers/${id}/duplicate/`, data);

// Point Groups
export const getPointGroups = () => api.get('point-groups/');
export const getPointGroup = (id) => api.get(`point-groups/${id}/`);
export const createPointGroup = (data) => api.post('point-groups/', data);
export const updatePointGroup = (id, data) => api.put(`point-groups/${id}/`, data);
export const deletePointGroup = (id) => api.delete(`point-groups/${id}/`);
export const duplicatePointGroup = (id, data) => api.post(`point-groups/${id}/duplicate/`, data);

// Points
export const getPoints = (groupId) => api.get(`points/?point_group=${groupId}`);
export const createPoint = (data) => api.post('points/', data);
export const updatePoint = (id, data) => api.patch(`points/${id}/`, data);
export const deletePoint = (id) => api.delete(`points/${id}/`);
export const duplicatePoint = (id, data) => api.post(`points/${id}/duplicate/`, data);
