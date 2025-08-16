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

// Macro goals API calls
export const macroGoalAPI = {
    // get user's current macro goals
    get: () => api.get('/meal-planning/macro-goals/'),
    // create new macro goals
    create: (macroData) => api.post('/meal-planning/macro-goals/', macroData),
    // update goals
    update: (macroData) => api.put('/meal-planning/macro-goals/', macroData)
}

// Helper Functions for token management
export const tokenManager = {
    setToken: (token) => localStorage.setItem('token', token),
    getToken: () => localStorage.getItem('token'),
    removeToken: () => localStorage.removeItem('token'),
    isAuthenticated: () => !!localStorage.getItem('token'),
};


export default api;