import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('dayflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const data = error.response?.data;
    const errorMsg = data?.message || data?.detail || error.message || 'An unexpected error occurred';
    
    const customError = new Error(errorMsg);
    customError.status = error.response?.status;
    customError.errors = data?.errors || [];
    return Promise.reject(customError);
  }
);

export const HealthAPI = {
  check: () => apiClient.get('/health'),
};

export const AuthAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getMe: () => apiClient.get('/auth/me'),
};

export const EmployeeAPI = {
  list: (params) => apiClient.get('/employees', { params }),
  create: (data) => apiClient.post('/employees', data),
  get: (id) => apiClient.get(`/employees/${id}`),
  update: (id, data) => apiClient.put(`/employees/${id}`, data),
};

export const AttendanceAPI = {
  checkIn: () => apiClient.post('/attendance/check-in'),
  checkOut: () => apiClient.post('/attendance/check-out'),
  getStatus: () => apiClient.get('/attendance/status'),
  getMyLogs: () => apiClient.get('/attendance/my-logs'),
  getCompanyLogs: () => apiClient.get('/attendance/company'),
};

export const LeaveAPI = {
  getTypes: () => apiClient.get('/leave/types'),
  getAllocations: () => apiClient.get('/leave/allocations'),
  getMyRequests: () => apiClient.get('/leave/my-requests'),
  submitRequest: (data) => apiClient.post('/leave/request', data),
  getAdminRequests: () => apiClient.get('/leave/admin/requests'),
  reviewRequest: (id, data) => apiClient.put(`/leave/admin/requests/${id}/review`, data),
};

export const PayrollAPI = {
  getMySalary: () => apiClient.get('/payroll/my-salary'),
  getAdminStructures: () => apiClient.get('/payroll/admin/structures'),
  updateSalary: (empId, data) => apiClient.put(`/payroll/admin/structures/${empId}`, data),
};
