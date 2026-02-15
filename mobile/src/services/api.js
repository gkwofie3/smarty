import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_SERVER = 'http://localhost:5000'; // Change to local IP for physical device testing
const PROXY_DOMAIN = 'smartymobile.rovidgh.com';

const api = axios.create({
    timeout: 10000,
});

// Helper to get formatted Base URL
export const getBaseUrl = async () => {
    const config = await AsyncStorage.getItem('smarty_config');
    const { systemId, isRemote, localIp } = config ? JSON.parse(config) : {};

    if (isRemote && systemId) {
        return `https://${PROXY_DOMAIN}/${systemId}/api/`;
    }

    return localIp ? `http://${localIp}:5000/api/` : `${DEFAULT_SERVER}/api/`;
};

// Request Interceptor to dynamicly update Base URL
api.interceptors.request.use(async (request) => {
    const baseUrl = await getBaseUrl();
    request.baseURL = baseUrl;

    const token = await AsyncStorage.getItem('smarty_token');
    if (token) {
        request.headers.Authorization = `Token ${token}`;
    }
    return request;
});

export default api;
