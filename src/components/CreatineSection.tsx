import React, { useState } from 'react';
import { 
  Dumbbell, 
  CheckCircle2, 
  XCircle, 
  Settings2, 
  Check, 
  X, 
  Sparkles,
  Flame
} from 'lucide-react';
import { CreatineData, DayData } from '../types';
import { translations } from '../i18n/translations';
import { notificationService } from '../services/notification';

interface CreatineSectionProps {
  creatine: CreatineData;
  onUpdateCreatine: (creatine: CreatineData) => void;
  language: 'en' | 'ar';
  allDaysHistory?: DayData[];
  hapticEnabled?: boolean;
}

export const CreatineSection: React.FC<CreatineSectionProps> = ({
  creatine,
  onUpdateCreatine,
  language,
  allDaysHistory = [],
  hapticEnabled = true,
}) => {
  const t = translations[language];
  const [isEditingDose, setIsEditingDose] = useState(false);
  const [doseInput, setDoseInput] = useState(creatine?.dose || '5g');

  const isTaken = !!creatine?.taken;

  const handleToggle = () => {
    const nextTaken = !isTaken;
    if (nextTaken) {
      notificationService.playChime('celebrate');
      notificationService.vibrate(25, hapticEnabled);
    }

    onUpdateCreatine({
      ...creatine,
      taken: nextTaken,
      takenTime: nextTaken ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    });
  };

  const handleSaveDose = () => {
    if (doseInput.trim()) {
      onUpdateCreatine({
        ...creatine,
        dose: doseInput.trim(),
      });
    }
    setIsEditingDose(false);
  };

  // Calculate simple recent days completion
  const recentDays = allDaysHistory.slice(0, 7).reverse();

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-emerald-950/5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-950 text-emerald-100 flex items-center justify-center font-bold">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 tracking-tight">
              {t.creatineTitle}
            </h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 font-bold border border-emerald-200">
            {creatine.dose || '5g'}
          </span>
        </div>

        <button
          onClick={() => {
            setDoseInput(creatine.dose || '5g');
            setIsEditingDose(!isEditingDose);
          }}
          className="p-1.5 text-gray-400 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
          title={t.changeDose}
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Dose Edit Drawer */}
      {isEditingDose && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 flex items-center gap-2 animate-in fade-in duration-150">
          <label className="text-xs text-emerald-950 font-semibold">
            {t.usualDose}:
          </label>
          <input
            type="text"
            value={doseInput}
            onChange={(e) => setDoseInput(e.target.value)}
            placeholder="5g"
            className="w-24 text-xs p-1.5 rounded-lg bg-white border border-emerald-300 focus:outline-none focus:ring-1 focus:ring-[#14402a]"
          />
          <button
            onClick={handleSaveDose}
            className="px-3 py-1.5 rounded-lg bg-[#14402a] text-white text-xs font-semibold hover:bg-[#1b4d36]"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsEditingDose(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Interactive Status Card */}
      <div className={`p-4 rounded-xl border transition-all ${
        isTaken 
          ? 'bg-emerald-900 text-white border-emerald-800 shadow-sm'
          : 'bg-[#f8faf9] text-gray-800 border-emerald-900/10'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isTaken ? 'bg-emerald-500 text-[#0d2a1b]' : 'bg-gray-200 text-gray-500'
            }`}>
              {isTaken ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <XCircle className="w-7 h-7" />
              )}
            </div>

            <div>
              <p className={`text-xs uppercase tracking-wider font-bold ${
                isTaken ? 'text-emerald-200' : 'text-gray-400'
              }`}>
                {t.creatineStatus}
              </p>
              <h3 className="text-lg font-black tracking-tight">
                {isTaken ? t.creatineTaken : t.notTaken}
              </h3>
              {isTaken && creatine.takenTime && (
                <p className="text-[11px] text-emerald-200/80 font-medium">
                  {language === 'ar' ? `سُجلت في ${creatine.takenTime}` : `Logged at ${creatine.takenTime}`}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleToggle}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-xs flex items-center justify-center gap-2 ${
              isTaken
                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                : 'bg-[#14402a] hover:bg-[#1b4d36] text-white'
            }`}
          >
            {isTaken ? (
              <span>{language === 'ar' ? 'إلغاء التسجيل' : 'Undo Status'}</span>
            ) : (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>{t.takeCreatine}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Consistency History dots if available */}
      {recentDays.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.creatineStreak}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {recentDays.map((d) => (
              <div
                key={d.date}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  d.creatine?.taken
                    ? 'bg-emerald-700 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
                title={`${d.date}: ${d.creatine?.taken ? 'Taken' : 'Missed'}`}
              >
                {d.creatine?.taken ? '✓' : '•'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
