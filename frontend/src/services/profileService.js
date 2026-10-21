import client from './api';
import { mockProfile, mockCareerRecommendations } from '../data/mockData';

const isDemo = () => import.meta.env.VITE_DEMO_MODE === 'true';

export const profileService = {
  async getProfile() {
    try {
      const res = await client.get('/users/me');
      return res.data;
    } catch (err) {
      if (isDemo()) {
        return mockProfile;
      }
      throw err;
    }
  },

  async updateProfile(data) {
    try {
      const res = await client.put('/users/me', data);
      return res.data;
    } catch (err) {
      if (isDemo()) {
        return { ...mockProfile, ...data };
      }
      throw err;
    }
  },

  async getCareerRecommendation(profileData) {
    try {
      const res = await client.post('/recommendations/career', profileData);
      return res.data;
    } catch (err) {
      if (isDemo()) {
        return mockCareerRecommendations;
      }
      throw err;
    }
  },
};
