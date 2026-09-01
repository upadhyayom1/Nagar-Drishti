import React from 'react';
import { X, Calendar, MapPin, ScanLine, User, CheckCircle2 } from 'lucide-react';
import { PlateDetectionHistoryItem } from '@/services/ocrService';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';

interface DetectionHistoryModalProps {
  item: PlateDetectionHistoryItem | null;
  onClose: () => void;
}

export function DetectionHistoryModal({ item, onClose }: DetectionHistoryModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      
      <GlassCard glow="cyan" padding="lg" className="relative w-full max-w-lg overflow-hidden border border-cyan-500/30 bg-gray-950/90 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg bg-black/40 p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
            <ScanLine size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display text-white">Detection Details</h2>
            <p className="text-xs text-cyan-400/70 font-mono">ID: {item.id}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-6">
            <div className="text-4xl font-mono font-bold tracking-widest text-cyan-300 shadow-cyan-500/20 drop-shadow-md">
              {item.plateNumber}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 size={16} />
              <span>{item.confidenceScore}% Confidence</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                <MapPin size={14} /> Camera Node
              </span>
              <p className="text-sm font-mono text-gray-200">{item.camera.cameraCode} · {item.camera.name}</p>
            </div>
            <div className="space-y-1">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                <Calendar size={14} /> Timestamp
              </span>
              <p className="text-sm font-mono text-gray-200">{new Date(item.timestamp).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Source Type</span>
              <div>
                <Badge variant="primary" size="sm">{item.sourceType}</Badge>
              </div>
            </div>
            {item.user && (
              <div className="space-y-1">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <User size={14} /> Operator
                </span>
                <p className="text-sm text-gray-200">
                  {item.user.name || item.user.username}
                </p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
