import React from 'react';
import { 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Bot, 
  ChevronLeft, 
  ChevronRight, 
  Settings as SettingsIcon,
  Globe,
  LayoutDashboard,
  Clock,
  History
} from 'lucide-react';
import { formatDateDisplay } from '../utils/date';
import { translations } from '../i18n/translations';

interface HeaderProps {
  currentDate: string;
  onSelectDate: (date: string) => void;
  onNavigateOffset: (offset: number) => void;
  onOpenCalendar: () => void;
  onOpenAI: () => void;
  onOpenPlanDay: () => void;
  onOpenSettings: () => void;
  currentView: 'daily' | 'dashboard' | 'calendar' | 'history';
  onChangeView: (view: 'daily' | 'dashboard' | 'calendar' | 'history') => void;
  language: 'en' | 'ar';
  onToggleLanguage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onSelectDate,
  onNavigateOffset,
  onOpenCalendar,
  onOpenAI,
  onOpenPlanDay,
  onOpenSettings,
  currentView,
  onChangeView,
  language,
  onToggleLanguage,
}) => {
  const t = translations[language];
  const { dayLabel, formattedDate, isCurrentDay } = formatDateDisplay(currentDate, language);
  const isRtl = language === 'ar';

  return (
    <header className="sticky top-0 z-30 bg-[#14402a] text-white shadow-md transition-all">
      {/* Top Branding & Main Controls */}
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & App Name */}
        <div 
          onClick={() => onChangeView('daily')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner group-hover:scale-105 transition-transform">
            <div className="relative">
              <Clock className="w-5 h-5 text-emerald-300" />
              <CheckCircle2 className="w-3.5 h-3.5 text-white absolute -bottom-1 -right-1 bg-[#14402a] rounded-full" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
              {t.appName}
            </h1>
            <p className="text-[11px] text-emerald-200/80 font-medium">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Plan My Day AI button */}
          <button
            onClick={onOpenPlanDay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-700/60 hover:bg-emerald-600/80 text-xs font-semibold text-emerald-100 border border-emerald-500/30 transition-all hover:scale-102 active:scale-98 shadow-xs"
            title={t.planMyDay}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span className="hidden sm:inline">{t.planMyDay}</span>
          </button>

          {/* Task Watcher AI Assistant button */}
          <button
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-[#0d2a1b] shadow-sm transition-all hover:scale-105 active:scale-95"
            title={t.navAssistant}
          >
            <Bot className="w-4 h-4" />
            <span className="font-extrabold tracking-wide">AI</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            className="p-2 rounded-xl hover:bg-white/10 text-emerald-100 transition-colors"
            title={language === 'en' ? 'تغيير إلى العربية' : 'Switch to English'}
          >
            <Globe className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl hover:bg-white/10 text-emerald-100 transition-colors"
            title={t.settings}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Navigator Bar (When on Daily view) */}
      {currentView === 'daily' && (
        <div className="bg-[#0e311f] border-t border-emerald-900/40 px-4 py-2 select-none" dir="ltr">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {/* Left arrow (←): Always Previous Day (-1) */}
            <button
              type="button"
              onClick={() => onNavigateOffset(-1)}
              className="p-2 rounded-xl hover:bg-white/10 active:bg-white/20 text-emerald-200 transition-colors flex items-center justify-center cursor-pointer"
              title={language === 'ar' ? 'اليوم السابق' : 'Previous day'}
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5 text-emerald-200" />
            </button>

            {/* Central Date Display & Calendar Trigger */}
            <div 
              onClick={onOpenCalendar}
              className="flex flex-col items-center cursor-pointer group px-3 py-1 rounded-xl hover:bg-white/5 transition-all text-center"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-200 uppercase tracking-wider">
                  {dayLabel}
                </span>
                {!isCurrentDay && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-100 font-semibold border border-emerald-600/40">
                    {t.todayBtn}
                  </span>
                )}
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xs text-white/90 font-medium">
                {formattedDate}
              </span>
            </div>

            {/* Right arrow (→): Always Next Day (+1) */}
            <button
              type="button"
              onClick={() => onNavigateOffset(1)}
              className="p-2 rounded-xl hover:bg-white/10 active:bg-white/20 text-emerald-200 transition-colors flex items-center justify-center cursor-pointer"
              title={language === 'ar' ? 'اليوم التالي' : 'Next day'}
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5 text-emerald-200" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs (Android Material 3 pill style) */}
      <nav className="bg-[#14402a] border-t border-emerald-900/50 px-2 py-1.5">
        <div className="max-w-4xl mx-auto flex items-center justify-around sm:justify-center sm:gap-6">
          <button
            onClick={() => onChangeView('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currentView === 'daily'
                ? 'bg-white text-[#14402a] shadow-xs scale-102'
                : 'text-emerald-100/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t.navDaily}</span>
          </button>

          <button
            onClick={() => onChangeView('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currentView === 'dashboard'
                ? 'bg-white text-[#14402a] shadow-xs scale-102'
                : 'text-emerald-100/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{t.navDashboard}</span>
          </button>

          <button
            onClick={() => onChangeView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currentView === 'calendar'
                ? 'bg-white text-[#14402a] shadow-xs scale-102'
                : 'text-emerald-100/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{t.navCalendar}</span>
          </button>

          <button
            onClick={() => onChangeView('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currentView === 'history'
                ? 'bg-white text-[#14402a] shadow-xs scale-102'
                : 'text-emerald-100/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{t.navHistory}</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
