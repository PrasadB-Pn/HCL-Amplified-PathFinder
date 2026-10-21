import client from './api';

export const authService = {
  async register({ name, email, password, confirmPassword }) {
    const res = await client.post('/auth/register', {
      name,
      email,
      password,
      confirm_password: confirmPassword,
    });
    if (res.data?.token) {
      localStorage.setItem('rm_token', res.data.token);
      localStorage.setItem('rm_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async login({ email, password }) {
    const res = await client.post('/auth/login', { email, password });
    if (res.data?.token) {
      localStorage.setItem('rm_token', res.data.token);
      localStorage.setItem('rm_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async refreshToken() {
    const res = await client.post('/auth/refresh');
    if (res.data?.token) {
      localStorage.setItem('rm_token', res.data.token);
      localStorage.setItem('rm_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getMe() {
    const res = await client.get('/auth/me');
    return res.data;
  },

  async logout() {
    try {
      await client.post('/auth/logout');
    } catch {
      // Client-side cleanup continues even if logout network request fails
    }
    localStorage.removeItem('rm_token');
    localStorage.removeItem('rm_user');
  },
};
