import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import axios from 'axios';

// Tự động điều hướng API sang server Cloud khi chạy trên Web Production
const remoteApi = import.meta.env.VITE_API_URL || '';
const isProduction = import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');

if (isProduction || remoteApi) {
  const targetBase = remoteApi ? remoteApi.replace(/\/$/, '') : '';
  
  axios.interceptors.request.use((config) => {
    if (config.url && config.url.includes('http://localhost:5000')) {
      config.url = config.url.replace('http://localhost:5000', targetBase);
    }
    return config;
  });

  const originalFetch = window.fetch;
  window.fetch = function (resource, init) {
    if (typeof resource === 'string' && resource.includes('http://localhost:5000')) {
      resource = resource.replace('http://localhost:5000', targetBase);
    }
    return originalFetch(resource, init);
  };
}

// Tự động đính kèm Token nội bộ vào header Authorization
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý khi token hết hạn
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const isLoginRequest = error.config?.url?.includes('/api/auth/login');
      const isInternalPath = window.location.pathname.startsWith('/internal') || window.location.pathname.startsWith('/employee');
      if (!isLoginRequest && isInternalPath && localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
