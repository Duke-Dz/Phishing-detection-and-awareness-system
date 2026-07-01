import axios from 'axios';

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiError";
    Object.assign(this, options);
  }
}

export const toApiError = (error) => {
  if (error instanceof ApiError) return error;
  const response = error?.response;
  const payload = response?.data || {};
  const validationMessage = payload.errors?.[0]?.message || payload.details?.[0]?.message;
  const isNetworkError = !response;
  const message = isNetworkError
    ? "We could not connect to CyberSense. Check your internet connection and try again."
    : validationMessage || payload.message || "We could not complete your request. Please try again.";

  return new ApiError(message, {
    status: response?.status || 0,
    code: payload.code || (isNetworkError ? "NETWORK_ERROR" : "REQUEST_FAILED"),
    fieldErrors: payload.errors || payload.details || [],
    retryAfter: Number(payload.retry_after_seconds) || 0,
    requestId: payload.request_id,
    isNetworkError,
    cause: error,
  });
};

export const getErrorMessage = (error, fallback = "We could not complete your request. Please try again.") =>
  toApiError(error).message || fallback;

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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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

    const originalRequest = error.config;

    // If the error is 401 and it's not a retry or the refresh endpoint itself
    if (error.response && error.response.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(toApiError(error));
      }

      return new Promise((resolve, reject) => {
        // Use a clean axios instance to avoid circular interceptor loops
        axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
          .then(({ data }) => {
            const newAuthData = data;
            
            localStorage.setItem('access_token', newAuthData.token);
            localStorage.setItem('refresh_token', newAuthData.refreshToken);
            
            api.defaults.headers.common['Authorization'] = 'Bearer ' + newAuthData.token;
            originalRequest.headers['Authorization'] = 'Bearer ' + newAuthData.token;
            
            processQueue(null, newAuthData.token);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            reject(toApiError(err));
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(toApiError(error));
  }
);

export default api;
