import { apiClient, unwrapApiResponse } from './apiClient';

export interface User {
  id: string;
  username: string;
  role: string;
}

export const authService = {
  login: async (username: string, password: string): Promise<{ user: User; message: string }> => {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data.user;
  },
};

