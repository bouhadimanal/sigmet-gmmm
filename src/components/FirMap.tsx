import { useEffect, useRef, useState, useCallback } from 'react';
import { Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LatLngPoint, LightningCluster, ZoneType } from '@/types/sigmet';
import {
  GMMM_FIR_BOUNDARY,
  GMMM_FIR_CENTER,
  GMMM_FIR_ZOOM,
} from '@/data/fir-boundary';

// Declare Leaflet types for CDN usage
declare global {
  interface Window {
    L: any;
  }
}

interface FirMapProps {
  strikes: LatLngPoint[];
  clusters: LightningCluster[];
  zoneType: ZoneType;
  onCoordinatesDrawn: (coords: LatLngPoint[]) => void;
  drawnCoordinates: LatLngPoint[];
}

function loadLeafletCSS(): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector('link[data-leaflet-css]')) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.setAttribute('data-leaflet-css', 'true');
    link.onload = () => resolve();
    link.onerror = () => resolve(); // Continue even if CSS fails
    document.head.appendChild(link);
  });
}

function loadLeafletJS(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.head.appendChild(script);
  });
}

export default function FirMap({
  strikes,
  clusters,
  zoneType,
  onCoordinatesDrawn,
  drawnCoordinates,
}: FirMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const firLayerRef = useRef<any>(null);
  const strikesLayerRef = useRef<any>(null);
  const clustersLayerRef = useRef<any>(null);
  const drawnLayerRef = useRef<any>(null);
  const tempPointsRef = useRef<LatLngPoint[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      try {
        await loadLeafletCSS();
        await loadLeafletJS();

        if (cancelled || !mapContainerRef.current) return;

        const L = window.L;

        const map = L.map(mapContainerRef.current, {
          center: GMMM_FIR_CENTER,
          zoom: GMMM_FIR_ZOOM,
          minZoom: 4,
          maxZoom: 12,
          zoomControl: true,
          attributionControl: true,
        });

        // Dark tile layer
        L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          {
            attribution: '&copy; OSM contributors &copy; CARTO',
            subdomains: 'abcd',
          }
        ).addTo(map);

        // Layer groups
        firLayerRef.current = L.polygon(GMMM_FIR_BOUNDARY, {
          color: '#38bdf8',
          weight: 2,
          opacity: 0.8,
          fillColor: '#38bdf8',
          fillOpacity: 0.03,
          dashArray: '5, 5',
        }).addTo(map);

        strikesLayerRef.current = L.layerGroup().addTo(map);
        clustersLayerRef.current = L.layerGroup().addTo(map);
        drawnLayerRef.current = L.layerGroup().addTo(map);

        mapRef.current = map;
        setIsMapReady(true);
      } catch (err: any) {
        console.error('Map init error:', err);
        setLoadError(err?.message || 'Failed to load map');
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle click for drawing
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    const handleClick = (e: any) => {
      if (!isDrawing) return;
      const newPoint: LatLngPoint = [e.latlng.lat, e.latlng.lng];

      if (zoneType === 'WI') {
        const newPoints = [...tempPointsRef.current, newPoint];
        tempPointsRef.current = newPoints;
        onCoordinatesDrawn(newPoints);
      } else {
        if (tempPointsRef.current.length >= 2) {
          tempPointsRef.current = [newPoint];
          onCoordinatesDrawn([newPoint]);
        } else {
          const newPoints = [...tempPointsRef.current, newPoint];
          tempPointsRef.current = newPoints;
          onCoordinatesDrawn(newPoints);
        }
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isDrawing, zoneType, onCoordinatesDrawn, isMapReady]);

  // Render drawn shapes
  useEffect(() => {
    tempPointsRef.current = drawnCoordinates;
    const layer = drawnLayerRef.current;
    const L = window.L;
    if (!layer || !L) return;
    layer.clearLayers();

    if (drawnCoordinates.length === 0) return;

    drawnCoordinates.forEach((point) => {
      L.circleMarker(point, {
        radius: 5,
        fillColor: '#22d3ee',
        color: '#0e7490',
        weight: 2,
        fillOpacity: 1,
      }).addTo(layer);
    });

    if (zoneType === 'WI' && drawnCoordinates.length >= 3) {
      L.polygon([...drawnCoordinates, drawnCoordinates[0]], {
        color: '#22d3ee', weight: 2, opacity: 0.8,
        fillColor: '#22d3ee', fillOpacity: 0.1,
      }).addTo(layer);
    } else if (drawnCoordinates.length >= 2) {
      L.polyline(drawnCoordinates, {
        color: '#22d3ee', weight: 3, opacity: 1,
      }).addTo(layer);
    }
  }, [drawnCoordinates, zoneType]);

  // Update lightning
  useEffect(() => {
    const layer = strikesLayerRef.current;
    const L = window.L;
    if (!layer || !L) return;
    layer.clearLayers();
    strikes.forEach((strike) => {
      L.circleMarker(strike, {
        radius: 2.5, fillColor: '#fbbf24', color: '#f59e0b',
        weight: 1, opacity: 0.9, fillOpacity: 0.9,
      }).addTo(layer);
    });
  }, [strikes]);

  // Update clusters
  useEffect(() => {
    const layer = clustersLayerRef.current;
    const L = window.L;
    if (!layer || !L) return;
    layer.clearLayers();
    clusters.forEach((cluster) => {
      L.circleMarker(cluster.center, {
        radius: 8, fillColor: '#ef4444', color: '#dc2626',
        weight: 2, opacity: 1, fillOpacity: 0.7,
      }).bindTooltip(`${cluster.strikes.length} eclairs`).addTo(layer);
    });
  }, [clusters]);

  const toggleDrawing = useCallback(() => {
    setIsDrawing((prev) => {
      if (prev) return false;
      tempPointsRef.current = [];
      onCoordinatesDrawn([]);
      return true;
    });
  }, [onCoordinatesDrawn]);

  const handleClear = useCallback(() => {
    tempPointsRef.current = [];
    onCoordinatesDrawn([]);
  }, [onCoordinatesDrawn]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', backgroundColor: '#0a0e1a', cursor: isDrawing ? 'crosshair' : 'grab' }}
      />

      {!isMapReady && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#0a0e1a' }}>
          <div className="text-center" style={{ color: '#475569' }}>
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Chargement de la carte...</p>
          </div>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#0a0e1a' }}>
          <div className="text-center" style={{ color: '#ef4444' }}>
            <p className="text-sm mb-2">Erreur de chargement de la carte</p>
            <p className="text-xs" style={{ color: '#64748b' }}>{loadError}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 left-4 z-[1000] flex gap-2">
        <Button onClick={toggleDrawing} disabled={!isMapReady}
          className={`h-9 px-3 text-xs font-medium gap-2 ${isDrawing ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-[#161b22] text-slate-300 border border-slate-700'}`} variant="outline">
          <Crosshair className="w-3.5 h-3.5" />
          {isDrawing ? 'Desactiver' : 'Dessiner'}
        </Button>
        {drawnCoordinates.length > 0 && (
          <Button onClick={handleClear}
            className="h-9 px-3 text-xs font-medium bg-[#161b22] text-red-400 border border-red-900/50 hover:bg-red-900/20" variant="outline">
            Effacer
          </Button>
        )}
      </div>

      {isDrawing && (
        <div className="absolute top-16 left-4 z-[1000] bg-[#0f1525]/95 backdrop-blur-sm border border-cyan-500/30 rounded-md px-3 py-2 max-w-[220px]">
          <p className="text-[11px] text-cyan-400 leading-relaxed">
            {zoneType === 'WI'
              ? 'Cliquez sur la carte pour ajouter des points.'
              : 'Cliquez sur la carte pour definir les 2 points de la ligne.'}
          </p>
          {drawnCoordinates.length > 0 && (
            <p className="text-[10px] text-slate-500 mt-1">
              {drawnCoordinates.length} point{drawnCoordinates.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[#0f1525]/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3 text-xs z-[1000]">
        <div className="text-slate-300 font-semibold mb-2 text-[11px] uppercase tracking-wider">Legende</div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="text-slate-400 text-[11px]">Eclair</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0 border-t-2 border-dashed border-sky-400" />
          <span className="text-slate-400 text-[11px]">FIR GMMM</span>
        </div>
      </div>

      {/* Lightning count */}
      {strikes.length > 0 && (
        <div className="absolute top-4 right-4 bg-[#0f1525]/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2 text-xs z-[1000]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-slate-300 text-[11px]">{strikes.length} eclairs</span>
          </div>
          {clusters.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-slate-300 text-[11px]">{clusters.length} clusters</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
