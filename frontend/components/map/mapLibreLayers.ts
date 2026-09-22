import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';

export const OPENFREEMAP_DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark';
export const OPENFREEMAP_LIGHT_STYLE = 'https://tiles.openfreemap.org/styles/positron';

// Source Identifiers
export const SOURCE_ROADS = 'nagar-roads-source';
export const SOURCE_CAMERAS = 'nagar-cameras-source';
export const SOURCE_DENSITY = 'nagar-density-source';

// Layer Identifiers
export const LAYER_ROADS_GLOW = 'nagar-roads-glow';
export const LAYER_ROADS_CORE = 'nagar-roads-core';
export const LAYER_HEATMAP = 'nagar-heatmap-layer';
export const LAYER_DENSITY_RINGS_FILL = 'nagar-density-rings-fill';
export const LAYER_DENSITY_RINGS_STROKE = 'nagar-density-rings-stroke';
export const LAYER_CAMERAS_HALO = 'nagar-cameras-halo';
export const LAYER_CAMERAS_CORE = 'nagar-cameras-core';
export const LAYER_CAMERAS_CENTER = 'nagar-cameras-center';

export interface LayerVisibilityState {
  showHeatmap: boolean;
  showTrajectories: boolean;
  showTrafficDensity: boolean;
}

/**
 * Initializes GeoJSON sources on the MapLibre instance.
 */
export function setupMapSources(
  map: MapLibreMap,
  camerasData: GeoJSON.FeatureCollection,
  roadsData: GeoJSON.FeatureCollection,
  densityData: GeoJSON.FeatureCollection
) {
  if (!map.getSource(SOURCE_ROADS)) {
    map.addSource(SOURCE_ROADS, {
      type: 'geojson',
      data: roadsData,
    });
  }

  if (!map.getSource(SOURCE_DENSITY)) {
    map.addSource(SOURCE_DENSITY, {
      type: 'geojson',
      data: densityData,
    });
  }

  if (!map.getSource(SOURCE_CAMERAS)) {
    map.addSource(SOURCE_CAMERAS, {
      type: 'geojson',
      data: camerasData,
    });
  }
}

/**
 * Adds all visualization layers to the MapLibre instance.
 */
