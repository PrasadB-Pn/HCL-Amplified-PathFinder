import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 15000,
});

// Request interceptor — attach token and CSRF header
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('rm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const csrfToken = getCookie('csrf_token');
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  return config;
});

// Response interceptor — handle 401 globally
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('rm_token');
      localStorage.removeItem('rm_user');
      // Only redirect if not already on public auth pages
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register' && path !== '/') {
        window.location.href = '/login';
      }
    }
    const message =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default client;
