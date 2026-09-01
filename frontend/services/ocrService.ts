import axios from 'axios';
import { apiClient, unwrapApiResponse } from './apiClient';

export interface PlateRecognitionResult {
  sourceFile: string;
  detected: boolean;
  plateNumber?: string;
  confidence: number;
  detectionId?: string;
  timestamp?: string;
  isBlacklisted?: boolean;
  error?: string;
  status?: 'VERIFIED' | 'LIKELY' | 'UNCERTAIN' | 'UNKNOWN';
  framesUsed?: number;
  reason?: string;
  historyId?: string;
}

export interface PlateDetectionHistoryItem {
  id: string;
  plateNumber: string;
  confidenceScore: number;
  cameraId: string;
  timestamp: string;
  sourceType: string;
  evidenceImage?: string;
  croppedPlateImage?: string;
  userId?: string;
  createdAt: string;
  camera: {
    name: string;
    cameraCode: string;
  };
  user?: {
    username: string;
    name: string | null;
  };
}

export interface PlateDetectionHistoryResponse {
  items: PlateDetectionHistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PlateRecognitionStatus {
  configured: boolean;
  provider: string;
}

export const ocrService = {
  async getStatus(): Promise<PlateRecognitionStatus> {
    return unwrapApiResponse(await apiClient.get<PlateRecognitionStatus>('/ocr/status'));
  },

  async recognizePlates(files: File[], cameraId: string, captureTime: string): Promise<PlateRecognitionResult[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('plateImages', file));
    formData.append('cameraId', cameraId);
    formData.append('captureTime', captureTime);

    const response = await axios.post<{ success: boolean; data: { results: PlateRecognitionResult[] } }>('/api/ocr', formData, {
      withCredentials: true,
    });

    return response.data.data.results;
  },

  async getHistory(params?: { page?: number; limit?: number; cameraId?: string; search?: string }): Promise<PlateDetectionHistoryResponse> {
    return unwrapApiResponse(await apiClient.get<PlateDetectionHistoryResponse>('/ocr/history', { params }));
  },

  async getHistoryById(id: string): Promise<PlateDetectionHistoryItem> {
    return unwrapApiResponse(await apiClient.get<PlateDetectionHistoryItem>(`/ocr/history/${id}`));
  },
};
