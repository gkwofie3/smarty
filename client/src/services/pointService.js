import api from './api';

// Point Groups
export const getPointGroups = () => api.get('point-groups/');
export const getPointGroup = (id) => api.get(`point-groups/${id}/`);
export const createPointGroup = (data) => api.post('point-groups/', data);
export const updatePointGroup = (id, data) => api.put(`point-groups/${id}/`, data);
export const deletePointGroup = (id) => api.delete(`point-groups/${id}/`);
export const duplicatePointGroup = (id, data) => api.post(`point-groups/${id}/duplicate/`, data);

// Points
export const getPoints = (groupId) => api.get(`points/?point_group=${groupId}`);
export const getPoint = (id) => api.get(`points/${id}/`);
export const createPoint = (data) => api.post('points/', data);
export const updatePoint = (id, data) => api.put(`points/${id}/`, data);
export const deletePoint = (id) => api.delete(`points/${id}/`);
export const duplicatePoint = (id, data) => api.post(`points/${id}/duplicate/`, data);
