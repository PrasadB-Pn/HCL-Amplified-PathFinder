import client from './api';
import { mockProjects } from '../data/mockData';

const isDemo = () => import.meta.env.VITE_DEMO_MODE === 'true';

export const projectService = {
  async getProjects() {
    try {
      const res = await client.get('/projects');
      return res.data;
    } catch (err) {
      if (isDemo()) {
        return mockProjects;
      }
      throw err;
    }
  },

  async getProjectById(id) {
    try {
      const res = await client.get(`/projects/${id}`);
      return res.data;
    } catch (err) {
      if (isDemo()) {
        const found = mockProjects.find((p) => p.id === id) || mockProjects[0];
        if (found) return found;
      }
      throw err;
    }
  },

  async getRecommended() {
    try {
      const res = await client.get('/projects/recommended');
      return res.data;
    } catch (err) {
      if (isDemo()) {
        return mockProjects.filter((p) => p.status === 'recommended');
      }
      throw err;
    }
  },
};
