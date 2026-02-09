import api from './api';

// Modules
export const getModules = () => api.get('modules/');
export const getModule = (id) => api.get(`modules/${id}/`);
export const createModule = (data) => api.post('modules/', data);
export const updateModule = (id, data) => api.put(`modules/${id}/`, data);
export const deleteModule = (id) => api.delete(`modules/${id}/`);
export const duplicateModule = (id, data) => api.post(`modules/${id}/duplicate/`, data);

// Pages
export const getPages = (moduleId) => {
    let url = 'pages/';
    if (moduleId) {
        url += `?module=${moduleId}`;
    }
    return api.get(url);
};
export const getPage = (id) => api.get(`pages/${id}/`);
export const createPage = (data) => api.post('pages/', data);
export const updatePage = (id, data) => api.put(`pages/${id}/`, data);
export const patchPage = (id, data) => api.patch(`pages/${id}/`, data);
export const deletePage = (id) => api.delete(`pages/${id}/`);
export const duplicatePage = (id, data) => api.post(`pages/${id}/duplicate/`, data);
