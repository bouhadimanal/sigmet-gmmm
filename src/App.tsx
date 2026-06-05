import { useState, useEffect, useRef, useCallback } from 'react';
import { Plane, Zap, Crosshair, Copy, Trash2, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ============================================================
// FIR GMMM Boundary - Coordonnées exactes fournies par l'utilisateur
// ============================================================
const GMMM_FIR = [
  [35.97,  -11.97],   // Gibraltar ouest
  [35.98,   -7.38],   // Détroit de Gibraltar (N)
  [35.80,   -7.38],   // Détroit de Gibraltar (S)
  [35.80,   -2.08],   // Méditerranée Est
  [32.52,   -1.25],   // Frontière Algérie (N)
  [32.10,   -1.17],   // Frontière Algérie
  [31.93,   -2.78],   // Frontière Algérie
  [31.85,   -2.60],   // Frontière Algérie
  [28.70,   -8.57],   // Frontière Algérie (centre)
  [27.72,   -8.60],   // Frontière Algérie (S)
  [27.72,  -13.17],   // Côte atlantique (S)
  [32.28,  -14.60],   // Atlantique (W)
  [35.97,  -11.97],   // Retour Gibraltar ouest
];

const GMMM_CENTER = [32.0, -8.0] as [number, number];

// Zone types
const ZONE_TYPES = [
  { value: 'WI', label: 'WI - Within (Polygone)' },
  { value: 'E OF LINE', label: 'E OF LINE - East of Line' },
  { value: 'W OF LINE', label: 'W OF LINE - West of Line' },
  { value: 'N OF LINE', label: 'N OF LINE - North of Line' },
  { value: 'S OF LINE', label: 'S OF LINE - South of Line' },
];

// ============================================================
// Helpers
// ============================================================

/** Formate une coordonnée au format SIGMET */
function fmtCoord(lat: number, lon: number): string {
  const la = Math.abs(lat), ld = Math.floor(la), lm = Math.floor((la - ld) * 60);
  const lo = Math.abs(lon), lod = Math.floor(lo), lom = Math.floor((lo - lod) * 60);
  return `${lat >= 0 ? 'N' : 'S'}${String(ld).padStart(2, '0')}${String(lm).padStart(2, '0')} ${lon >= 0 ? 'E' : 'W'}${String(lod).padStart(3, '0')}${String(lom).padStart(2, '0')}`;
}

/** Génère le texte SIGMET */
function genSigmet(
  p: any, coords: [number, number][], startTime: string, durationHours: number
): string | null {
  if (coords.length === 0) return null;

  const now = new Date();
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hr = String(now.getUTCHours()).padStart(2, '0');
  const mn = String(now.getUTCMinutes()).padStart(2, '0');
  const issue = `${day}${hr}${mn}`;

  // Heure de début
  let validFrom: string;
  if (startTime) {
    const [h, m] = startTime.split(':').map(Number);
    const start = new Date(now.getTime());
    start.setUTCHours(h, m, 0, 0);
    // Si l'heure de début est dans le passé, ajouter un jour
    if (start < now) {
      start.setUTCDate(start.getUTCDate() + 1);
    }
    const vd = String(start.getUTCDate()).padStart(2, '0');
    const vh = String(start.getUTCHours()).padStart(2, '0');
    const vm = String(start.getUTCMinutes()).padStart(2, '0');
    validFrom = `${vd}${vh}${vm}`;
  } else {
    validFrom = issue;
  }

  // Heure de fin = début + durée
  const fromDay = parseInt(validFrom.substring(0, 2));
  const fromHr = parseInt(validFrom.substring(2, 4));
  const fromMn = parseInt(validFrom.substring(4, 6));
  const to = new Date(now.getTime());
  to.setUTCDate(fromDay);
  to.setUTCHours(fromHr, fromMn, 0, 0);
  to.setTime(to.getTime() + durationHours * 3600000);
  const toDay = String(to.getUTCDate()).padStart(2, '0');
  const toHr = String(to.getUTCHours()).padStart(2, '0');
  const toMn = String(to.getUTCMinutes()).padStart(2, '0');
  const validTo = `${toDay}${toHr}${toMn}`;

  const c = coords.map(([la, lo]) => fmtCoord(la, lo)).join(' - ');
  const zone = p.zoneType === 'WI' ? `WI ${c}` : `${p.zoneType} ${c}`;
  const desc = p.descriptor ? `${p.descriptor} ` : '';
  const mov = p.movement === 'STNR' ? 'STNR NC' : `MOV ${p.movement} NC`;

  return `WSMC31 GMMC ${issue}
GMMM SIGMET ${p.sigmetNumber} VALID ${validFrom}/${validTo} GMMC-
GMMM CASABLANCA FIR
${desc}${p.phenomenon} ${p.observation} ${zone}
TOP ${p.topFL} ${mov}=`.toUpperCase();
}

// ============================================================
// Hook: Lightning Data - via backend proxy
// ============================================================

function useLightning() {
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  interface Strike { lat: number; lon: number; time: number; }

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Appel au backend local qui fait le proxy vers Blitzortung
      const res = await fetch('/api/lightning', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.strikes) {
        setStrikes(data.strikes);
        setLastUpdate(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' UTC');
      } else {
        setError(data.error || 'Donnees indisponibles');
      }
    } catch {
      // Si le backend n'est pas accessible (deploy statique), on affiche un message informatif
      setError('Activer le backend (npm run server) pour les donnees de foudre');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh]);

  return { strikes, loading, lastUpdate, error, refresh };
}

