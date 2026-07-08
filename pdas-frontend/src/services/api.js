import axios from 'axios';

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiError";
    Object.assign(this, options);
  }
}

const SAFE_ERROR_MESSAGES = {
  AUTH_EXPIRED: "Your session has expired. Please sign in again.",
  BAD_REQUEST: "Please check your input and try again.",
  EMAIL_DELIVERY_UNAVAILABLE:
    "We could not send the email right now. Please try again shortly.",
  EMAIL_IN_USE: "Email already registered. Sign in or reset your password.",
  EMAIL_PENDING_VERIFICATION:
    "Registration pending. Check and verify your email to continue.",
  FORBIDDEN: "You do not have permission to perform this action.",
  INTERNAL_ERROR: "Server error. Please try again shortly.",
  INVALID_CREDENTIALS: "Incorrect email or password.",
  NETWORK_ERROR:
    "We could not connect to CyberSense. Check your internet connection and try again.",
  NOT_FOUND: "We could not find what you requested.",
  RATE_LIMITED: "Too many requests. Please wait and try again.",
  REQUEST_FAILED: "We could not complete your request. Please try again.",
  RESOURCE_CONFLICT: "That information is already in use.",
  SERVER_ERROR: "Server error. Please try again shortly.",
  SERVICE_UNAVAILABLE:
    "CyberSense is temporarily unavailable. Please try again shortly.",
  USERNAME_TAKEN: "Username already taken.",
  VALIDATION_ERROR: "Please check your input and try again.",
  VERIFICATION_RESEND_COOLDOWN:
    "Please wait before requesting another verification email.",
};

const statusToCode = (status) => {
  if (status >= 500) return "SERVER_ERROR";
  if (status === 401) return "INVALID_CREDENTIALS";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "RESOURCE_CONFLICT";
  if (status === 429) return "RATE_LIMITED";
  return "REQUEST_FAILED";
};

const getSafeMessage = ({ code, status, isNetworkError, validationMessage }) => {
  if (isNetworkError) return SAFE_ERROR_MESSAGES.NETWORK_ERROR;
  if (validationMessage && code === "VALIDATION_ERROR") return validationMessage;
  return (
    SAFE_ERROR_MESSAGES[code] ||
    SAFE_ERROR_MESSAGES[statusToCode(status)] ||
    SAFE_ERROR_MESSAGES.REQUEST_FAILED
  );
};

const sessionExpiredError = (error) =>
  new ApiError(SAFE_ERROR_MESSAGES.AUTH_EXPIRED, {
    status: error?.response?.status || 401,
    code: "AUTH_EXPIRED",
    fieldErrors: [],
    retryAfter: 0,
    requestId: error?.response?.data?.request_id,
    cause: error,
  });

export const toApiError = (error) => {
  if (error instanceof ApiError) return error;
  const response = error?.response;
  const payload = response?.data || {};
  const validationMessage = payload.errors?.[0]?.message || payload.details?.[0]?.message;
  const isNetworkError = !response;
  const status = response?.status || 0;
  const code = payload.code || (isNetworkError ? "NETWORK_ERROR" : statusToCode(status));
  const message = getSafeMessage({ code, status, isNetworkError, validationMessage });

  return new ApiError(message, {
    status,
    code,
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
  withCredentials: true,
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

const isAuthEndpoint = (url = "") =>
  ["/auth/login", "/auth/register", "/auth/refresh"].some((endpoint) =>
    String(url).includes(endpoint),
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

    const originalRequest = error.config;

    // If the error is 401 and it's not a retry or the refresh endpoint itself
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      const existingToken = localStorage.getItem("access_token");
      if (!existingToken) {
        localStorage.removeItem("access_token");
        return Promise.reject(sessionExpiredError(error));
      }

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

      return new Promise((resolve, reject) => {
        // Use a clean axios instance to avoid circular interceptor loops
        axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true })
          .then(({ data }) => {
            const newAuthData = data;
            
            localStorage.setItem('access_token', newAuthData.token);
            
            api.defaults.headers.common['Authorization'] = 'Bearer ' + newAuthData.token;
            originalRequest.headers['Authorization'] = 'Bearer ' + newAuthData.token;
            
            processQueue(null, newAuthData.token);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            const authError = sessionExpiredError(err);
            processQueue(authError, null);
            localStorage.removeItem('access_token');
            reject(authError);
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
