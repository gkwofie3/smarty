import api from './api';

export const getScripts = () => api.get('/script/programs/');
export const getScript = (id) => api.get(`/script/programs/${id}/`);
export const createScript = (data) => api.post('/script/programs/', data);
export const updateScript = (id, data) => api.patch(`/script/programs/${id}/`, data);
export const deleteScript = (id) => api.delete(`/script/programs/${id}/`);
export const duplicateScript = (id, data) => api.post(`/script/programs/${id}/duplicate/`, data);
export const updateScriptCode = (id, code) => api.patch(`/script/programs/${id}/update_code/`, { code_text: code });
export const getScriptBindings = (id) => api.get(`/script/programs/${id}/bindings/`);
export const saveScriptBindings = (id, bindings) => api.post(`/script/programs/${id}/bindings/`, bindings);
