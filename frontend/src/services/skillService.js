import client from './api';
import { mockSkills, mockSkillGaps } from '../data/mockData';

const isDemo = () => import.meta.env.VITE_DEMO_MODE === 'true';

export const skillService = {
  async getSkills() {
    try {
      const res = await client.get('/skills');
      return res.data;
    } catch (err) {
      if (isDemo()) {
        return mockSkills;
      }
      throw err;
    }
  },

  async getSkillGaps(targetCareer) {
    try {
      if (targetCareer) {
        const res = await client.post('/recommendations/skill-gap', { target_career: targetCareer });
        return res.data;
      }
      const res = await client.get('/skills/gaps');
      return res.data;
    } catch (err) {
      if (isDemo()) {
        return { skill_gaps: mockSkillGaps, priority_gaps: { HIGH: mockSkillGaps } };
      }
      throw err;
    }
  },
};
