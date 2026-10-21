import client from './api';
import { mockProgress } from '../data/mockData';

const isDemo = () => import.meta.env.VITE_DEMO_MODE === 'true';

export const progressService = {
  async getProgress() {
    try {
      const res = await client.get('/progress');
      return res.data;
    } catch (err) {
      if (isDemo()) {
        return mockProgress;
      }
      throw err;
    }
  },

  async logActivity(day, hours) {
    try {
      const res = await client.post('/progress/activity', { day, hours });
      return res.data;
    } catch (err) {
      if (isDemo()) {
        return { ...mockProgress, thisWeekHours: (mockProgress.thisWeekHours || 0) + hours };
      }
      throw err;
    }
  },

  async completeStage(stageId, skillName) {
    try {
      const res = await client.post('/progress/complete-stage', {
        stage_id: stageId,
        skill_name: skillName,
      });
      return res.data;
    } catch (err) {
      if (isDemo()) return mockProgress;
      throw err;
    }
  },
};
