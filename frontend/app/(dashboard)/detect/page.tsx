'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, FileVideo, ImageIcon, Loader2, ScanLine, ShieldAlert, Upload, X, History, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { cameraService } from '@/services/cameraService';
import { ocrService, type PlateRecognitionResult, type PlateDetectionHistoryItem } from '@/services/ocrService';
import { DetectionHistoryModal } from '@/components/ocr/DetectionHistoryModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const MAX_VIDEO_FRAMES = 6;
const HIGH_CONFIDENCE_THRESHOLD = 85;

function waitForEvent(target: HTMLMediaElement, event: 'loadedmetadata' | 'seeked') {
  return new Promise<void>((resolve, reject) => {
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onFailure = () => {
      cleanup();
      reject(new Error('Unable to read the selected video'));
    };
    const cleanup = () => {
      target.removeEventListener(event, onSuccess);
      target.removeEventListener('error', onFailure);
    };
    target.addEventListener(event, onSuccess, { once: true });
    target.addEventListener('error', onFailure, { once: true });
  });
}

async function extractVideoFrames(file: File): Promise<File[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.preload = 'metadata';
  video.src = url;

  try {
    await waitForEvent(video, 'loadedmetadata');
    const frameCount = Math.min(MAX_VIDEO_FRAMES, Math.max(1, Math.ceil(video.duration)));
    const frames: File[] = [];

    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      video.currentTime = Math.min(video.duration, ((frameIndex + 0.5) / frameCount) * video.duration);
      await waitForEvent(video, 'seeked');
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (blob) frames.push(new File([blob], `${file.name}-frame-${frameIndex + 1}.jpg`, { type: 'image/jpeg' }));
    }

    if (frames.length === 0) throw new Error('No usable video frames were found');
    return frames;
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

export default function PlateDetectionPage() {
  const queryClient = useQueryClient();
  const { data: cameras = [], isLoading: camerasLoading } = useQuery({ queryKey: ['cameras'], queryFn: cameraService.getCameras });
  const { data: recognitionStatus } = useQuery({ queryKey: ['ocrStatus'], queryFn: ocrService.getStatus, refetchInterval: 30_000 });
  const [cameraId, setCameraId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [results, setResults] = useState<PlateRecognitionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState('');
  const [historyCameraId, setHistoryCameraId] = useState('');
  const [selectedHistory, setSelectedHistory] = useState<PlateDetectionHistoryItem | null>(null);

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['ocrHistory', historyPage, historySearch, historyCameraId],
    queryFn: () => ocrService.getHistory({ page: historyPage, limit: 10, search: historySearch, cameraId: historyCameraId }),
  });

  useEffect(() => {
    if (!cameraId && cameras[0]) setCameraId(cameras[0].id);
  }, [cameraId, cameras]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/') && !selected.type.startsWith('video/')) {
      setError('Choose an image or video file.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setResults([]);
    setError('');
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResults([]);
    setError('');
  };

  const runRecognition = async () => {
    if (!file || !cameraId) return;
    setIsProcessing(true);
    setError('');
    setResults([]);

    try {
      const frames = file.type.startsWith('video/') ? await extractVideoFrames(file) : [file];
      const detected = await ocrService.recognizePlates(frames, cameraId, new Date().toISOString());
      setResults(detected);
      queryClient.invalidateQueries({ queryKey: ['recentAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['recentVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['trafficStats'] });
      queryClient.invalidateQueries({ queryKey: ['ocrHistory'] });
    } catch (recognitionError) {
      setError(recognitionError instanceof Error ? recognitionError.message : 'Plate recognition failed. Check the backend recognition service and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const detectionCount = results.filter((result) => result.detected).length;

  return (
    <PageWrapper className="space-y-6 font-body">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
            <ScanLine className="text-cyan-400" /> AI Plate Detection
          </h1>
          <Badge variant={recognitionStatus?.configured ? 'ok' : 'danger'} size="sm">
            {recognitionStatus?.configured ? `${recognitionStatus.provider} ready` : 'Recognition API key missing'}
          </Badge>
        </div>
        <p className="mt-1 text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider">
          Upload evidence, run recognition, and save verified detections to the selected camera node.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GlassCard padding="lg" glow="cyan" className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-display font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Detection camera
            </label>
            <select
              value={cameraId}
              onChange={(event) => setCameraId(event.target.value)}
              disabled={camerasLoading || cameras.length === 0}
              className="w-full h-11 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400/60 disabled:opacity-50"
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id} className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                  {camera.cameraCode} · {camera.name}
                </option>
              ))}
            </select>
          </div>

          {!file ? (
            <label className="min-h-72 border-2 border-dashed border-cyan-400/30 hover:border-cyan-400/60 rounded-2xl flex flex-col items-center justify-center gap-3 bg-cyan-500/[0.03] cursor-pointer transition-colors">
              <input type="file" accept="image/*,video/*" onChange={selectFile} className="hidden" />
              <Upload size={30} className="text-cyan-400" />
              <span className="text-sm font-display font-bold text-[var(--text-primary)]">Choose an image or video</span>
              <span className="max-w-sm text-center text-xs text-[var(--text-secondary)]">
                Images are sent directly. Videos are sampled into up to six frames in your browser before recognition.
              </span>
            </label>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)]">
              {file.type.startsWith('video/') ? (
                <video src={previewUrl || undefined} controls className="w-full max-h-80 object-contain" />
              ) : (
                <img src={previewUrl || undefined} alt="Selected evidence" className="w-full max-h-80 object-contain" />
              )}
              <button
                onClick={clearFile}
                className="absolute top-3 right-3 rounded-lg bg-black/70 p-2 text-white hover:bg-rose-500/80 cursor-pointer"
                aria-label="Remove selected file"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-[var(--text-secondary)]">
                <>{file.type.startsWith('video/') ? <FileVideo size={14} /> : <ImageIcon size={14} />}</> {file.name}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full cursor-pointer"
            disabled={!file || !cameraId || isProcessing}
            onClick={runRecognition}
          >
            {isProcessing ? (
              <><Loader2 size={16} className="animate-spin" /> Analysing evidence…</>
            ) : (
              <><ScanLine size={16} /> Run plate detection</>
            )}
          </Button>
        </GlassCard>

        <GlassCard padding="lg" glow="violet" className="min-h-[420px]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--glass-border)] pb-4 mb-4">
            <div>
              <h2 className="text-sm font-bold font-display text-[var(--text-primary)]">Detection results</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Every successful match is persisted as an AI detection.</p>
            </div>
            {results.length > 0 && (
              <Badge variant={detectionCount > 0 ? 'ok' : 'warning'} size="sm">
                {detectionCount}/{results.length} matches
              </Badge>
            )}
          </div>

          {results.length === 0 && !isProcessing && (
            <div className="h-72 flex flex-col items-center justify-center text-center">
              <ScanLine size={38} className="text-cyan-400/30 mb-3" />
              <p className="text-xs font-mono text-[var(--text-secondary)]">Results appear here after recognition completes.</p>
            </div>
          )}

          {isProcessing && (
            <div className="h-72 flex flex-col items-center justify-center text-center">
              <Loader2 size={34} className="animate-spin text-cyan-400 mb-3" />
              <p className="text-xs font-mono text-[var(--text-secondary)]">Recognition service is analysing the uploaded evidence.</p>
            </div>
          )}

          <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1">
            {results.map((result, index) => (
              <div
                key={`${result.sourceFile}-${index}`}
                className={`rounded-xl border p-3 ${
                  result.detected
                    ? 'border-emerald-500/25 bg-emerald-500/[0.06]'
                    : 'border-[var(--glass-border)] bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-[var(--text-secondary)] truncate">{result.sourceFile}</span>
                  {result.detected ? (
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 text-amber-400" />
                  )}
                </div>

                {result.detected ? (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <Link href={`/vehicles/${result.plateNumber}`} className="font-mono font-bold text-cyan-400 hover:underline">
                      {result.plateNumber}
                    </Link>
                    <span className="text-xs text-emerald-400 font-semibold">{result.confidence}% confidence</span>
                    {result.isBlacklisted && (
                      <Badge variant="danger" size="sm"><ShieldAlert size={11} /> Blacklisted</Badge>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">{result.error || 'No readable plate was found in this frame.'}</p>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard padding="lg" glow="cyan">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-[var(--glass-border)] pb-4">
          <div>
            <h2 className="text-lg font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
              <History size={18} className="text-cyan-400" /> Detection History
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Browse past manual AI plate detections</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search plate..."
                value={historySearch}
                onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                className="w-full h-9 rounded-lg border border-[var(--glass-border)] bg-black/20 pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400/60"
              />
            </div>
            <select
              value={historyCameraId}
              onChange={(e) => { setHistoryCameraId(e.target.value); setHistoryPage(1); }}
              className="h-9 rounded-lg border border-[var(--glass-border)] bg-black/20 px-3 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400/60"
            >
              <option value="">All Cameras</option>
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>{camera.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {historyLoading ? (
            <div className="flex items-center justify-center h-48 text-cyan-400"><Loader2 size={24} className="animate-spin" /></div>
          ) : historyData?.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-[var(--text-secondary)]">
              <History size={32} className="opacity-20 mb-3" />
              <p className="text-sm">No historical detections found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3 pr-4 font-bold">Plate Number</th>
                  <th className="pb-3 pr-4 font-bold">Confidence</th>
                  <th className="pb-3 pr-4 font-bold">Camera</th>
                  <th className="pb-3 pr-4 font-bold">Date & Time</th>
                  <th className="pb-3 pr-4 font-bold">Source</th>
                  <th className="pb-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {historyData?.items.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3 pr-4">
                      <Link href={`/vehicles/${item.plateNumber}`} className="font-mono font-bold text-cyan-300 hover:text-white">
                        {item.plateNumber}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs ${item.confidenceScore >= HIGH_CONFIDENCE_THRESHOLD ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {item.confidenceScore}%
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-300">
                      {item.camera.name}
                    </td>
                    <td className="py-3 pr-4 text-xs font-mono text-gray-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="cyan" size="sm">{item.sourceType}</Badge>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedHistory(item)}
                        className="p-2 rounded-lg bg-white/5 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 opacity-0 group-hover:opacity-100"
                      >
                        <Eye size={14} /> <span className="text-xs">View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {historyData && historyData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--glass-border)]">
            <p className="text-xs text-gray-400">
              Showing page {historyData.pagination.page} of {historyData.pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={historyPage === 1}
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={historyPage === historyData.pagination.totalPages}
                onClick={() => setHistoryPage((p) => p + 1)}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      <DetectionHistoryModal
        item={selectedHistory}
        onClose={() => setSelectedHistory(null)}
      />
    </PageWrapper>
  );
}
