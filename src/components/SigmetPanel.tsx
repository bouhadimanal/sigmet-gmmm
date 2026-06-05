import { Copy, Trash2, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import type {
  Phenomenon,
  Descriptor,
  ObservationType,
  Movement,
  ZoneType,
  SigmetParams,
  GeneratedSigmet,
} from '@/types/sigmet';

// ============================================================
// Options des paramètres SIGMET
// ============================================================

const PHENOMENON_OPTIONS: { value: Phenomenon; label: string }[] = [
  { value: 'TS', label: 'TS - Thunderstorm' },
  { value: 'CB', label: 'CB - Cumulonimbus' },
  { value: 'TURB', label: 'TURB - Turbulence' },
  { value: 'ICE', label: 'ICE - Icing' },
];

const DESCRIPTOR_OPTIONS: { value: Descriptor; label: string }[] = [
  { value: 'EMBD', label: 'EMBD - Embedded' },
  { value: 'ISOL', label: 'ISOL - Isolated' },
  { value: 'OCNL', label: 'OCNL - Occasional' },
  { value: 'FRQ', label: 'FRQ - Frequent' },
  { value: 'SQL', label: 'SQL - Squall Line' },
  { value: 'HVY', label: 'HVY - Heavy' },
  { value: '', label: 'Aucun' },
];

const OBSERVATION_OPTIONS: { value: ObservationType; label: string }[] = [
  { value: 'OBS', label: 'OBS - Observation' },
  { value: 'FCST', label: 'FCST - Forecast' },
];

const MOVEMENT_OPTIONS: { value: Movement; label: string }[] = [
  { value: 'N', label: 'N - North' },
  { value: 'NE', label: 'NE - Northeast' },
  { value: 'E', label: 'E - East' },
  { value: 'SE', label: 'SE - Southeast' },
  { value: 'S', label: 'S - South' },
  { value: 'SW', label: 'SW - Southwest' },
  { value: 'W', label: 'W - West' },
  { value: 'NW', label: 'NW - Northwest' },
  { value: 'STNR', label: 'STNR - Stationary' },
];

const ZONE_TYPE_OPTIONS: { value: ZoneType; label: string }[] = [
  { value: 'WI', label: 'WI - Within (Polygone)' },
  { value: 'E OF LINE', label: 'E OF LINE - East of Line' },
  { value: 'W OF LINE', label: 'W OF LINE - West of Line' },
  { value: 'N OF LINE', label: 'N OF LINE - North of Line' },
  { value: 'S OF LINE', label: 'S OF LINE - South of Line' },
];

// ============================================================
// Composant du panneau SIGMET
// ============================================================

interface SigmetPanelProps {
  params: SigmetParams;
  onUpdateParam: <K extends keyof SigmetParams>(key: K, value: SigmetParams[K]) => void;
  generatedSigmet: GeneratedSigmet | null;
  onClearCoordinates: () => void;
  lightningCount: number;
  clusterCount: number;
  onRefreshLightning: () => void;
  lightningLoading: boolean;
}

export default function SigmetPanel({
  params,
  onUpdateParam,
  generatedSigmet,
  onClearCoordinates,
  lightningCount,
  clusterCount,
  onRefreshLightning,
  lightningLoading,
}: SigmetPanelProps) {
  const handleCopy = async () => {
    if (generatedSigmet) {
      await navigator.clipboard.writeText(generatedSigmet.text);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-l border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
            Parametres SIGMET
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400 bg-transparent">
            GMMM
          </Badge>
          <Badge variant="outline" className="text-[10px] border-sky-600/50 text-sky-400 bg-sky-500/10">
            FIR
          </Badge>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* --- Section Éclairs --- */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Donnees Foudre
            </Label>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-500 hover:text-sky-400"
              onClick={onRefreshLightning}
              disabled={lightningLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${lightningLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#161b22] rounded-md p-2.5 border border-slate-700/50">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                <span className="text-[10px] text-slate-500 uppercase">Eclairs</span>
              </div>
              <div className="text-lg font-mono font-bold text-yellow-400">
                {lightningCount}
              </div>
            </div>
            <div className="bg-[#161b22] rounded-md p-2.5 border border-slate-700/50">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[10px] text-slate-500 uppercase">Clusters</span>
              </div>
              <div className="text-lg font-mono font-bold text-red-400">
                {clusterCount}
              </div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-slate-700/50" />

        {/* --- Section Paramètres --- */}
        <div className="space-y-3">
          <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Configuration SIGMET
          </Label>

          {/* Phénomène */}
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-500">Phenomene</Label>
            <Select
              value={params.phenomenon}
              onValueChange={(v) => onUpdateParam('phenomenon', v as Phenomenon)}
            >
              <SelectTrigger className="h-8 bg-[#161b22] border-slate-700 text-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161b22] border-slate-700">
                {PHENOMENON_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripteur */}
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-500">Type</Label>
            <Select
              value={params.descriptor}
              onValueChange={(v) => onUpdateParam('descriptor', v as Descriptor)}
            >
              <SelectTrigger className="h-8 bg-[#161b22] border-slate-700 text-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161b22] border-slate-700">
                {DESCRIPTOR_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observation */}
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-500">Etat</Label>
            <Select
              value={params.observation}
              onValueChange={(v) => onUpdateParam('observation', v as ObservationType)}
            >
              <SelectTrigger className="h-8 bg-[#161b22] border-slate-700 text-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161b22] border-slate-700">
                {OBSERVATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mouvement */}
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-500">Mouvement</Label>
            <Select
              value={params.movement}
              onValueChange={(v) => onUpdateParam('movement', v as Movement)}
            >
              <SelectTrigger className="h-8 bg-[#161b22] border-slate-700 text-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161b22] border-slate-700">
                {MOVEMENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* TOP FL et Numéro SIGMET */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-slate-500">TOP FL</Label>
              <Input
                value={params.topFL}
                onChange={(e) => onUpdateParam('topFL', e.target.value)}
                className="h-8 bg-[#161b22] border-slate-700 text-slate-200 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-slate-500">Numero</Label>
              <Input
                value={params.sigmetNumber}
                onChange={(e) => onUpdateParam('sigmetNumber', e.target.value)}
                className="h-8 bg-[#161b22] border-slate-700 text-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          {/* Type de zone */}
          <div className="space-y-1">
            <Label className="text-[11px] text-slate-500">Type de Zone</Label>
            <Select
              value={params.zoneType}
              onValueChange={(v) => onUpdateParam('zoneType', v as ZoneType)}
            >
              <SelectTrigger className="h-8 bg-[#161b22] border-slate-700 text-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161b22] border-slate-700">
                {ZONE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-slate-700/50" />

        {/* --- Section Prévisualisation --- */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Apercu SIGMET
            </Label>
            {generatedSigmet && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-500 hover:text-red-400"
                  onClick={onClearCoordinates}
                  title="Effacer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-500 hover:text-sky-400"
                  onClick={handleCopy}
                  title="Copier"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {generatedSigmet ? (
            <Textarea
              value={generatedSigmet.text}
              readOnly
              className="min-h-[180px] bg-[#161b22] border-slate-700 text-slate-200 text-xs font-mono leading-relaxed resize-none"
            />
          ) : (
            <div className="min-h-[180px] bg-[#161b22] border border-dashed border-slate-700 rounded-md flex flex-col items-center justify-center text-center p-4">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                <Zap className="w-4 h-4 text-slate-600" />
              </div>
              <p className="text-[11px] text-slate-500">
                Dessinez un{params.zoneType === 'WI' ? ' polygone' : 'e ligne'} sur la carte pour generer le SIGMET
              </p>
            </div>
          )}
        </div>

        {/* Info validité */}
        {generatedSigmet && (
          <div className="bg-sky-500/5 border border-sky-500/20 rounded-md p-3 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Emission</span>
              <span className="text-sky-400 font-mono">{generatedSigmet.issueTime}Z</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Debut</span>
              <span className="text-sky-400 font-mono">{generatedSigmet.validFrom}Z</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Fin</span>
              <span className="text-sky-400 font-mono">{generatedSigmet.validTo}Z</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Validite</span>
              <span className="text-green-400 font-mono">4H00</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700/50 text-center">
        <p className="text-[10px] text-slate-600">
          FIR Maroc | Validite 4H | Mise a jour 30s
        </p>
      </div>
    </div>
  );
}
