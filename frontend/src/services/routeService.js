import client from './api';
import { mockRoutes } from '../data/mockData';

const isDemo = () => import.meta.env.VITE_DEMO_MODE === 'true';

export const routeService = {
  async getRoutes() {
    try {
      const res = await client.get('/routes');
      return res.data;
    } catch (err) {
      if (isDemo()) {
        return mockRoutes;
      }
      throw err;
    }
  },

  async getRouteById(routeId) {
    try {
      const res = await client.get(`/routes/${routeId}`);
      return res.data;
    } catch (err) {
      if (isDemo()) {
        const found = mockRoutes.find((r) => r.id === routeId) || mockRoutes[0];
        if (found) return found;
      }
      throw err;
    }
  },

  async generateRoute(goalData) {
    try {
      const res = await client.post('/routes/generate', goalData);
      return res.data;
    } catch (err) {
      if (isDemo()) {
        return {
          id: `demo-route-${Date.now()}`,
          title: goalData.career_title || goalData.goal || 'New Learning Route',
          progress: 0,
          status: 'active',
          is_current: true,
          current_stage: 'Starting Stage',
          stages: [],
        };
      }
      throw err;
    }
  },

  async createRoute(goalData) {
    return this.generateRoute(goalData);
  },

  async pauseRoute(routeId) {
    try {
      const res = await client.patch(`/routes/${routeId}/pause`);
      return res.data;
    } catch (err) {
      if (isDemo()) return { success: true };
      throw err;
    }
  },

  async resumeRoute(routeId) {
    try {
      const res = await client.patch(`/routes/${routeId}/resume`);
      return res.data;
    } catch (err) {
      if (isDemo()) return { success: true };
      throw err;
    }
  },

  async deleteRoute(routeId) {
    try {
      const res = await client.delete(`/routes/${routeId}`);
      return res.data;
    } catch (err) {
      if (isDemo()) return { success: true };
      throw err;
    }
  },
};
