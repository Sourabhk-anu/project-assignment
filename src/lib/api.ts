import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  getProfile: () =>
    api.get('/auth/me'),
  
  resetPassword: (email: string) =>
    api.post('/auth/reset-password', { email }),
};

// Users API
export const usersAPI = {
  getUsers: (params?: any) =>
    api.get('/users', { params }),
  
  getUser: (id: number) =>
    api.get(`/users/${id}`),
  
  createUser: (data: any) =>
    api.post('/users', data),
  
  updateUser: (id: number, data: any) =>
    api.put(`/users/${id}`, data),
  
  deleteUser: (id: number) =>
    api.delete(`/users/${id}`),
};

// Roles API
export const rolesAPI = {
  getRoles: (params?: any) =>
    api.get('/roles', { params }),
  
  getRole: (id: number) =>
    api.get(`/roles/${id}`),
  
  createRole: (data: any) =>
    api.post('/roles', data),
  
  updateRole: (id: number, data: any) =>
    api.put(`/roles/${id}`, data),
  
  updateRolePermissions: (id: number, permissions: any) =>
    api.put(`/roles/${id}/permissions`, { permissions }),
  
  deleteRole: (id: number) =>
    api.delete(`/roles/${id}`),
};

// Enterprises API
export const enterprisesAPI = {
  getEnterprises: (params?: any) =>
    api.get('/enterprises', { params }),
  
  getEnterprise: (id: number) =>
    api.get(`/enterprises/${id}`),
  
  createEnterprise: (data: any) =>
    api.post('/enterprises', data),
  
  updateEnterprise: (id: number, data: any) =>
    api.put(`/enterprises/${id}`, data),
  
  deleteEnterprise: (id: number) =>
    api.delete(`/enterprises/${id}`),
};

// Employees API
export const employeesAPI = {
  getEmployees: (params?: any) =>
    api.get('/employees', { params }),
  
  getEmployee: (id: number) =>
    api.get(`/employees/${id}`),
  
  createEmployee: (data: any) =>
    api.post('/employees', data),
  
  updateEmployee: (id: number, data: any) =>
    api.put(`/employees/${id}`, data),
  
  deleteEmployee: (id: number) =>
    api.delete(`/employees/${id}`),
};

// Products API
export const productsAPI = {
  getProducts: (params?: any) =>
    api.get('/products', { params }),
  
  getProduct: (id: number) =>
    api.get(`/products/${id}`),
  
  createProduct: (data: any) =>
    api.post('/products', data),
  
  updateProduct: (id: number, data: any) =>
    api.put(`/products/${id}`, data),
  
  deleteProduct: (id: number) =>
    api.delete(`/products/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: (params?: any) =>
    api.get('/dashboard', { params }),
};

export default api;