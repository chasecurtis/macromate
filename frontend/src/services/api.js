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
};

// Meal planning API calls
export const mealsAPI = {
    // Get meal suggestions based on macro goals
    getSuggestions: (mealType = null) => {
        const params = mealType ? { meal_type: mealType } : {};
        return api.get('/meals/suggestions/', { params });
    },
    
    // Get meal plan for a specific date
    getMealPlan: (date = null) => {
        const params = date ? { date } : {};
        return api.get('/meals/plan/', { params });
    },
    
    // Create or update meal plan
    saveMealPlan: (mealPlanData) => api.post('/meals/plan/', mealPlanData),
    
    // Get detailed recipe information
    getRecipe: (recipeId) => api.get(`/meals/recipe/${recipeId}/`),
    
    // Get all recipes (for search/browsing)
    getAllRecipes: (params = {}) => api.get('/meals/recipes/', { params })
};

// Shopping list API calls
export const shoppingListAPI = {
    // Generate shopping list from meal plans
    generate: (startDate, endDate = null) => api.post('/meal-planning/shopping-list/generate/', {
        start_date: startDate,
        end_date: endDate || startDate
    }),
    
    // Get existing shopping list
    get: (startDate, endDate = null) => {
        const params = { start_date: startDate };
        if (endDate) params.end_date = endDate;
        return api.get('/meal-planning/shopping-list/', { params });
    },
    
    // Mark shopping list as complete
    complete: (shoppingListId) => api.patch(`/meal-planning/shopping-list/${shoppingListId}/complete/`),
    
    // Delete shopping list
    delete: (shoppingListId) => api.delete(`/meal-planning/shopping-list/${shoppingListId}/`)
};

// Favorites API calls
export const favoritesAPI = {
    // Get all favorite recipes
    getAll: () => api.get('/meal-planning/favorites/'),
    
    // Add recipe to favorites
    add: (favoriteData) => api.post('/meal-planning/favorites/', favoriteData),
    
    // Update favorite recipe (rating, notes)
    update: (favoriteId, updateData) => api.patch(`/meal-planning/favorites/${favoriteId}/`, updateData),
    
    // Remove recipe from favorites
    remove: (favoriteId) => api.delete(`/meal-planning/favorites/${favoriteId}/`),
    
    // Check if recipe is favorited
    checkIsFavorite: (spoonacularId) => api.get(`/meal-planning/favorites/check/${spoonacularId}/`)
};

// Helper Functions for token management
export const tokenManager = {
    setToken: (token) => localStorage.setItem('token', token),
    getToken: () => localStorage.getItem('token'),
    removeToken: () => localStorage.removeItem('token'),
    isAuthenticated: () => !!localStorage.getItem('token'),
};

// Date utilities
export const dateUtils = {
    today: () => new Date().toISOString().split('T')[0],
    formatDate: (date) => {
        if (typeof date === 'string') return date;
        return date.toISOString().split('T')[0];
    },
    addDays: (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0];
    }
};

// API error handler
export const handleAPIError = (error) => {
    if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
            // Unauthorized - redirect to login
            tokenManager.removeToken();
            window.location.href = '/login';
            return 'Please log in again';
        } else if (status === 403) {
            return 'You do not have permission to perform this action';
        } else if (status === 404) {
            return 'The requested resource was not found';
        } else if (status === 400) {
            // Bad request - return specific error message
            if (typeof data === 'object' && data.error) {
                return data.error;
            } else if (typeof data === 'string') {
                return data;
            } else {
                return 'Invalid request. Please check your input.';
            }
        } else if (status >= 500) {
            return 'Server error. Please try again later.';
        }
        
        return data.error || data.message || 'An error occurred';
    } else if (error.request) {
        // Network error
        return 'Network error. Please check your connection.';
    } else {
        // Other error
        return error.message || 'An unexpected error occurred';
    }
};

// Nutrition calculation utilities
export const nutritionUtils = {
    calculateTotalMacros: (recipes) => {
        return recipes.reduce((totals, recipe) => {
            if (!recipe) return totals;
            
            return {
                calories: totals.calories + (recipe.calories || 0),
                proteins: totals.proteins + (recipe.proteins || 0),
                carbohydrates: totals.carbohydrates + (recipe.carbohydrates || 0),
                fats: totals.fats + (recipe.fats || 0)
            };
        }, {
            calories: 0,
            proteins: 0,
            carbohydrates: 0,
            fats: 0
        });
    },
    
    calculateProgressPercentage: (current, goal) => {
        if (!goal || goal === 0) return 0;
        return Math.min((current / goal) * 100, 100);
    },
    
    getMacroColor: (macroType) => {
        const colors = {
            calories: 'primary',
            proteins: 'success',
            carbohydrates: 'warning',
            fats: 'error'
        };
        return colors[macroType] || 'primary';
    }
};

// Recipe utilities
export const recipeUtils = {
    formatRecipeForDisplay: (recipe) => ({
        ...recipe,
        calories: Math.round(recipe.calories || 0),
        proteins: Math.round(recipe.proteins || 0),
        carbohydrates: Math.round(recipe.carbohydrates || 0),
        fats: Math.round(recipe.fats || 0),
        image: recipe.image || '/placeholder-recipe.jpg'
    }),
    
    extractMealTypeFromRecipe: (recipe) => {
        return recipe.meal_type || 'unknown';
    },
    
    parseInstructions: (instructions) => {
        if (!instructions) return [];
        
        return instructions
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .split(/\d+\.|\n/) // Split by numbered steps or newlines
            .filter(step => step.trim().length > 10) // Filter out short/empty steps
            .map(step => step.trim());
    }
};

export default api;