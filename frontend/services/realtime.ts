import { apiClient, unwrapApiResponse } from './apiClient';

export type RealtimeEvent = {
  type: string;
  data: any;
  timestamp: string;
};

export async function getWebSocketToken(): Promise<string> {
  const response = await apiClient.get<{ token: string }>('/auth/ws-token');
  return unwrapApiResponse(response).token;
}

export function getWebSocketUrl(token: string): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.trim();
  const base = configured || (() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (apiUrl) return apiUrl.replace(/^http/i, 'ws').replace(/\/api\/?$/, '');
    return 'ws://127.0.0.1:8000';
  })();

  return `${base.replace(/\/+$/, '')}/ws?token=${encodeURIComponent(token)}`;
}
