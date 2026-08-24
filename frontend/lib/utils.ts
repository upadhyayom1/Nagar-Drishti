// Simple cn utility — concatenates class names, filters out falsy values
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-IN');
}

export function formatSpeed(speed: number): string {
  return `${speed.toFixed(1)} km/h`;
}

export function formatDistance(distance: number): string {
  if (distance < 1) return `${(distance * 1000).toFixed(0)} m`;
  return `${distance.toFixed(1)} km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}h ${mins}m`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'online': case 'normal': case 'ok': case 'low': return 'var(--status-ok)';
    case 'warning': case 'watchlist': case 'moderate': case 'high': return 'var(--status-warn)';
    case 'offline': case 'critical': case 'blacklist': case 'congested': return 'var(--status-critical)';
    default: return 'var(--text-secondary)';
  }
}

export function getStatusBgClass(status: string): string {
  switch (status) {
    case 'online': case 'normal': case 'ok': case 'low': return 'bg-status-ok/10 text-status-ok';
    case 'warning': case 'watchlist': case 'moderate': case 'high': return 'bg-status-warn/10 text-status-warn';
    case 'offline': case 'critical': case 'blacklist': case 'congested': return 'bg-status-critical/10 text-status-critical';
    default: return 'bg-text-secondary/10 text-text-secondary';
  }
}

// Simulate network delay for mock services
export function delay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
