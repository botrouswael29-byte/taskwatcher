import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Clock, 
  ArrowRight, 
  Calendar as CalendarIcon, 
  Droplets, 
  Dumbbell, 
  Bell, 
  AlertCircle,
  KeyRound,
  Settings as SettingsIcon
} from 'lucide-react';
import { DayData, DayPlanResponse, TaskItem } from '../types';
import { planDayWithAI, MissingApiKeyError } from '../services/ai';
import { translations } from '../i18n/translations';
import { formatTimeDisplay } from '../utils/date';
import { notificationService } from '../services/notification';
import { getSavedApiKey } from '../services/apiKeyStorage';

interface PlanMyDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayData: DayData;
  onApplySchedule: (updatedTasks: TaskItem[]) => void;
  language: 'en' | 'ar';
  onOpenSettings?: () => void;
}

export const PlanMyDayModal: React.FC<PlanMyDayModalProps> = ({
  isOpen,
  onClose,
  dayData,
  onApplySchedule,
  language,
  onOpenSettings,
}) => {
  const t = translations[language];
  const [loading, setLoading] = useState(false);
  const [planResult, setPlanResult] = useState<DayPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isKeyError, setIsKeyError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlan();
    } else {
      setPlanResult(null);
      setError(null);
      setIsKeyError(false);
    }
  }, [isOpen]);

  const loadPlan = async () => {
    setLoading(true);
    setError(null);
    setIsKeyError(false);

    const savedKey = await getSavedApiKey();
    if (!savedKey) {
      setError(
        language === 'ar'
          ? 'يرجى إضافة Gemini API Key من إعدادات المساعد الذكي أولاً.'
          : 'Please add a Gemini API Key from Smart Assistant settings first.'
      );
      setIsKeyError(true);
      setLoading(false);
      return;
    }

    try {
      const res = await planDayWithAI(dayData, language);
      setPlanResult(res);
    } catch (err: any) {
      const isMissing = err instanceof MissingApiKeyError || err?.code === 'MISSING_API_KEY';
      setIsKeyError(isMissing);
      setError(
        err?.message || (
          language === 'ar'
            ? 'تعذر إنشاء الخطة الذكية عبر الإنترنت حالياً. يرجى التحقق من اتصالك بالإنترنت.'
            : 'Unable to generate schedule right now. Please verify your internet connection.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleApply = () => {
    if (!planResult?.reorderedTasks || planResult.reorderedTasks.length === 0) {
      onClose();
      return;
    }

    // Merge suggested times into existing tasks
    const updatedTasks: TaskItem[] = dayData.tasks.map((task) => {
      const match = planResult.reorderedTasks?.find(
        (r) => r.id === task.id || r.title.toLowerCase().trim() === task.title.toLowerCase().trim()
      );
      if (match) {
        return {
          ...task,
          time: match.suggestedTime || task.time,
          priority: match.priority || task.priority,
        };
      }
      return task;
    });

    onApplySchedule(updatedTasks);
    notificationService.playChime('celebrate');
    onClose();
  };

  const handleSettingsClick = () => {
    if (onOpenSettings) {
      onClose();
      onOpenSettings();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-emerald-950/10">
        {/* Header */}
        <div className="bg-[#14402a] text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 text-yellow-300 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {t.planDayTitle}
              </h3>
              <p className="text-xs text-emerald-200/80">
                {dayData.date}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#f8faf9]">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#14402a] flex items-center justify-center font-bold animate-bounce">
                <Sparkles className="w-6 h-6 text-emerald-800" />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                {t.planningDay}
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed" dir="auto">{error}</span>
              </div>
              {isKeyError && onOpenSettings && (
                <button
                  type="button"
                  onClick={handleSettingsClick}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#14402a] text-white text-xs font-bold hover:bg-[#1b4d36] transition-all shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{t.openAssistantSettings}</span>
                </button>
              )}
            </div>
          )}

          {planResult && !loading && (
            <>
              {/* Overview Strategy Card */}
              {planResult.overview && (
                <div className="p-4 rounded-2xl bg-white border border-emerald-900/10 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                    {language === 'ar' ? 'استراتيجية وتوجيه اليوم' : 'Daily Strategy & Insights'}
                  </span>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium" dir="auto">
                    {planResult.overview}
                  </p>
                </div>
              )}

              {/* Schedule Timeline */}
              {planResult.schedule && planResult.schedule.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-800 tracking-tight block px-1">
                    {language === 'ar' ? 'الجدول الزمني المقترح' : 'Suggested Timeline'}
                  </span>

                  <div className="space-y-2">
                    {planResult.schedule.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs flex items-start gap-3 hover:border-emerald-800/30 transition-all"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0">
                          <Clock className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{formatTimeDisplay(item.time)}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-gray-800 truncate" dir="auto">
                            {item.title}
                          </p>
                          {item.tips && (
                            <p className="text-[11px] text-gray-500 mt-0.5" dir="auto">
                              💡 {item.tips}
                            </p>
                          )}
                        </div>

                        {item.type && (
                          <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md shrink-0">
                            {item.type}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-200/80 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {t.keepCurrent}
          </button>

          {planResult && !loading && (
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#14402a] text-white text-xs font-bold hover:bg-[#1b4d36] transition-all shadow-xs"
            >
              <Check className="w-3.5 h-3.5 text-emerald-300" />
              <span>{t.applySchedule}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
