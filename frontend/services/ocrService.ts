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
};
