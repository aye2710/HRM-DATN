import axios from 'axios';

const envApiUrl = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim() : '';
const isProdBrowser =
  import.meta.env.PROD ||
  (typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1');

export const API_BASE_URL = (envApiUrl || (isProdBrowser ? '' : 'http://localhost:5000')).replace(/\/$/, '');

export function apiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

function attachInterceptors(instance) {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        const isLoginRequest = error.config?.url?.includes('/api/auth/login');
        const isInternalPath =
          window.location.pathname.startsWith('/internal') ||
          window.location.pathname.startsWith('/employee');
        if (!isLoginRequest && isInternalPath && localStorage.getItem('token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
}

export const api = axios.create({
  baseURL: API_BASE_URL
});

attachInterceptors(api);

let initialized = false;
export function setupAxiosDefaults() {
  if (initialized) return;
  initialized = true;
  axios.defaults.baseURL = API_BASE_URL;
  attachInterceptors(axios);
}

export default api;
