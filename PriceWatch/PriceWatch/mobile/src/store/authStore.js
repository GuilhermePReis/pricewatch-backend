// PriceWatch — store/authStore.js
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

// Token salvo de forma segura no keychain do dispositivo
const TOKEN_KEY = 'pricewatch_token';
const USER_KEY  = 'pricewatch_user';

export const useAuthStore = create((set, get) => ({
  token: null,
  user:  null,
  loading: false,
  error:   null,

  // ─── Login ─────────────────────────────────────────────
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      set({ token: data.token, user: data.user, loading: false });
      return true;
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao fazer login';
      set({ error: msg, loading: false });
      return false;
    }
  },

  // ─── Cadastro ──────────────────────────────────────────
  register: async (formData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', formData);
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      set({ token: data.token, user: data.user, loading: false });
      return true;
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors ? errors[0].msg : (err.response?.data?.error || 'Erro ao criar conta');
      set({ error: msg, loading: false });
      return false;
    }
  },

  // ─── Restaurar sessão ao abrir o app ──────────────────
  rehydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userRaw = await SecureStore.getItemAsync(USER_KEY);
      if (token && userRaw) {
        const user = JSON.parse(userRaw);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ token, user });
      }
    } catch {
      // SecureStore vazio ou corrompido: ignora
    }
  },

  // ─── Logout ────────────────────────────────────────────
  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
    set({ token: null, user: null });
  },

  // ─── Atualizar token FCM ───────────────────────────────
  updateFcmToken: async (fcmToken) => {
    try {
      await api.post('/auth/fcm-token', { fcmToken });
    } catch {
      // Não crítico
    }
  },
}));
