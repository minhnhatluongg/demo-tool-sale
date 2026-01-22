import axios from "axios";

// Direct connection to CMS backend
const baseURL = process.env.NODE_ENV === 'production'
  ? 'https://cms.wininvoice.vn/api'  // Direct to CMS backend
  : 'http://localhost:44344/api';     // Local development

const api = axios.create({
  baseURL,
  headers: { 
    "Content-Type": "application/json",
  },
});

// Add Basic Authentication if needed
// Uncomment and update credentials if backend requires authentication
// api.interceptors.request.use((config) => {
//   const username = 'admin';
//   const password = 'admin';
//   const basicAuth = btoa(`${username}:${password}`);
//   config.headers['Authorization'] = `Basic ${basicAuth}`;
//   return config;
// });

export default api;
