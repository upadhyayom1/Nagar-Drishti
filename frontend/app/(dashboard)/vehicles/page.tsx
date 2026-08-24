'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, Car, Eye, MapPin, Star } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { vehicleService } from '@/services/vehicleService';
import type { Vehicle } from '@/types';

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const statusVariant = vehicle.status === 'blacklist' ? 'danger' : vehicle.status === 'watchlist' ? 'warning' : 'default';

  return (
    <Link href={`/vehicles/${vehicle.plate}`}>
      <GlassCard hover className="h-full">
        <div className="flex items-start justify-between mb-3">
          <span className="text-lg font-data font-semibold text-accent-cyan">{vehicle.plate}</span>
          <Badge variant={statusVariant} size="sm">{vehicle.status}</Badge>
        </div>
        <div className="space-y-2 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <Car size={12} />
            <span>{vehicle.vehicleType} • {vehicle.color}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye size={12} />
            <span><span className="font-data text-text-primary">{vehicle.totalDetections}</span> detections</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={12} />
            <span><span className="font-data text-text-primary">{vehicle.camerasVisited}</span> cameras visited</span>
          </div>
        </div>
        {vehicle.registeredCity && (
          <p className="text-[10px] text-text-secondary mt-2 pt-2 border-t border-border-glass">
            Registered: {vehicle.registeredCity}
          </p>
        )}
      </GlassCard>
    </Link>
  );
}

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: searchResults = [] } = useQuery({
    queryKey: ['vehicleSearch', searchQuery],
    queryFn: () => vehicleService.searchVehicles(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const { data: recentVehicles = [] } = useQuery({
    queryKey: ['recentVehicles'],
    queryFn: () => vehicleService.getRecentVehicles(8),
  });

  const displayVehicles = searchQuery.length > 0 ? searchResults : recentVehicles;

  return (
    <PageWrapper className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold font-display">Vehicle Intelligence</h1>
        <p className="text-sm text-text-secondary">
          Search and track any vehicle across the city-wide camera network
        </p>
        <div className="max-w-lg mx-auto">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter vehicle plate number (e.g., TN38AB1234)"
            showSearchIcon
            className="text-center font-data text-base py-3"
          />
        </div>
      </div>

      {/* Quick Access — Hero Vehicle */}
      {searchQuery.length === 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
            <Star size={14} className="text-accent-cyan" />
            Quick Access
          </h2>
          <Link href="/vehicles/TN38AB1234">
            <GlassCard hover className="max-w-md border-accent-cyan/20">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl font-data font-bold text-accent-cyan">TN38AB1234</span>
                  <p className="text-xs text-text-secondary mt-1">White Sedan • 4 cameras • 12 detections</p>
                </div>
                <Badge variant="info" size="sm">Featured</Badge>
              </div>
            </GlassCard>
          </Link>
        </div>
      )}

      {/* Results */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          {searchQuery.length > 0 ? `Search Results (${displayVehicles.length})` : 'Recent Vehicles'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.plate} vehicle={vehicle} />
          ))}
        </div>
        {searchQuery.length > 0 && displayVehicles.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            <Search size={48} className="mx-auto mb-3 opacity-30" />
            <p>No vehicles found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
