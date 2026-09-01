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
  login: async (identifier: string, password: string): Promise<{ user: User; message: string }> => {
    // Send the legacy field too so this frontend can talk to an API that has
    // not yet been restarted/deployed with identifier-based login support.
    const response = await apiClient.post('/auth/login', { identifier, username: identifier, password });
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
