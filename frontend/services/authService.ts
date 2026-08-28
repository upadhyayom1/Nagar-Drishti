import { apiClient } from './apiClient';

export interface User {
  id: string;
  username: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  role: 'ADMIN' | 'USER';
}

export const authService = {
  login: async (username: string, password: string): Promise<{ user: User; message: string }> => {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data as { user: User; message: string };
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return (response.data as { user: User }).user;
  },
};
