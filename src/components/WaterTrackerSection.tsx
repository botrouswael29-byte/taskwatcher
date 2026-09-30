import React, { useState } from 'react';
import { 
  Droplets, 
  RotateCcw, 
  Plus, 
  Check, 
  Settings2, 
  X,
  Sparkles
} from 'lucide-react';
import { WaterData } from '../types';
import { translations } from '../i18n/translations';
import { notificationService } from '../services/notification';

interface WaterTrackerSectionProps {
  water: WaterData;
  onUpdateWater: (water: WaterData) => void;
  language: 'en' | 'ar';
}

export const WaterTrackerSection: React.FC<WaterTrackerSectionProps> = ({
  water,
  onUpdateWater,
  language,
}) => {
  const t = translations[language];
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(String(water.targetMl / 1000));
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);

  const currentL = (water.currentMl / 1000).toFixed(1);
  const targetL = (water.targetMl / 1000).toFixed(1);
  const percentage = Math.min(100, Math.round((water.currentMl / Math.max(1, water.targetMl)) * 100));
  const isTargetReached = water.currentMl >= water.targetMl && water.targetMl > 0;

  const handleAddAmount = (amountMl: number) => {
    const nextCurrent = water.currentMl + amountMl;
    const history = [...(water.history || []), amountMl];
    notificationService.playChime('water');

    if (nextCurrent >= water.targetMl && water.currentMl < water.targetMl) {
      notificationService.playChime('celebrate');
    }

    onUpdateWater({
      ...water,
      currentMl: nextCurrent,
      history,
    });
  };

  const handleUndo = () => {
    const history = [...(water.history || [])];
    if (history.length === 0) return;
    const last = history.pop() || 0;
    onUpdateWater({
      ...water,
      currentMl: Math.max(0, water.currentMl - last),
      history,
    });
  };

  const handleSaveTarget = () => {
    const num = parseFloat(targetInput);
    if (!isNaN(num) && num > 0) {
      onUpdateWater({
        ...water,
        targetMl: Math.round(num * 1000),
      });
    }
    setIsEditingTarget(false);
  };

  const handleManualAdd = () => {
    const num = parseFloat(manualInput);
    if (!isNaN(num) && num !== 0) {
      const addedMl = Math.round(num * 1000);
      handleAddAmount(addedMl);
      setManualInput('');
      setShowManual(false);
    }
  };

  // SVG Circular progress math
  const size = 110;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-emerald-950/5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-cyan-50 text-cyan-800 flex items-center justify-center font-bold">
            <Droplets className="w-4 h-4 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 tracking-tight">
              {t.waterTitle}
            </h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 font-bold border border-cyan-200">
            {currentL} L / {targetL} L
          </span>
        </div>

        <button
          onClick={() => {
            setTargetInput(String(water.targetMl / 1000));
            setIsEditingTarget(!isEditingTarget);
          }}
          className="p-1.5 text-gray-400 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
          title={t.setTarget}
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Target Edit Drawer */}
      {isEditingTarget && (
        <div className="mb-4 p-3 rounded-xl bg-cyan-50/50 border border-cyan-200/60 flex items-center gap-2 animate-in fade-in duration-150">
          <label className="text-xs text-cyan-900 font-semibold">
            {t.waterTargetLabel} (L):
          </label>
          <input
            type="number"
            step="0.1"
            min="0.5"
            max="10"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            className="w-20 text-xs p-1.5 rounded-lg bg-white border border-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-600"
          />
          <button
            onClick={handleSaveTarget}
            className="px-3 py-1.5 rounded-lg bg-[#14402a] text-white text-xs font-semibold hover:bg-[#1b4d36]"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsEditingTarget(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Circular & Buttons Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 my-2">
        {/* Visual Circular Gauge */}
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Animated progress ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isTargetReached ? '#059669' : '#0891b2'}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-black text-gray-800 tracking-tight">
              {percentage}%
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              {currentL} / {targetL} L
            </span>
          </div>
        </div>

        {/* Quick Increment Buttons */}
        <div className="flex-1 w-full space-y-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: '+250 ml', ml: 250 },
              { label: '+500 ml', ml: 500 },
              { label: '+750 ml', ml: 750 },
              { label: '+1 L', ml: 1000 },
            ].map((btn) => (
              <button
                key={btn.ml}
                onClick={() => handleAddAmount(btn.ml)}
                className="py-2 px-2 rounded-xl border border-cyan-100 bg-cyan-50/50 hover:bg-cyan-100/70 hover:border-cyan-300 text-cyan-900 font-bold text-xs transition-all active:scale-95 shadow-2xs flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3 text-cyan-600" />
                <span>{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Secondary Controls: Undo & Manual adjustment */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleUndo}
              disabled={!water.history || water.history.length === 0}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30 transition-colors p-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.undo}</span>
            </button>

            {showManual ? (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-100">
                <input
                  type="number"
                  step="0.1"
                  placeholder="±L"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-16 text-xs p-1 border rounded-lg"
                  autoFocus
                />
                <button
                  onClick={handleManualAdd}
                  className="p-1 rounded bg-[#14402a] text-white"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setShowManual(false)}
                  className="p-1 text-gray-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowManual(true)}
                className="text-xs text-cyan-700 hover:underline font-medium"
              >
                {language === 'ar' ? 'تعديل يدوي' : 'Manual Entry'}
              </button>
            )}
          </div>
        </div>
      </div>

      {isTargetReached && (
        <div className="mt-3 py-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-300">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t.targetReached}</span>
        </div>
      )}
    </div>
  );
};