export function setupMapLayers(
  map: MapLibreMap,
  initialVisibility: LayerVisibilityState,
  isDark: boolean = true
) {
  const roadColor = isDark ? '#00f59b' : '#0d9488';
  const strokeColor = isDark ? '#080a10' : '#ffffff';

  // ── 1. Road Trajectory Layers ──────────────────────────────────────
  if (!map.getLayer(LAYER_ROADS_GLOW)) {
    map.addLayer({
      id: LAYER_ROADS_GLOW,
      type: 'line',
      source: SOURCE_ROADS,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
        visibility: initialVisibility.showTrajectories ? 'visible' : 'none',
      },
      paint: {
        'line-color': roadColor,
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 14, 6],
        'line-opacity': isDark ? 0.35 : 0.45,
        'line-blur': 2.5,
      },
    });
  }

  if (!map.getLayer(LAYER_ROADS_CORE)) {
    map.addLayer({
      id: LAYER_ROADS_CORE,
      type: 'line',
      source: SOURCE_ROADS,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
        visibility: 'visible', // Base road network remains subtly visible, highlights on toggle
      },
      paint: {
        'line-color': roadColor,
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 14, 3],
        'line-opacity': initialVisibility.showTrajectories ? 0.95 : (isDark ? 0.4 : 0.6),
        'line-dasharray': initialVisibility.showTrajectories ? [4, 2] : [1, 0],
      },
    });
  }

  // ── 2. Density Heatmap Layer ───────────────────────────────────────
  if (!map.getLayer(LAYER_HEATMAP)) {
    map.addLayer({
      id: LAYER_HEATMAP,
      type: 'heatmap',
      source: SOURCE_CAMERAS,
      layout: {
        visibility: initialVisibility.showHeatmap ? 'visible' : 'none',
      },
      paint: {
        'heatmap-weight': ['get', 'weight'],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 14, 2.0],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(0, 245, 155, 0)',
          0.2,
          'rgba(0, 245, 155, 0.35)',
          0.4,
          'rgba(6, 182, 212, 0.65)',
          0.7,
          'rgba(245, 158, 11, 0.85)',
          1.0,
          'rgba(239, 68, 68, 0.95)',
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 20, 14, 45],
        'heatmap-opacity': 0.75,
      },
    });
  }

  // ── 3. Live Traffic Density Rings ──────────────────────────────────
  if (!map.getLayer(LAYER_DENSITY_RINGS_FILL)) {
    map.addLayer({
      id: LAYER_DENSITY_RINGS_FILL,
      type: 'circle',
      source: SOURCE_DENSITY,
      layout: {
        visibility: initialVisibility.showTrafficDensity ? 'visible' : 'none',
      },
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10,
          ['*', ['get', 'radius'], 0.5],
          14,
          ['get', 'radius'],
        ],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.16,
      },
    });
  }

  if (!map.getLayer(LAYER_DENSITY_RINGS_STROKE)) {
    map.addLayer({
      id: LAYER_DENSITY_RINGS_STROKE,
      type: 'circle',
      source: SOURCE_DENSITY,
      layout: {
        visibility: initialVisibility.showTrafficDensity ? 'visible' : 'none',
      },
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10,
          ['*', ['get', 'radius'], 0.5],
          14,
          ['get', 'radius'],
        ],
        'circle-color': 'transparent',
        'circle-stroke-color': ['get', 'color'],
        'circle-stroke-width': 1.5,
        'circle-stroke-opacity': 0.7,
      },
    });
  }

  // ── 4. Camera Node Stations (Points) ──────────────────────────────
  if (!map.getLayer(LAYER_CAMERAS_HALO)) {
    map.addLayer({
      id: LAYER_CAMERAS_HALO,
      type: 'circle',
      source: SOURCE_CAMERAS,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 8, 14, 16],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.28,
        'circle-blur': 0.6,
      },
    });
  }

  if (!map.getLayer(LAYER_CAMERAS_CORE)) {
    map.addLayer({
      id: LAYER_CAMERAS_CORE,
      type: 'circle',
      source: SOURCE_CAMERAS,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 8],
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2,
        'circle-stroke-color': strokeColor,
        'circle-opacity': 0.95,
      },
    });
  }

  if (!map.getLayer(LAYER_CAMERAS_CENTER)) {
    map.addLayer({
      id: LAYER_CAMERAS_CENTER,
      type: 'circle',
      source: SOURCE_CAMERAS,
      paint: {
        'circle-radius': 2,
        'circle-color': '#ffffff',
        'circle-opacity': 0.9,
      },
    });
  }
}

/**
 * Updates a GeoJSON source with fresh data.
 */
export function updateSourceData(
  map: MapLibreMap,
  sourceId: string,
  data: GeoJSON.FeatureCollection
) {
  const source = map.getSource(sourceId) as GeoJSONSource | undefined;
  if (source && typeof source.setData === 'function') {
    source.setData(data);
  }
}

/**
 * Dynamically toggles layer visibility.
 */
export function setLayerVisibility(map: MapLibreMap, layerId: string, visible: boolean) {
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }
}

export function updateRoadsVisibility(map: MapLibreMap, showTrajectories: boolean) {
  setLayerVisibility(map, LAYER_ROADS_GLOW, showTrajectories);
  if (map.getLayer(LAYER_ROADS_CORE)) {
    map.setPaintProperty(LAYER_ROADS_CORE, 'line-opacity', showTrajectories ? 0.95 : 0.4);
    map.setPaintProperty(LAYER_ROADS_CORE, 'line-width', showTrajectories ? 2.5 : 1.5);
    map.setPaintProperty(
      LAYER_ROADS_CORE,
      'line-dasharray',
      showTrajectories ? [4, 2] : [1, 0]
    );
  }
}

export function updateHeatmapVisibility(map: MapLibreMap, showHeatmap: boolean) {
  setLayerVisibility(map, LAYER_HEATMAP, showHeatmap);
}

export function updateDensityVisibility(map: MapLibreMap, showTrafficDensity: boolean) {
  setLayerVisibility(map, LAYER_DENSITY_RINGS_FILL, showTrafficDensity);
  setLayerVisibility(map, LAYER_DENSITY_RINGS_STROKE, showTrafficDensity);
}
