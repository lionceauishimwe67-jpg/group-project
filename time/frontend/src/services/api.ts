import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

const API_URL = process.env.REACT_APP_API_URL || '';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Create axios instance with professional defaults
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 10000,
});

// Request interceptor to add auth token and request ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for debugging
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
    }

    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and retry logic
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ✓ ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error: AxiosError<ApiResponse<any>>) => {
    const config = error.config as AxiosRequestConfig & { retryCount?: number };

    // Retry logic for network errors or 5xx errors
    if (
      config &&
      (!error.response || error.response.status >= 500) &&
      (config.retryCount || 0) < MAX_RETRIES
    ) {
      config.retryCount = (config.retryCount || 0) + 1;

      const retryCount = config.retryCount || 1;
      console.warn(`[API] Retry ${retryCount}/${MAX_RETRIES} for ${config.url}`);

      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
      return api(config);
    }

    // Handle specific error cases
    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case 401:
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/admin/login';
          break;

        case 403:
          console.error('[API] Forbidden access:', error.config?.url);
          break;

        case 404:
          console.error('[API] Resource not found:', error.config?.url);
          break;

        case 422:
          console.error('[API] Validation error:', error.response.data?.error);
          break;

        case 429:
          console.error('[API] Rate limited');
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          console.error('[API] Server error:', status);
          break;

        default:
          console.error('[API] Error:', status, error.response.data);
      }
    } else if (error.request) {
      console.error('[API] Network error - no response received');
    } else {
      console.error('[API] Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Utility function to handle API errors consistently
export const handleApiError = (error: AxiosError<ApiResponse<any>>): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response?.status === 401) {
    return 'Session expired. Please log in again.';
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (error.response?.status === 404) {
    return 'The requested resource was not found.';
  }

  if (error.response?.status && error.response.status >= 500) {
    return 'Server error. Please try again later.';
  }

  if (!error.response) {
    return 'Network error. Please check your connection.';
  }

  return 'An unexpected error occurred. Please try again.';
};

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/api/auth/login', { username, password }),
  register: (username: string, password: string) =>
    api.post('/api/auth/register', { username, password }),
  loginWithSecret: (secret: string) =>
    api.post('/api/auth/admin-secret', { secret }),
  verify: () => api.get('/api/auth/verify'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/api/auth/change-password', { currentPassword, newPassword }),
  registerTeacher: (data: any) =>
    api.post('/api/auth/register-teacher', data),
};

// Timetable API
export const timetableApi = {
  getCurrentSessions: (params?: { classId?: number; level?: string }) =>
    api.get('/api/timetable/current-sessions', { params }),
  getToday: (params?: { classId?: number; dayOfWeek?: number; level?: string }) =>
    api.get('/api/timetable/today', { params }),
  getWeek: (params?: { classId?: number; level?: string }) =>
    api.get('/api/timetable/week', { params }),
  getAll: (params?: { classId?: number; dayOfWeek?: number }) =>
    api.get('/api/timetable/entries', { params }),
  getById: (id: number) => api.get(`/api/timetable/entries/${id}`),
  create: (data: any) => api.post('/api/timetable', data),
  update: (id: number, data: any) => api.put(`/api/timetable/${id}`, data),
  delete: (id: number) => api.delete(`/api/timetable/${id}`),
  getReferenceData: () => api.get('/api/timetable/reference-data'),
};

// Announcements API
export const announcementApi = {
  getAll: () => api.get('/api/announcements'),
  getAllAdmin: () => api.get('/api/announcements/all'),
  getById: (id: number) => api.get(`/api/announcements/${id}`),
  create: (data: FormData) => api.post('/api/announcements', data),
  update: (id: number, data: FormData) => api.put(`/api/announcements/${id}`, data),
  delete: (id: number) => api.delete(`/api/announcements/${id}`),
  reorder: (orders: { id: number; display_order: number }[]) =>
    api.post('/api/announcements/reorder', { orders }),
  getAvailableImages: () => api.get('/api/announcements/images'),
};

// Display API
export const displayApi = {
  getConfig: (displayId: string) => api.get(`/api/display/config/${displayId}`),
  saveConfig: (displayId: string, data: any) =>
    api.post(`/api/display/config/${displayId}`, data),
  getAllConfigs: () => api.get('/api/display/configs'),
};

// Teachers API
export const teachersApi = {
  getAll: () => api.get('/api/teachers'),
  create: (data: any) => api.post('/api/teachers', data),
  update: (id: number, data: any) => api.post('/api/teachers', { ...data, id }),
  delete: (id: number) => api.delete(`/api/teachers/${id}`),
};

// Notifications API
export const notificationApi = {
  registerDeviceToken: (data: { deviceToken: string; teacherId?: number }) =>
    api.post('/api/notifications/device-token', data),
  updatePreferences: (data: { notificationEnabled?: boolean; notificationAdvanceMinutes?: number }) =>
    api.put('/api/notifications/preferences', data),
  getPreferences: () => api.get('/api/notifications/preferences'),
  getHistory: () => api.get('/api/notifications/history'),
  sendTestNotification: (data: { teacherId: number }) =>
    api.post('/api/notifications/test', data),
};

export default api;
