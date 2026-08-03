import axios from 'axios';

// Use VITE_API_BASE_URL (matches your .env.local) with fallback
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://os-ai-backend-v2-1.onrender.com/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
