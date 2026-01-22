import axios from 'axios';
import { LoginRequest, LoginResponse } from '../types/auth';

const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('local')) {
    return 'http://localhost:44344'; 
  }
  return 'https://cms.wininvoice.vn';
};

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 8000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login'; // Chuyển hướng về trang đăng nhập
        }
        return Promise.reject(error);
    }
)

export const loginAPI = async (
    loginName: string,
    password: string
): Promise<LoginResponse> => {
    try {
        const response = await apiClient.post('/api/SALE_WEB/login', {
            loginName,
            password,
            cmpnID: '00',
            languageDefault: 'VN',
            workstationDate: '',
        } as LoginRequest);
        return response.data as LoginResponse;
    } catch (error: any) {
        if (error.response) {
            return {
                success: false,
                message: error.response.data?.message || 'Đăng nhập thất bại',
            };
        } else if (error.request) {
            return {
                success: false,
                message: 'Không thể kết nối đến server',
            };
        } else {
            return {
                success: false,
                message: error.message || 'Có lỗi xảy ra',
            };
        }
    }
};

export default apiClient;
