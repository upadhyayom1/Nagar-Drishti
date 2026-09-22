'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useQuery } from '@tanstack/react-query';
import { Plus, Minus, Crosshair, Navigation, Layers } from 'lucide-react';
import { roadService } from '@/services/roadService';
import { cameraService } from '@/services/cameraService';
import { useFilterStore } from '@/store/filterStore';
import { useUIStore } from '@/store/uiStore';
import type { Camera } from '@/types';
import {
  PRAYAGRAJ_CENTER,
  DEFAULT_ZOOM,
  camerasToGeoJSON,
  roadsToGeoJSON,
  camerasToDensityGeoJSON,
  createCameraPopupHTML,
} from './mapLibreUtils';
import {
  OPENFREEMAP_DARK_STYLE,
  OPENFREEMAP_LIGHT_STYLE,
  SOURCE_CAMERAS,
  SOURCE_ROADS,
  SOURCE_DENSITY,
  LAYER_CAMERAS_CORE,
  LAYER_CAMERAS_HALO,
  setupMapSources,
  setupMapLayers,
  updateSourceData,
  updateRoadsVisibility,
  updateHeatmapVisibility,
  updateDensityVisibility,
} from './mapLibreLayers';
import './NagarMapLibre.css';

// Explicitly configure static worker URL to bypass Turbopack worker-bundling bug
if (typeof window !== 'undefined' && typeof maplibregl.setWorkerUrl === 'function') {
  maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
}

export interface NagarMapLibreProps {
  cameras?: Camera[];
  center?: [number, number]; // [lat, lng] for API consistency with MapView, internally converted to [lng, lat]
  zoom?: number;
  className?: string;
  showControls?: boolean;
  onCameraSelect?: (camera: Camera) => void;
}

