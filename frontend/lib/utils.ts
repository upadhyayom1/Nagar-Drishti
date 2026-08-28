// Simple cn — concatenates class strings, filters falsy values
export function cn(...classes: (string | undefined | null | false | 0)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ── Date/Time Formatting ──────────────────────────────────────────────────────

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

export function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

export function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

// ── Numeric Formatting ────────────────────────────────────────────────────────

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

// ── Semantic Color Maps (Aurora Mint & Ice Cyan Palette) ─────────────────────

/** Returns a CSS hex color for a given status string */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'online':
    case 'normal':
    case 'ok':
    case 'low':       return '#00E6B0'; // Aurora Mint — healthy systems
    case 'warning':
    case 'watchlist':
    case 'moderate':
    case 'high':      return '#FFB547'; // Solar Amber — warnings
    case 'offline':
    case 'critical':
    case 'blacklist':
    case 'congested': return '#FF477E'; // Supernova Crimson — critical
    default:          return '#24CFFF'; // Ice Cyan — data / movement
  }
}

/** Returns Tailwind class strings for status badges */
export function getStatusBgClass(status: string): string {
  switch (status) {
    case 'online':
    case 'normal':
    case 'ok':
    case 'low':       return 'bg-[#00E6B0]/10 text-[#00E6B0] border border-[#00E6B0]/30 shadow-[0_0_12px_rgba(0,230,176,0.15)]';
    case 'warning':
    case 'watchlist':
    case 'moderate':
    case 'high':      return 'bg-[#FFB547]/10 text-[#FFB547] border border-[#FFB547]/30 shadow-[0_0_12px_rgba(255,181,71,0.15)]';
    case 'offline':
    case 'critical':
    case 'blacklist':
    case 'congested': return 'bg-[#FF477E]/10 text-[#FF477E] border border-[#FF477E]/30 shadow-[0_0_12px_rgba(255,71,126,0.15)]';
    default:          return 'bg-[#24CFFF]/10 text-[#24CFFF] border border-[#24CFFF]/30 shadow-[0_0_12px_rgba(36,207,255,0.15)]';
  }
}