// ============================================================
// App
// ============================================================

export default function App() {
  const { strikes, loading: lightningLoading, lastUpdate, error: lightningError, refresh: refreshLightning } = useLightning();

  // Paramètres SIGMET
  const [phenomenon, setPhenomenon] = useState('TS');
  const [descriptor, setDescriptor] = useState('EMBD');
  const [observation, setObservation] = useState('OBS');
  const [movement, setMovement] = useState('STNR');
  const [topFL, setTopFL] = useState('FL340');
  const [sigmetNumber, setSigmetNumber] = useState('T01');
  const [zoneType, setZoneType] = useState('WI');

  // Heure de début et durée
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(4);

  // Coordonnées dessinées
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Refs carte
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const drawnLayer = useRef<any>(null);
  const strikesLayer = useRef<any>(null);

  const params = { phenomenon, descriptor, observation, movement, topFL, sigmetNumber, zoneType };
  const sigmetText = genSigmet(params, coords, startTime, duration);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const init = async () => {
      try {
        // Charger Leaflet CSS
        await new Promise<void>((resolve) => {
          if (document.querySelector('link[data-leaflet-css]')) { resolve(); return; }
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.setAttribute('data-leaflet-css', 'true');
          link.onload = () => resolve();
          document.head.appendChild(link);
        });

        // Charger Leaflet JS
        await new Promise<void>((resolve, reject) => {
          if ((window as any).L) { resolve(); return; }
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          script.onerror = () => reject();
          document.head.appendChild(script);
        });

        const L = (window as any).L;
        const map = L.map(mapRef.current, {
          center: GMMM_CENTER, zoom: 6, minZoom: 4, maxZoom: 12,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OSM &copy; CARTO', subdomains: 'abcd',
        }).addTo(map);

        L.polygon(GMMM_FIR, {
          color: '#38bdf8', weight: 2, opacity: 0.8,
          fillColor: '#38bdf8', fillOpacity: 0.03, dashArray: '5, 5',
        }).addTo(map);

        // Radar RainViewer - orages en temps reel (overlay)
        fetch('/api/radar-timestamp')
          .then(r => r.json())
          .then(data => {
            if (data.success && data.timestamp) {
              const url = `https://tilecache.rainviewer.com/v2/radar/${data.timestamp}/{z}/{x}/{y}/256/1_1.png`;
              L.tileLayer(url, { opacity: 0.35, minZoom: 2, maxZoom: 10 }).addTo(map);
            }
          })
          .catch(() => {});

        drawnLayer.current = L.layerGroup().addTo(map);
        strikesLayer.current = L.layerGroup().addTo(map);

        map.on('click', (e: any) => {
          if (!isDrawingRef.current) return;
          const pt: [number, number] = [e.latlng.lat, e.latlng.lng];
          setCoords((prev) => {
            if (zoneTypeRef.current === 'WI') {
              // Polygone: ajouter point sans limite
              return [...prev, pt];
            } else {
              // Ligne: max 4 points
              if (prev.length >= 4) return prev;
              return [...prev, pt];
            }
          });
        });

        mapInstance.current = map;
      } catch (err) {
        console.error('Map init error:', err);
      }
    };

    init();
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, []);

  // Refs pour drawing
  const isDrawingRef = useRef(isDrawing);
  const zoneTypeRef = useRef(zoneType);
  useEffect(() => { isDrawingRef.current = isDrawing; }, [isDrawing]);
  useEffect(() => { zoneTypeRef.current = zoneType; }, [zoneType]);

  // Update lightning strikes on map
  useEffect(() => {
    if (!strikesLayer.current || !(window as any).L) return;
    const L = (window as any).L;
    strikesLayer.current.clearLayers();
    strikes.forEach((s: any) => {
      L.circleMarker([s.lat, s.lon], {
        radius: 3,
        fillColor: '#fbbf24',
        color: '#f59e0b',
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.9,
      }).addTo(strikesLayer.current);
    });
  }, [strikes]);

  // Update drawn shapes
  useEffect(() => {
    if (!drawnLayer.current || !(window as any).L) return;
    const L = (window as any).L;
    drawnLayer.current.clearLayers();
    if (coords.length === 0) return;

    coords.forEach(([la, lo]) => {
      L.circleMarker([la, lo], { radius: 5, fillColor: '#22d3ee', color: '#0e7490', weight: 2, fillOpacity: 1 })
        .addTo(drawnLayer.current);
    });

    if (zoneType === 'WI' && coords.length >= 3) {
      L.polygon([...coords, coords[0]], { color: '#22d3ee', weight: 2, opacity: 0.8, fillColor: '#22d3ee', fillOpacity: 0.1 })
        .addTo(drawnLayer.current);
    } else if (coords.length >= 2) {
      L.polyline(coords, { color: '#22d3ee', weight: 3, opacity: 1 })
        .addTo(drawnLayer.current);
    }
  }, [coords, zoneType]);

  const toggleDraw = () => {
    if (isDrawing) setIsDrawing(false);
    else { setIsDrawing(true); setCoords([]); }
  };
  const clearDraw = () => setCoords([]);
  
  // Finaliser la ligne (mode ligne uniquement)
  const finalizeLine = () => {
    setIsDrawing(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#080c14' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ backgroundColor: '#0d1117', borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <Plane className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide uppercase leading-tight" style={{ color: '#e2e8f0' }}>SIGMET Generator</h1>
            <p className="text-[10px] leading-tight" style={{ color: '#64748b' }}>Casablanca FIR - GMMM</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] gap-1.5" style={{ borderColor: '#334155', color: '#94a3b8' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            En ligne
          </Badge>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" style={{ backgroundColor: '#0a0e1a', cursor: isDrawing ? 'crosshair' : 'grab' }} />

          {/* Controls */}
          <div className="absolute top-4 left-4 z-[1000] flex gap-2">
            <Button onClick={toggleDraw} className={`h-9 px-3 text-xs font-medium gap-2 ${isDrawing ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-[#161b22] text-slate-300 border border-slate-700'}`} variant="outline">
              <Crosshair className="w-3.5 h-3.5" />{isDrawing ? 'Desactiver' : 'Dessiner'}
            </Button>
            {coords.length > 0 && (
              <Button onClick={clearDraw} className="h-9 px-3 text-xs font-medium bg-[#161b22] text-red-400 border border-red-900/50 hover:bg-red-900/20" variant="outline">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
            {isDrawing && zoneType !== 'WI' && coords.length >= 2 && (
              <Button onClick={finalizeLine} className="h-9 px-3 text-xs font-medium bg-[#161b22] text-green-400 border border-green-900/50 hover:bg-green-900/20" variant="outline">
                Terminer
              </Button>
            )}
          </div>

          {isDrawing && (
            <div className="absolute top-16 left-4 z-[1000] bg-[#0f1525]/95 backdrop-blur-sm border border-cyan-500/30 rounded-md px-3 py-2 max-w-[240px]">
              <p className="text-[11px] text-cyan-400 leading-relaxed">
                {zoneType === 'WI' 
                  ? 'Cliquez pour ajouter des points (polygone). Clic droit pour finir.' 
                  : `Cliquez pour placer les points de la ligne (2-4 pts). ${coords.length}/4 points places.`}
              </p>
              {zoneType !== 'WI' && coords.length >= 2 && (
                <p className="text-[10px] text-green-400 mt-1">Cliquez &quot;Terminer&quot; pour valider</p>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-[#0f1525]/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3 text-xs z-[1000]">
            <div className="text-slate-300 font-semibold mb-2 text-[11px] uppercase tracking-wider">Legende</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0 border-t-2 border-dashed border-sky-400" />
              <span className="text-slate-400 text-[11px]">FIR GMMM</span>
            </div>
          </div>


        </div>

        {/* Right Panel */}
        <div className="w-[360px] shrink-0 flex flex-col" style={{ backgroundColor: '#0d1117', borderLeft: '1px solid rgba(51,65,85,0.5)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: '#e2e8f0' }}>Parametres</h2>
            </div>
            <Badge variant="outline" className="text-[10px]" style={{ borderColor: '#334155', color: '#94a3b8' }}>GMMM</Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* --- Lightning Data --- */}
            <div className="rounded-md p-2.5 border" style={{ backgroundColor: '#161b22', borderColor: 'rgba(51,65,85,0.5)' }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${lightningError ? 'bg-red-400' : strikes.length > 0 ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'}`} />
                  <span className="text-[11px]" style={{ color: '#e2e8f0' }}>Impacts de foudre</span>
                </div>
                <span className="text-[10px]" style={{ color: '#64748b' }}>{lightningLoading ? 'Chargement...' : lastUpdate || 'En attente'}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                {lightningError ? (
                  <p className="text-[10px]" style={{ color: '#f59e0b' }}>⚠️ {lightningError}</p>
                ) : (
                  <>
                    <span className="text-lg font-mono font-bold text-yellow-400">{strikes.length}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: '#64748b' }}>eclairs FIR</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" style={{ color: '#64748b' }} onClick={refreshLightning}>
                        <RefreshCw className={`w-3 h-3 ${lightningLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="h-px" style={{ backgroundColor: 'rgba(51,65,85,0.5)' }} />

            {/* --- Validity Time & Duration --- */}
            <div className="space-y-3">
              <Label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Validite</Label>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px]" style={{ color: '#64748b' }}>Heure debut (UTC)</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-8 text-xs font-mono"
                    style={{ backgroundColor: '#161b22', borderColor: '#334155', color: '#e2e8f0' }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]" style={{ color: '#64748b' }}>Duree (1-4H)</Label>
                  <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                    <SelectTrigger className="h-8 text-xs" style={{ backgroundColor: '#161b22', borderColor: '#334155', color: '#e2e8f0' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: '#161b22', borderColor: '#334155' }}>
                      {[1, 2, 3, 4].map((h) => (
                        <SelectItem key={h} value={String(h)} className="text-xs">{h}H00</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {startTime && (
                <div className="flex items-center gap-2 text-[10px]" style={{ color: '#64748b' }}>
                  <span>Debut: {startTime}Z</span>
                  <span>|</span>
                  <span>Duree: {duration}H00</span>
                </div>
              )}
            </div>

            <div className="h-px" style={{ backgroundColor: 'rgba(51,65,85,0.5)' }} />

            {/* --- SIGMET Parameters --- */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[11px]" style={{ color: '#64748b' }}>Phenomene</Label>
                <Select value={phenomenon} onValueChange={setPhenomenon}>
                  <SelectTrigger className="h-8 text-xs" style={{ backgroundColor: '#161b22', borderColor: '#334155', color: '#e2e8f0' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: '#161b22', borderColor: '#334155' }}>
                    <SelectItem value="TS" className="text-xs">TS - Thunderstorm</SelectItem>
                    <SelectItem value="CB" className="text-xs">CB - Cumulonimbus</SelectItem>
                    <SelectItem value="TURB" className="text-xs">TURB - Turbulence</SelectItem>
                    <SelectItem value="ICE" className="text-xs">ICE - Icing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]" style={{ color: '#64748b' }}>Type</Label>
                <Select value={descriptor} onValueChange={setDescriptor}>
                  <SelectTrigger className="h-8 text-xs" style={{ backgroundColor: '#161b22', borderColor: '#334155', color: '#e2e8f0' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: '#161b22', borderColor: '#334155' }}>
                    {['EMBD', 'ISOL', 'OCNL', 'FRQ', 'SQL', 'HVY'].map((d) => (
                      <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]" style={{ color: '#64748b' }}>Etat</Label>
                <Select value={observation} onValueChange={setObservation}>
                  <SelectTrigger className="h-8 text-xs" style={{ backgroundColor: '#161b22', borderColor: '#334155', color: '#e2e8f0' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: '#161b22', borderColor: '#334155' }}>
                    <SelectItem value="OBS" className="text-xs">OBS - Observation</SelectItem>
                    <SelectItem value="FCST" className="text-xs">FCST - Forecast</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]" style={{ color: '#64748b' }}>Mouvement</Label>
                <Select value={movement} onValueChange={setMovement}>
                  <SelectTrigger className="h-8 text-xs" style={{ backgroundColor: '#161b22', borderColor: '#334155', color: '#e2e8f0' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: '#161b22', borderColor: '#334155' }}>
                    {['N','NE','E','SE','S','SW','W','NW','STNR'].map((m) => (
                      <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bloc Numero SIGMET */}
              <div className="space-y-2 p-3 rounded-md border" style={{ backgroundColor: 'rgba(14,165,233,0.05)', borderColor: 'rgba(14,165,233,0.2)' }}>
                <Label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#38bdf8' }}>Numero SIGMET</Label>
                <div className="flex gap-2">
                  <span className="flex items-center px-2 h-8 rounded-md text-xs font-mono font-bold" style={{ backgroundColor: '#0f1525', border: '1px solid #334155', color: '#22d3ee' }}>GMMM</span>
                  <Input 
                    value={sigmetNumber} 
                    onChange={(e) => setSigmetNumber(e.target.value)} 
                    className="h-8 text-xs font-mono font-bold flex-1" 
                    style={{ backgroundColor: '#161b22', borderColor: '#0e7490', color: '#22d3ee' }} 
                    placeholder="Ex: T01"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]" style={{ color: '#64748b' }}>TOP FL</Label>
                <Input value={topFL} onChange={(e) => setTopFL(e.target.value)} className="h-8 text-xs font-mono" style={{ backgroundColor: '#161b22', borderColor: '#334155', color: '#e2e8f0' }} />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]" style={{ color: '#64748b' }}>Type de Zone</Label>
                <Select value={zoneType} onValueChange={(v) => { setZoneType(v); setCoords([]); }}>
                  <SelectTrigger className="h-8 text-xs" style={{ backgroundColor: '#161b22', borderColor: '#334155', color: '#e2e8f0' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: '#161b22', borderColor: '#334155' }}>
                    {ZONE_TYPES.map((z) => (
                      <SelectItem key={z.value} value={z.value} className="text-xs">{z.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-px" style={{ backgroundColor: 'rgba(51,65,85,0.5)' }} />

            {/* --- SIGMET Preview --- */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>SIGMET</Label>
                {sigmetText && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" style={{ color: '#64748b' }} onClick={() => navigator.clipboard.writeText(sigmetText)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" style={{ color: '#64748b' }} onClick={clearDraw}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {sigmetText ? (
                <Textarea value={sigmetText} readOnly className="min-h-[160px] text-xs font-mono leading-relaxed resize-none" style={{ backgroundColor: '#161b22', borderColor: '#334155', color: '#e2e8f0' }} />
              ) : (
                <div className="min-h-[160px] border border-dashed rounded-md flex items-center justify-center p-4 text-center" style={{ borderColor: '#334155', backgroundColor: '#161b22' }}>
                  <p className="text-[11px]" style={{ color: '#64748b' }}>
                    Cliquez sur &quot;Dessiner&quot; puis sur la carte pour generer le SIGMET
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="px-4 py-3 text-center" style={{ borderTop: '1px solid rgba(51,65,85,0.5)' }}>
            <p className="text-[10px]" style={{ color: '#475569' }}>FIR Maroc | Validite 1-4H | Mise a jour 30s</p>
          </div>
        </div>
      </div>
    </div>
  );
}
