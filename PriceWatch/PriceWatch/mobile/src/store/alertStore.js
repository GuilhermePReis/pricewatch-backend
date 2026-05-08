// PriceWatch — store/alertStore.js
import { create } from 'zustand';
import api from '../services/api';

export const useAlertStore = create((set, get) => ({
  alerts:  [],
  loading: false,
  error:   null,

  fetchAlerts: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/alerts');
      set({ alerts: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createAlert: async (ticker, targetPrice, direction) => {
    try {
      const { data } = await api.post('/alerts', { ticker, targetPrice, direction });
      set(s => ({ alerts: [data, ...s.alerts] }));
      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Erro ao criar alerta' });
      return null;
    }
  },

  toggleAlert: async (alertId, active) => {
    try {
      const { data } = await api.patch(`/alerts/${alertId}`, { active });
      set(s => ({
        alerts: s.alerts.map(a => a.id === alertId ? { ...a, active: data.active } : a),
      }));
    } catch {}
  },

  deleteAlert: async (alertId) => {
    try {
      await api.delete(`/alerts/${alertId}`);
      set(s => ({ alerts: s.alerts.filter(a => a.id !== alertId) }));
    } catch {}
  },
}));

// PriceWatch — services/api.js
// (colocado aqui por conveniência; mover para services/api.js em produção)
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
