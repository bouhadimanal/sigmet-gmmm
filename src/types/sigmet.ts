// ============================================================
// Types et interfaces pour le générateur SIGMET
// ============================================================

/** Représente un point géographique [latitude, longitude] */
export type LatLngPoint = [number, number];

/** Phénomènes SIGMET disponibles */
export type Phenomenon = 'TS' | 'CB' | 'TURB' | 'ICE' | 'VA' | 'TC';

/** Descripteurs SIGMET */
export type Descriptor = 'EMBD' | 'ISOL' | 'OCNL' | 'FRQ' | 'SQL' | 'HVY' | '';

/** Observation ou prévision */
export type ObservationType = 'OBS' | 'FCST';

/** Directions de mouvement */
export type Movement = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'STNR';

/** Types de zone SIGMET */
export type ZoneType = 'WI' | 'E OF LINE' | 'W OF LINE' | 'N OF LINE' | 'S OF LINE';

/** Représente un impact de foudre */
export interface LightningStrike {
  lat: number;
  lon: number;
  time: number;
}

/** Représente un cluster d'éclairs */
export interface LightningCluster {
  center: LatLngPoint;
  strikes: LightningStrike[];
  radius: number;
}

/** Paramètres du SIGMET */
export interface SigmetParams {
  phenomenon: Phenomenon;
  descriptor: Descriptor;
  observation: ObservationType;
  movement: Movement;
  topFL: string;
  sigmetNumber: string;
  zoneType: ZoneType;
}

/** Point SIGMET formaté en coordonnées OACI */
export interface SigmetCoordinate {
  raw: LatLngPoint;
  formatted: string;
}

/** SIGMET complet généré */
export interface GeneratedSigmet {
  text: string;
  coordinates: SigmetCoordinate[];
  issueTime: string;
  validFrom: string;
  validTo: string;
}
