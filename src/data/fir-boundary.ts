// ============================================================
// Coordonnées de la FIR Casablanca (GMMM)
// Basé sur la carte officielle des FIR ICAO
// ============================================================

import type { LatLngPoint } from '@/types/sigmet';

/**
 * Coordonnées précises de la FIR Casablanca (GMMM)
 * Extraites de la carte officielle des FIR
 * 
 * Ordre : sens horaire depuis le coin NW
 */
export const GMMM_FIR_BOUNDARY: LatLngPoint[] = [
  [37.0000, -18.0000],  // 0 - NW corner (37N 18W)
  [37.0000,  -7.0000],  // 1 - North near Gibraltar (37N 07W)
  [36.0000,  -5.0000],  // 2 - NE corner (36N 05W)
  [31.0000,  -1.0000],  // 3 - East boundary (31N 01W)
  [27.0000,  -1.0000],  // 4 - SE corner (27N 01W)
  [27.0000, -13.0000],  // 5 - South point (27N 13W)
  [28.0000, -15.0000],  // 6 - SW corner (28N 15W)
  [31.0000, -18.0000],  // 7 - West point (31N 18W)
];

/** Centre de la FIR Casablanca */
export const GMMM_FIR_CENTER: LatLngPoint = [32.0, -9.5];

/** Zoom par défaut pour voir toute la FIR */
export const GMMM_FIR_ZOOM = 6;

/** Bounding box de la FIR [south, west, north, east] */
export const GMMM_FIR_BOUNDS: [number, number, number, number] = [
  26.5,   // south
  -18.5,  // west
  37.5,   // north
  -0.5,   // east
];

/** Labels des points de la FIR pour le debug */
export const GMMM_FIR_LABELS: string[] = [
  'NW (37N 18W)',
  'N-Gibraltar (37N 07W)',
  'NE (36N 05W)',
  'E-31N (31N 01W)',
  'SE (27N 01W)',
  'S (27N 13W)',
  'SW (28N 15W)',
  'W-31N (31N 18W)',
];

/** Nom complet de la FIR */
export const GMMM_FIR_NAME = 'GMMM CASABLANCA FIR';

/** Identifiant OACI */
export const GMMM_FIR_ICAO = 'GMMM';
