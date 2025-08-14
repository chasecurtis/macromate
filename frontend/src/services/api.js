import axios from 'axios';

// Create an axios instance with base configuration
const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

// Auth API calls
export const authAPI = {
    signup: (userData) => api.post('/accounts/signup/', userData),
    login: (credentials) => api.post('/accounts/login/', credentials),
    logout: () => api.post('/accounts/logout/'),
    getUserInfo: () => api.get('/accounts/info')
};

// Helper Functions for token management
export const tokenManager = {
    setToken: (token) => localStorage.setItem('token', token),
    getToken: () => localStorage.getItem('token'),
    removeToken: () => localStorage.removeItem('token'),
    isAuthenticated: () => !!localStorage.getItem('token'),
};

export default api;