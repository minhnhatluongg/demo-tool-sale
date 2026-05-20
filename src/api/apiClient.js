import axios from "axios";

// Backend ERP_Portal_RC
// - Local (dev): https://localhost:7112/api
// - Production:  https://api-erprc.win-tech.vn/api
const baseURL = process.env.NODE_ENV === 'production'
  ? 'https://api-erprc.win-tech.vn/api'
  : 'https://localhost:7112/api';

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Gắn Bearer token (JWT) vào mọi request
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 401 → clear token + redirect login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
