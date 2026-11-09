import axios from 'axios';

let envUrl = (import.meta.env.VITE_API_URL || '/api').trim();
if (envUrl.startsWith('http') && !envUrl.endsWith('/api')) {
  envUrl = envUrl.replace(/\/+$/, '') + '/api';
}

const API_BASE_URL = envUrl;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tiruppur_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tiruppur_token');
      localStorage.removeItem('tiruppur_user');
      // Let app context handle redirect smoothly
    }
    return Promise.reject(error);
  }
);