export function NagarMapLibre({
  cameras: propCameras,
  center,
  zoom = DEFAULT_ZOOM,
  className = '',
  showControls = true,
  onCameraSelect,
}: NagarMapLibreProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userTracking, setUserTracking] = useState(false);

  // Theme support: subscribe to UI store
  const theme = useUIStore((s) => s.theme);
  const isDark = theme !== 'light';
  const targetStyle = isDark ? OPENFREEMAP_DARK_STYLE : OPENFREEMAP_LIGHT_STYLE;
  const currentStyleRef = useRef<string>(targetStyle);

  // Filter store overlays
  const { showHeatmap, showTrajectories, showTrafficDensity } = useFilterStore();

  // Queries for backend data
  const { data: fetchedCameras = [] } = useQuery({
    queryKey: ['cameras'],
    queryFn: cameraService.getCameras,
    enabled: !propCameras,
  });

  const { data: roads = [] } = useQuery({
    queryKey: ['roads'],
    queryFn: roadService.getRoads,
  });

  const activeCameras = useMemo(
    () => propCameras || fetchedCameras,
    [propCameras, fetchedCameras]
  );

  // Synchronization refs to eliminate stale closure without re-binding listeners
  const activeCamerasRef = useRef(activeCameras);
  activeCamerasRef.current = activeCameras;

  const onCameraSelectRef = useRef(onCameraSelect);
  onCameraSelectRef.current = onCameraSelect;

  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  // Map center: converts [lat, lng] to [lng, lat]
  const targetCenter: [number, number] = useMemo(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      return [center[1], center[0]];
    }
    if (activeCameras.length > 0) {
      const avgLng = activeCameras.reduce((sum, c) => sum + c.lng, 0) / activeCameras.length;
      const avgLat = activeCameras.reduce((sum, c) => sum + c.lat, 0) / activeCameras.length;
      return [avgLng, avgLat];
    }
    return PRAYAGRAJ_CENTER;
  }, [center, activeCameras]);

  // Initialize MapLibre map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (typeof window !== 'undefined' && typeof maplibregl.setWorkerUrl === 'function') {
      const workerUrl = `${window.location.origin}/maplibre/maplibre-gl-worker.mjs`;
      maplibregl.setWorkerUrl(workerUrl);
    }

    currentStyleRef.current = targetStyle;

    // Instantiate map with theme-adaptive style (OpenFreeMap Dark or Positron)
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: targetStyle,
      center: targetCenter,
      zoom: zoom,
      pitch: 0,
      bearing: 0,
      attributionControl: false, // We add custom styled attribution
    });

    map.on('error', (e) => {
      // Log any map rendering or style warnings
      if (e?.error) {
        console.warn('[MapLibre Warning]:', e.error.message || e.error);
      }
    });

    // Custom attribution control with OpenFreeMap credits
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
          '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      }),
      'bottom-right'
    );

    map.on('load', () => {
      // Setup sources with initial data
      const camerasData = camerasToGeoJSON(activeCamerasRef.current);
      const roadsData = roadsToGeoJSON(roads);
      const densityData = camerasToDensityGeoJSON(activeCamerasRef.current);

      setupMapSources(map, camerasData, roadsData, densityData);
      setupMapLayers(map, { showHeatmap, showTrajectories, showTrafficDensity }, isDarkRef.current);

      // Interactive camera node click popup
      map.on('click', LAYER_CAMERAS_CORE, (e) => {
        if (!e.features || !e.features[0]) return;
        const feature = e.features[0];
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const props = feature.properties as any;

        const clickedCamera = activeCamerasRef.current.find((c) => c.id === props.id);
        if (clickedCamera && onCameraSelectRef.current) {
          onCameraSelectRef.current(clickedCamera);
        }

        const html = clickedCamera
          ? createCameraPopupHTML(clickedCamera, isDarkRef.current)
          : `<div class="p-3 font-mono text-xs">${props.name}</div>`;

        if (popupRef.current) {
          popupRef.current.remove();
        }

        popupRef.current = new maplibregl.Popup({
          className: 'nagar-maplibre-popup',
          closeButton: true,
          closeOnClick: true,
          offset: [0, -10],
        })
          .setLngLat(coordinates)
          .setHTML(html)
          .addTo(map);
      });

      // Pointer cursor on hover over camera markers
      map.on('mouseenter', LAYER_CAMERAS_CORE, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', LAYER_CAMERAS_CORE, () => {
        map.getCanvas().style.cursor = '';
      });

      setIsLoaded(true);
      map.resize();
      setTimeout(() => map.resize(), 100);
      setTimeout(() => map.resize(), 400);
    });

    mapInstanceRef.current = map;

    // ResizeObserver to handle container layout changes
    const resizeObserver = new ResizeObserver(() => {
      if (map) {
        map.resize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (popupRef.current) popupRef.current.remove();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount

  // Dynamically switch basemap between OpenFreeMap Dark and Positron (Light)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isLoaded) return;
    if (currentStyleRef.current === targetStyle) return;

    currentStyleRef.current = targetStyle;

    // Close active popup during basemap transition
    if (popupRef.current) {
      popupRef.current.remove();
    }

    const onStyleLoad = () => {
      const camerasData = camerasToGeoJSON(activeCamerasRef.current);
      const roadsData = roadsToGeoJSON(roads);
      const densityData = camerasToDensityGeoJSON(activeCamerasRef.current);

      setupMapSources(map, camerasData, roadsData, densityData);
      setupMapLayers(map, { showHeatmap, showTrajectories, showTrafficDensity }, isDarkRef.current);
    };

    map.once('style.load', onStyleLoad);
    map.setStyle(targetStyle);

    return () => {
      map.off('style.load', onStyleLoad);
    };
  }, [targetStyle, isLoaded, roads, showHeatmap, showTrajectories, showTrafficDensity]);

  // Update sources when camera data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isLoaded) return;

    const camerasData = camerasToGeoJSON(activeCameras);
    const densityData = camerasToDensityGeoJSON(activeCameras);

    updateSourceData(map, SOURCE_CAMERAS, camerasData);
    updateSourceData(map, SOURCE_DENSITY, densityData);
  }, [activeCameras, isLoaded]);

  // Update roads source when roads data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isLoaded) return;

    const roadsData = roadsToGeoJSON(roads);
    updateSourceData(map, SOURCE_ROADS, roadsData);
  }, [roads, isLoaded]);

  // Update overlay layer visibility reactively
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isLoaded) return;

    updateRoadsVisibility(map, showTrajectories);
  }, [showTrajectories, isLoaded]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isLoaded) return;

    updateHeatmapVisibility(map, showHeatmap);
  }, [showHeatmap, isLoaded]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isLoaded) return;

    updateDensityVisibility(map, showTrafficDensity);
  }, [showTrafficDensity, isLoaded]);

  // Custom Controls Handlers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut({ duration: 300 });
  };

  const handleRecenter = () => {
    if (popupRef.current) popupRef.current.remove();
    mapInstanceRef.current?.flyTo({
      center: targetCenter,
      zoom: zoom,
      essential: true,
      speed: 1.2,
      curve: 1.4,
    });
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) return;
    setUserTracking(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLngLat: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        mapInstanceRef.current?.flyTo({
          center: userLngLat,
          zoom: 14,
          speed: 1.4,
        });
        setUserTracking(false);
      },
      () => {
        setUserTracking(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const btnBase =
    'w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ' +
    'bg-[var(--bg-elevated,rgba(14,16,22,0.85))] border border-[var(--glass-border,rgba(255,255,255,0.08))] text-[var(--text-secondary,rgba(253,244,255,0.6))] ' +
    'hover:text-[var(--text-primary,#ffffff)] hover:border-cyan-500/40 hover:bg-[var(--bg-elevated-2,rgba(22,26,36,0.9))] ' +
    'active:scale-95 shadow-[0_4px_14px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.5)] backdrop-blur-xl';

  return (
    <div
      className={`nagar-maplibre-container ${className}`.trim()}
      style={{ position: 'relative', width: '100%', height: '100%', minHeight: '480px' }}
    >
      <div
        ref={mapContainerRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* Custom Glass Controls */}
      {showControls && (
        <div className="absolute bottom-6 right-4 z-[10] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom in"
            aria-label="Zoom in"
            className={btnBase}
          >
            <Plus size={15} strokeWidth={2.5} />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom out"
            aria-label="Zoom out"
            className={btnBase}
          >
            <Minus size={15} strokeWidth={2.5} />
          </button>

          <div className="h-px w-full bg-slate-300/40 dark:bg-white/10 my-0.5" />

          <button
            type="button"
            onClick={handleRecenter}
            title="Recenter to Prayagraj Grid"
            aria-label="Recenter map"
            className={btnBase}
          >
            <Crosshair size={14} className="text-[#00f59b]" />
          </button>

          <button
            type="button"
            onClick={handleGeolocation}
            title="Locate Current Position"
            aria-label="Locate me"
            className={`${btnBase} ${userTracking ? 'border-cyan-400 text-cyan-400 animate-pulse' : ''}`}
          >
            <Navigation size={13} className="text-cyan-400" />
          </button>
        </div>
      )}
    </div>
  );
}

export default NagarMapLibre;
