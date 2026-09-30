import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Check, Bell, X } from 'lucide-react';
import { ActiveOverlayReminder } from '../types';
import { translations } from '../i18n/translations';

interface FloatingReminderOverlayProps {
  reminder: ActiveOverlayReminder | null;
  onDone: (reminder: ActiveOverlayReminder) => void;
  onLater: (reminder: ActiveOverlayReminder) => void;
  onOpenItem: (reminder: ActiveOverlayReminder) => void;
  language: 'en' | 'ar';
}

export const FloatingReminderOverlay: React.FC<FloatingReminderOverlayProps> = ({
  reminder,
  onDone,
  onLater,
  onOpenItem,
  language,
}) => {
  const t = translations[language];
  const [progress, setProgress] = useState(100);

  // Auto-dismiss countdown (12 seconds)
  useEffect(() => {
    if (!reminder) return;
    setProgress(100);

    const startTime = Date.now();
    const duration = 12000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (elapsed >= duration) {
        clearInterval(interval);
        onLater(reminder);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [reminder]);

  if (!reminder) return null;

  return (
    <AnimatePresence>
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none px-3">
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="pointer-events-auto w-full max-w-sm bg-[#14402a] text-white rounded-3xl p-4 shadow-2xl border border-emerald-500/30 overflow-hidden relative"
        >
          {/* Top auto-dismiss progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-emerald-400 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                <Bell className="w-3 h-3" />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                {t.appName}
              </span>
            </div>

            <button
              onClick={() => onLater(reminder)}
              className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"
              title={language === 'ar' ? 'إغلاق' : 'Dismiss'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body Content */}
          <div
            onClick={() => onOpenItem(reminder)}
            className="cursor-pointer group py-1"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-xl shrink-0">⏰</span>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black tracking-tight text-white truncate" dir="auto">
                  {reminder.title}
                </h4>
                <p className="text-xs text-emerald-100/80 mt-0.5" dir="auto">
                  {reminder.subtitle || (language === 'ar' ? 'حان وقت مهمتك الآن' : "It's time for your task")}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Done / Later */}
          <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-white/10">
            <button
              onClick={() => onLater(reminder)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all"
            >
              {language === 'ar' ? 'لاحقاً' : 'Later'}
            </button>
            <button
              onClick={() => onDone(reminder)}
              className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#0d2a1b] text-xs font-black shadow-sm transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5 stroke-3" />
              <span>{language === 'ar' ? 'تم الإنجاز' : 'Done'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
