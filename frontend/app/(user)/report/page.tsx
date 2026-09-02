'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, AlertTriangle, CheckCircle2, ShieldAlert, Car, MapPin, User, Phone, FileText, Image as ImageIcon, Video, ArrowRight, RefreshCw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { submissionService } from '@/services/submissionService';
import type { CitizenSubmission } from '@/types';
import Link from 'next/link';

export default function CitizenReportPage() {
  const [priority, setPriority] = useState<'HIGH' | 'LOW'>('LOW');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterContact, setSubmitterContact] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [fileName, setFileName] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<CitizenSubmission | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      if (file.type.startsWith('video/')) {
        setMediaType('video');
      } else {
        setMediaType('image');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    if (!title.trim() || !description.trim() || !location.trim() || !Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submissionService.createSubmission({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        priority,
        submitterName: submitterName.trim(),
        submitterContact: submitterContact.trim() || undefined,
        vehiclePlate: vehiclePlate.trim().toUpperCase() || undefined,
        mediaType,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
      });
      setSubmittedResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setLatitude('');
    setLongitude('');
    setVehiclePlate('');
    setSubmitterContact('');
    setFileName(null);
    setPriority('LOW');
    setSubmittedResult(null);
  };

  if (submittedResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="py-12"
      >
        <GlassCard padding="lg" glow="teal" className="text-center max-w-xl mx-auto space-y-5 p-8 sm:p-10 border border-[var(--brand-teal)]/30">
          <div className="w-16 h-16 rounded-2xl bg-[var(--brand-teal)]/15 border border-[var(--brand-teal)]/30 flex items-center justify-center mx-auto text-[var(--brand-teal)] shadow-[0_0_24px_rgba(61,118,121,0.3)]">
            <CheckCircle2 size={32} />
          </div>

          <div>
            <Badge variant="ok" size="md" className="mb-2">Transmission Dispatched</Badge>
            <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">
              Incident Report Submitted
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-body leading-relaxed">
              Your field observation has been routed to the Prayagraj Municipal Command Center queue.
            </p>
          </div>

          {/* Receipt Box */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-[var(--glass-border)] text-left space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Reference ID:</span>
              <span className="text-[var(--brand-teal)] font-bold">{submittedResult.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Priority Level:</span>
              <span className={submittedResult.priority === 'HIGH' ? 'text-[var(--status-critical)] font-bold' : 'text-[var(--brand-teal)]'}>
                {submittedResult.priority} PRIORITY
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Location:</span>
              <span className="text-[var(--text-primary)] truncate max-w-[240px]">{submittedResult.location}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="secondary" size="md" onClick={handleReset} className="w-full sm:w-auto">
              <RefreshCw size={14} /> Submit Another Report
            </Button>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto">
                Open Command Center <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 py-4">

      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <Badge variant="cyan" size="sm">CITIZEN FIELD UPLOAD</Badge>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-display tracking-tight">
          Report Traffic &amp; Road Incident
        </h1>
        <p className="text-xs text-[var(--text-secondary)] font-body">
          Upload real-time observations, video recordings, or vehicle violations directly to municipal dispatchers.
        </p>
      </div>

      {/* Main Submission Card */}
      <GlassCard padding="lg" className="max-w-2xl mx-auto p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5 font-body">

          {/* ── Priority Toggle (High / Low) ── */}
          <div className="space-y-2">
            <label className="block text-xs font-display font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Incident Urgency / Priority Level
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPriority('HIGH')}
                className={`p-3 rounded-xl border text-left transition-all duration-150 flex items-start gap-3 ${
                  priority === 'HIGH'
                    ? 'bg-[var(--status-critical)]/15 border-[var(--status-critical)]/50 shadow-[0_0_20px_rgba(204,102,102,0.2)] text-white'
                    : 'bg-white/[0.02] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-white/[0.04]'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${priority === 'HIGH' ? 'bg-[var(--status-critical)]/20 text-[var(--status-critical)]' : 'bg-white/[0.04]'}`}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold font-display block">HIGH PRIORITY</span>
                  <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">
                    Accidents, signal violations, active road blockages
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPriority('LOW')}
                className={`p-3 rounded-xl border text-left transition-all duration-150 flex items-start gap-3 ${
                  priority === 'LOW'
                    ? 'bg-[var(--brand-teal)]/15 border-[var(--brand-teal)]/50 shadow-[0_0_20px_rgba(61,118,121,0.2)] text-white'
                    : 'bg-white/[0.02] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-white/[0.04]'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${priority === 'LOW' ? 'bg-[var(--brand-teal)]/20 text-[var(--brand-teal)]' : 'bg-white/[0.04]'}`}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold font-display block">LOW PRIORITY</span>
                  <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">
                    Potholes, illegal parking, slow congestion
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* ── Media Dropzone / Upload Box ── */}
          <div className="space-y-2">
            <label className="block text-xs font-display font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Upload Photographic or Video Evidence
            </label>
            <label className="relative border-2 border-dashed border-[var(--glass-border)] hover:border-[var(--brand-teal)]/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-teal)]/10 text-[var(--brand-teal)] border border-[var(--brand-teal)]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload size={22} />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  {fileName ? (
                    <span className="text-[var(--brand-teal)] font-mono flex items-center gap-1.5 justify-center">
                      {mediaType === 'video' ? <Video size={14} /> : <ImageIcon size={14} />} {fileName}
                    </span>
                  ) : (
                    'Click to upload or drag and drop image / video files'
                  )}
                </p>
                <p className="text-[10px] font-mono text-[var(--text-tertiary)] mt-1">
                  MP4, MOV, JPG, PNG up to 100MB (Local encrypted store)
                </p>
              </div>
            </label>
          </div>

          {/* ── Incident Details ── */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-display font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Incident Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reckless red light jumping at Civil Lines Crossing"
                required
                className="h-10 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-display font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Detailed Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred, direction of travel, number of vehicles involved..."
                rows={3}
                required
                className="w-full rounded-xl bg-[var(--glass-surface)] backdrop-blur-xl border border-[var(--glass-border)] p-3 text-xs text-[var(--text-primary)] font-body placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-teal)]/70 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-display font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Location / Junction *
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. MG Marg near High Court"
                  icon={<MapPin size={15} />}
                  required
                  className="h-10 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Vehicle License Plate (Optional)
                </label>
                <Input
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                  placeholder="e.g. UP70AB1234"
                  icon={<Car size={15} />}
                  className="h-10 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-display font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Latitude *</label>
                <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g. 25.4358" inputMode="decimal" required className="h-10 text-xs font-mono" />
              </div>
              <div>
                <label className="block text-[11px] font-display font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Longitude *</label>
                <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g. 81.8463" inputMode="decimal" required className="h-10 text-xs font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-display font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Submitter Name *
                </label>
                <Input
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  placeholder="Your Full Name"
                  icon={<User size={15} />}
                  required
                  className="h-10 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Contact Phone / Email
                </label>
                <Input
                  value={submitterContact}
                  onChange={(e) => setSubmitterContact(e.target.value)}
                  placeholder="+91 98390 00000"
                  icon={<Phone size={15} />}
                  className="h-10 text-xs"
                />
              </div>
            </div>
          </div>

          {/* ── Submit CTA ── */}
          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="w-full shadow-[0_0_25px_rgba(61,118,121,0.35)]"
            >
              {isSubmitting ? 'Transmitting Field Data"¦' : 'Submit Incident Report to Dispatch'}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
