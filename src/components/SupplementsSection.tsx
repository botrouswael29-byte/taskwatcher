import React, { useState } from 'react';
import { 
  Pill, 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  X,
  Square,
  CheckSquare
} from 'lucide-react';
import { SupplementItem } from '../types';
import { translations } from '../i18n/translations';
import { notificationService } from '../services/notification';
import { formatTimeDisplay } from '../utils/date';

interface SupplementsSectionProps {
  supplements: SupplementItem[];
  onUpdateSupplements: (supplements: SupplementItem[]) => void;
  language: 'en' | 'ar';
  hapticEnabled?: boolean;
}

export const SupplementsSection: React.FC<SupplementsSectionProps> = ({
  supplements,
  onUpdateSupplements,
  language,
  hapticEnabled = true,
}) => {
  const t = translations[language];
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [dose, setDose] = useState('1');
  const [unit, setUnit] = useState('capsule');
  const [dailyTarget, setDailyTarget] = useState(1);
  const [time, setTime] = useState('');

  const resetForm = () => {
    setName('');
    setDose('1');
    setUnit('capsule');
    setDailyTarget(1);
    setTime('');
    setIsAdding(false);
  };

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    const newItem: SupplementItem = {
      id: `supp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: name.trim(),
      dose: dose.trim() || '1',
      unit: unit.trim() || 'capsule',
      dailyTarget: Math.max(1, dailyTarget),
      time: time.trim() || undefined,
      taken: false,
    };

    onUpdateSupplements([...supplements, newItem]);
    resetForm();
  };

  const handleToggleTaken = (id: string) => {
    const updated = supplements.map((s) => {
      if (s.id === id) {
        const next = !s.taken;
        if (next) {
          notificationService.playChime('task');
          notificationService.vibrate(25, hapticEnabled);
        }
        return { ...s, taken: next };
      }
      return s;
    });
    onUpdateSupplements(updated);
  };

  const handleDelete = (id: string) => {
    onUpdateSupplements(supplements.filter((s) => s.id !== id));
  };

  const takenCount = supplements.filter((s) => s.taken).length;
  const totalCount = supplements.length;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-emerald-950/5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold">
            <Pill className="w-4 h-4 text-purple-700" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 tracking-tight">
              {t.supplementsTitle}
            </h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 font-bold border border-purple-200">
            {takenCount} / {totalCount} {t.completed}
          </span>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#14402a] text-white text-xs font-semibold hover:bg-[#1b4d36] transition-all active:scale-95 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addSupplement}</span>
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="mb-4 p-4 rounded-xl bg-purple-50/40 border border-purple-200/60 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-950">
              {t.addSupplement}
            </span>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                {t.supplementName}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vitamin D3, Zinc, Magnesium..."
                className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-700"
                dir="auto"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  {t.dose}
                </label>
                <input
                  type="text"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder="1, 500..."
                  className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-700"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  {t.unit}
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="capsule, tablet..."
                  className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-700"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">
              {t.time} ({language === 'ar' ? 'اختياري' : 'optional'})
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full sm:w-1/2 text-xs p-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleAdd}
              disabled={!name.trim()}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#14402a] text-white text-xs font-semibold hover:bg-[#1b4d36] disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t.save}</span>
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {supplements.length === 0 ? (
          <div className="text-center py-5 text-gray-400">
            <p className="text-xs">{t.noSupplements}</p>
          </div>
        ) : (
          supplements.map((supp) => (
            <div
              key={supp.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                supp.taken
                  ? 'bg-purple-50/30 border-purple-200/50'
                  : 'bg-white border-gray-200/70 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                <button
                  onClick={() => handleToggleTaken(supp.id)}
                  className={`transition-transform hover:scale-110 ${
                    supp.taken ? 'text-purple-700' : 'text-gray-400 hover:text-purple-700'
                  }`}
                  title={supp.taken ? t.taken : t.notTaken}
                >
                  {supp.taken ? (
                    <CheckSquare className="w-5 h-5 fill-purple-100" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-xs font-bold ${
                        supp.taken ? 'text-purple-950 line-through' : 'text-gray-800'
                      }`}
                      dir="auto"
                    >
                      {supp.name}
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {supp.dose} {supp.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    {supp.time && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                        <Clock className="w-3 h-3 text-purple-600" />
                        {formatTimeDisplay(supp.time)}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-semibold ${
                        supp.taken ? 'text-emerald-700' : 'text-gray-400'
                      }`}
                    >
                      {supp.taken ? t.taken : t.notTaken}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(supp.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title={t.delete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
