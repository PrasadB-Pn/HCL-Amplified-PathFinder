import client from './api';
import { mockResources } from '../data/mockData';

const isDemo = () => import.meta.env.VITE_DEMO_MODE === 'true';

export const resourceService = {
  async getResources(filter) {
    try {
      const res = await client.get('/resources', { params: filter });
      return res.data;
    } catch (err) {
      if (isDemo()) {
        return mockResources;
      }
      throw err;
    }
  },

  async getRecommended() {
    try {
      const res = await client.get('/resources/recommended');
      return res.data;
    } catch (err) {
      if (isDemo()) {
        return mockResources.filter((r) => r.is_current || r.relevance >= 85);
      }
      throw err;
    }
  },

  async getResourceById(id) {
    try {
      const res = await client.get(`/resources/${id}`);
      return res.data;
    } catch (err) {
      if (isDemo()) {
        const found = mockResources.find((r) => r.id === id) || mockResources[0];
        if (found) return found;
      }
      throw err;
    }
  },
};
