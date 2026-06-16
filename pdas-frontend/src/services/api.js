import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to inject the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh / 401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 503) {
      if (error.response.data?.code === "MAINTENANCE_MODE") {
        window.location.href = "/maintenance";
        return new Promise(() => {}); // Suspend promise chain so app doesn't crash
      }
    }

    // Token refresh logic goes here
    return Promise.reject(error);
  }
);

export default api;
