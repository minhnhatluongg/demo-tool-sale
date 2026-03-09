import axios from "axios";

const technicalApi = axios.create({
    baseURL: "https://api-erprc.win-tech.vn/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Add interceptor to include token in requests
technicalApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("technical_access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add interceptor to handle token refresh
technicalApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If token expired, try to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem("technical_refresh_token");
            if (refreshToken) {
                try {
                    // Here you would call a refresh endpoint if available
                    // For now, just redirect to login
                    localStorage.removeItem("technical_access_token");
                    localStorage.removeItem("technical_refresh_token");
                    window.location.href = "/technical/login";
                } catch (refreshError) {
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default technicalApi;
