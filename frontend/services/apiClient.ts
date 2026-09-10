import axios, { type AxiosResponse } from 'axios';

const API_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export function unwrapApiResponse<T>(response: AxiosResponse<T | ApiEnvelope<T>>): T {
  const payload = response.data;
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}
