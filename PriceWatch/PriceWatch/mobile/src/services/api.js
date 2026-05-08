// PriceWatch — services/api.js
import axios from 'axios';

const api = axios.create({
  // Em produção, substituir pela URL do servidor
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: loga erros 401 (token expirado)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Importação dinâmica para evitar dependência circular
      import('../store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
    }
    return Promise.reject(err);
  }
);

export default api;
