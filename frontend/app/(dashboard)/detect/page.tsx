'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, FileVideo, ImageIcon, Loader2, ScanLine, ShieldAlert, Upload, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { cameraService } from '@/services/cameraService';
import { ocrService, type PlateRecognitionResult } from '@/services/ocrService';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const HIGH_CONFIDENCE_THRESHOLD = 85;

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
      // Keep the complete video intact so the ANPR pipeline can perform
      // temporal vehicle tracking and multi-frame OCR fusion server-side.
      const detected = await ocrService.recognizePlates([file], cameraId, new Date().toISOString());
      setResults(detected);
      queryClient.invalidateQueries({ queryKey: ['recentAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['recentVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['trafficStats'] });
    } catch (recognitionError) {
      setError(recognitionError instanceof Error ? recognitionError.message : 'Plate recognition failed. Check the neural recognition engine and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const detectionCount = results.filter((result) => result.detected).length;

  return (
    <PageWrapper className="space-y-6 font-body">
      <div>
        <div className="flex items-center gap-3 flex-wrap"><h1 className="text-2xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2"><ScanLine className="text-cyan-400" /> AI Plate Detection</h1><Badge variant={recognitionStatus?.configured ? 'ok' : 'danger'} size="sm">{recognitionStatus?.configured ? `${recognitionStatus.provider} ready` : 'Recognition API key missing'}</Badge></div>
        <p className="mt-1 text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider">Upload evidence, run recognition, and save verified detections to the selected camera node.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GlassCard padding="lg" glow="cyan" className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-display font-bold uppercase tracking-wider text-[var(--text-secondary)]">Detection camera</label>
            <select value={cameraId} onChange={(event) => setCameraId(event.target.value)} disabled={camerasLoading || cameras.length === 0} className="w-full h-11 rounded-xl border border-[var(--glass-border)] bg-black/20 px-3 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400/60 disabled:opacity-50">
              {cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.cameraCode} · {camera.name}</option>)}
            </select>
          </div>

          {!file ? (
            <label className="min-h-72 border-2 border-dashed border-cyan-400/30 hover:border-cyan-400/60 rounded-2xl flex flex-col items-center justify-center gap-3 bg-cyan-500/[0.03] cursor-pointer transition-colors">
              <input type="file" accept="image/*,video/*" onChange={selectFile} className="hidden" />
              <Upload size={30} className="text-cyan-400" />
              <span className="text-sm font-display font-bold text-[var(--text-primary)]">Choose an image or video</span>
              <span className="max-w-sm text-center text-xs text-[var(--text-secondary)]">Images are sent directly. Videos are processed as a sequence so the ANPR tracker can fuse evidence across frames.</span>
            </label>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-black/40">
              {file.type.startsWith('video/') ? <video src={previewUrl || undefined} controls className="w-full max-h-80 object-contain" /> : <img src={previewUrl || undefined} alt="Selected evidence" className="w-full max-h-80 object-contain" />}
              <button onClick={clearFile} className="absolute top-3 right-3 rounded-lg bg-black/70 p-2 text-white hover:bg-rose-500/80" aria-label="Remove selected file"><X size={16} /></button>
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-[var(--text-secondary)]"><>{file.type.startsWith('video/') ? <FileVideo size={14} /> : <ImageIcon size={14} />}</> {file.name}</div>
            </div>
          )}

          {error && <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"><AlertCircle size={15} className="shrink-0" />{error}</div>}
          <Button type="button" variant="primary" size="lg" className="w-full" disabled={!file || !cameraId || isProcessing} onClick={runRecognition}>
            {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Analysing evidence…</> : <><ScanLine size={16} /> Run plate detection</>}
          </Button>
        </GlassCard>

        <GlassCard padding="lg" glow="violet" className="min-h-[420px]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--glass-border)] pb-4 mb-4"><div><h2 className="text-sm font-bold font-display text-[var(--text-primary)]">Detection results</h2><p className="text-xs text-[var(--text-secondary)] mt-1">Every successful match is persisted as an AI detection.</p></div>{results.length > 0 && <Badge variant={detectionCount > 0 ? 'ok' : 'warning'} size="sm">{detectionCount > 0 ? `${detectionCount} plates detected` : 'No plates detected'}</Badge>}</div>
          {results.length === 0 && !isProcessing && <div className="h-72 flex flex-col items-center justify-center text-center"><ScanLine size={38} className="text-cyan-400/30 mb-3" /><p className="text-xs font-mono text-[var(--text-secondary)]">Results appear here after recognition completes.</p></div>}
          {isProcessing && <div className="h-72 flex flex-col items-center justify-center text-center"><Loader2 size={34} className="animate-spin text-cyan-400 mb-3" /><p className="text-xs font-mono text-[var(--text-secondary)]">Recognition service is analysing the uploaded evidence.</p></div>}
          <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1">
            {results.map((result, index) => <div key={`${result.sourceFile}-${index}`} className={`rounded-xl border p-3 ${result.detected ? 'border-emerald-500/25 bg-emerald-500/[0.06]' : 'border-white/10 bg-white/[0.02]'}`}>
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-mono text-[var(--text-secondary)] truncate">{result.sourceFile}</span>{result.detected ? <CheckCircle2 size={16} className="shrink-0 text-emerald-400" /> : <AlertCircle size={16} className="shrink-0 text-amber-400" />}</div>
              {result.detected ? <div className="mt-2 flex items-center justify-between gap-3"><Link href={`/vehicles/${result.plateNumber}`} className="font-mono font-bold text-cyan-300 hover:text-white">{result.plateNumber}</Link><span className={`text-xs ${result.confidence >= HIGH_CONFIDENCE_THRESHOLD ? 'text-emerald-300' : 'text-amber-300'}`}>{result.confidence}% confidence · {result.confidence >= HIGH_CONFIDENCE_THRESHOLD ? 'Verified detection' : 'Low-confidence candidate'}</span>{result.isBlacklisted && <Badge variant="danger" size="sm"><ShieldAlert size={11} /> Blacklisted</Badge>}</div> : <p className="mt-2 text-xs text-[var(--text-secondary)]">{result.error || 'No readable plate was found in this frame.'}</p>}
            </div>)}
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
