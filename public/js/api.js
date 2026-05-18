// API Configuration
const API_BASE_URL = '/api';

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const token = localStorage.getItem('token');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'API Error');
        }

        return result;
    } catch (error) {
        throw error;
    }
}

// APIs
const UserAPI = {
    register: (data) => apiCall('/users/register', 'POST', data),
    login: (credentials) => apiCall('/users/login', 'POST', credentials),
    getProfile: () => apiCall('/users/profile'),
    updateProfile: (data) => apiCall('/users/profile', 'PUT', data)
};

const EquipmentAPI = {
    getAvailable: () => apiCall('/equipment/available'),
};

const BookingAPI = {
    createBooking: (data) => apiCall('/bookings', 'POST', data),
    getUserBookings: () => apiCall('/bookings/user/my-bookings'),
    getDepartmentBookings: () => apiCall('/bookings/department'),
    returnEquipment: (id) => apiCall(`/bookings/${id}/return`, 'PUT'),
    sendWarning: (id) => apiCall(`/bookings/${id}/warn`, 'POST')
};

const NotificationAPI = {
    getNotifications: () => apiCall('/notifications'),
    markAsRead: (id) => apiCall(`/notifications/${id}/read`, 'PUT')
};
