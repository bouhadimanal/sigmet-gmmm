import { useState, useCallback, useMemo } from 'react';
import type {
  LatLngPoint,
  SigmetParams,
  GeneratedSigmet,
  SigmetCoordinate,
} from '@/types/sigmet';

// ============================================================
// Hook pour la génération des SIGMET
// ============================================================

/** Formate une coordonnée en format SIGMET OACI */
function formatCoordinate(lat: number, lon: number): string {
  const latAbs = Math.abs(lat);
  const latDeg = Math.floor(latAbs);
  const latMin = Math.floor((latAbs - latDeg) * 60);
  const latDir = lat >= 0 ? 'N' : 'S';

  const lonAbs = Math.abs(lon);
  const lonDeg = Math.floor(lonAbs);
  const lonMin = Math.floor((lonAbs - lonDeg) * 60);
  const lonDir = lon >= 0 ? 'E' : 'W';

  return `${latDir}${String(latDeg).padStart(2, '0')}${String(latMin).padStart(2, '0')} ${lonDir}${String(lonDeg).padStart(3, '0')}${String(lonMin).padStart(2, '0')}`;
}

/** Génère les heures de validité SIGMET */
function getValidityTimes(): { issueTime: string; validFrom: string; validTo: string } {
  const now = new Date();
  const utcDay = String(now.getUTCDate()).padStart(2, '0');
  const utcHour = String(now.getUTCHours()).padStart(2, '0');
  const utcMin = String(now.getUTCMinutes()).padStart(2, '0');

  const issueTime = `${utcDay}${utcHour}${utcMin}`;
  const validFrom = issueTime;

  const to = new Date(now.getTime() + 4 * 60 * 60 * 1000); // +4 heures
  const toDay = String(to.getUTCDate()).padStart(2, '0');
  const toHour = String(to.getUTCHours()).padStart(2, '0');
  const toMin = String(to.getUTCMinutes()).padStart(2, '0');
  const validTo = `${toDay}${toHour}${toMin}`;

  return { issueTime, validFrom, validTo };
}

/** Génère le texte SIGMET complet */
function generateSigmetText(
  params: SigmetParams,
  coordinates: SigmetCoordinate[],
  times: { issueTime: string; validFrom: string; validTo: string }
): string {
  const { phenomenon, descriptor, observation, movement, topFL, sigmetNumber, zoneType } = params;

  const descriptorPart = descriptor ? `${descriptor} ` : '';

  let zoneText = '';
  if (zoneType === 'WI') {
    const coords = coordinates.map((c) => c.formatted).join(' - ');
    zoneText = `WI ${coords}`;
  } else {
    const coords = coordinates.map((c) => c.formatted).join(' - ');
    zoneText = `${zoneType} ${coords}`;
  }

  const movementText = movement === 'STNR' ? 'STNR NC' : `MOV ${movement} NC`;

  const sigmet = `WSMC31 GMMC ${times.issueTime}
GMMM SIGMET ${sigmetNumber} VALID ${times.validFrom}/${times.validTo} GMMC-
GMMM CASABLANCA FIR
${descriptorPart}${phenomenon} ${observation} ${zoneText}
TOP ${topFL} ${movementText}=`.toUpperCase();

  return sigmet;
}

export function useSigmet() {
  const [params, setParams] = useState<SigmetParams>({
    phenomenon: 'TS',
    descriptor: 'EMBD',
    observation: 'OBS',
    movement: 'STNR',
    topFL: 'FL340',
    sigmetNumber: 'T01',
    zoneType: 'WI',
  });

  const [drawnCoordinates, setDrawnCoordinates] = useState<LatLngPoint[]>([]);

  /** Met à jour un paramètre SIGMET */
  const updateParam = useCallback(<K extends keyof SigmetParams>(
    key: K,
    value: SigmetParams[K]
  ) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Définit les coordonnées dessinées sur la carte */
  const setCoordinates = useCallback((coords: LatLngPoint[]) => {
    setDrawnCoordinates(coords);
  }, []);

  /** Efface les coordonnées dessinées */
  const clearCoordinates = useCallback(() => {
    setDrawnCoordinates([]);
  }, []);

  /** Génère le SIGMET si des coordonnées existent */
  const generatedSigmet = useMemo<GeneratedSigmet | null>(() => {
    if (drawnCoordinates.length === 0) return null;

    // Pour les lignes (E OF LINE, etc.), on ne garde que 2 points
    // Pour les polygones (WI), on garde tous les points
    let coords = drawnCoordinates;
    if (params.zoneType !== 'WI' && coords.length > 2) {
      // Pour une ligne, prendre le premier et dernier point
      coords = [coords[0], coords[coords.length - 1]];
    }

    const sigmetCoordinates: SigmetCoordinate[] = coords.map((point) => ({
      raw: point,
      formatted: formatCoordinate(point[0], point[1]),
    }));

    const times = getValidityTimes();

    const text = generateSigmetText(params, sigmetCoordinates, times);

    return {
      text,
      coordinates: sigmetCoordinates,
      issueTime: times.issueTime,
      validFrom: times.validFrom,
      validTo: times.validTo,
    };
  }, [params, drawnCoordinates]);

  return {
    params,
    updateParam,
    drawnCoordinates,
    setCoordinates,
    clearCoordinates,
    generatedSigmet,
  };
}
