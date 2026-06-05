import { useState, useEffect, useCallback, useRef } from 'react';
import type { LightningStrike, LightningCluster } from '@/types/sigmet';
import { GMMM_FIR_BOUNDS } from '@/data/fir-boundary';

// ============================================================
// Hook pour récupérer les éclairs en temps réel
// ============================================================

const REFRESH_INTERVAL = 30000; // 30 secondes

/** Récupère les éclairs depuis l'API Blitzortung */
async function fetchLightningData(): Promise<LightningStrike[]> {
  try {
    const response = await fetch('https://map.blitzortung.org/map_data.json', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.dots || !Array.isArray(data.dots)) {
      return [];
    }

    const [south, west, north, east] = GMMM_FIR_BOUNDS;

    const strikes: LightningStrike[] = data.dots
      .filter((s: number[]) => {
        const lat = s[0];
        const lon = s[1];
        return lat >= south && lat <= north && lon >= west && lon <= east;
      })
      .map((s: number[]) => ({
        lat: s[0],
        lon: s[1],
        time: Date.now(),
      }));

    return strikes;
  } catch (error) {
    console.warn('Erreur récupération éclairs:', error);
    return [];
  }
}

/** Calcule les clusters d'éclairs */
function clusterStrikes(
  strikes: LightningStrike[],
  radiusKm: number = 60
): LightningCluster[] {
  if (strikes.length === 0) return [];

  const radiusDeg = radiusKm / 111; // Conversion km → degrés approximative
  const clusters: LightningCluster[] = [];
  const used = new Set<number>();

  for (let i = 0; i < strikes.length; i++) {
    if (used.has(i)) continue;

    const group: LightningStrike[] = [strikes[i]];
    used.add(i);

    for (let j = i + 1; j < strikes.length; j++) {
      if (used.has(j)) continue;

      const dx = strikes[i].lat - strikes[j].lat;
      const dy = strikes[i].lon - strikes[j].lon;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radiusDeg) {
        group.push(strikes[j]);
        used.add(j);
      }
    }

    const avgLat = group.reduce((s, g) => s + g.lat, 0) / group.length;
    const avgLon = group.reduce((s, g) => s + g.lon, 0) / group.length;

    clusters.push({
      center: [avgLat, avgLon],
      strikes: group,
      radius: radiusKm,
    });
  }

  return clusters;
}

export function useLightning() {
  const [strikes, setStrikes] = useState<LightningStrike[]>([]);
  const [clusters, setClusters] = useState<LightningCluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const data = await fetchLightningData();
    setStrikes(data);
    setClusters(clusterStrikes(data));
    setLastUpdate(new Date());
    setLoading(false);

    if (data.length === 0) {
      setError('Aucun éclair détecté dans la FIR');
    }
  }, []);

  useEffect(() => {
    refresh();

    intervalRef.current = setInterval(refresh, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refresh]);

  return {
    strikes,
    clusters,
    loading,
    error,
    lastUpdate,
    refresh,
  };
}
