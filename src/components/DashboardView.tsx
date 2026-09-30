import React from 'react';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  Droplets, 
  Dumbbell, 
  Pill, 
  Bell, 
  ArrowRight, 
  Clock, 
  Sparkles,
  Bot
} from 'lucide-react';
import { DayData } from '../types';
import { translations } from '../i18n/translations';
import { formatTimeDisplay, formatDateDisplay } from '../utils/date';

interface DashboardViewProps {
  todayData: DayData;
  onOpenDaily: () => void;
  onOpenAI: () => void;
  language: 'en' | 'ar';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  todayData,
  onOpenDaily,
  onOpenAI,
  language,
}) => {
  const t = translations[language];
  const { formattedDate } = formatDateDisplay(todayData.date, language);

  const totalTasks = todayData.tasks.length;
  const completedTasks = todayData.tasks.filter((t) => t.completed).length;

  const totalSteps = todayData.smallSteps.length;
  const completedSteps = todayData.smallSteps.filter((s) => s.completed).length;

  const totalItems = totalTasks + totalSteps;
  const completedItems = completedTasks + completedSteps;
  const overallPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const waterPercent = Math.min(
    100,
    Math.round((todayData.water.currentMl / Math.max(1, todayData.water.targetMl)) * 100)
  );

  const totalSupps = todayData.supplements.length;
  const takenSupps = todayData.supplements.filter((s) => s.taken).length;
  const suppPercent = totalSupps > 0 ? Math.round((takenSupps / totalSupps) * 100) : 0;

  const upcomingReminders = todayData.reminders.filter((r) => !r.completed);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 animate-in fade-in duration-200">
      {/* Top Banner Card */}
      <div className="bg-[#14402a] text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block mb-1">
              {t.todaySummary}
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {formattedDate}
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-md">
              {overallPercentage === 100
                ? (language === 'ar' ? '🎉 يوم استثنائي! حققت جميع أهداف ومهام اليوم!' : '🎉 Outstanding day! You completed all planned items!')
                : (language === 'ar' ? 'استمر بالتركيز لإنجاز باقي مهام وعادات اليوم.' : 'Stay focused to complete your remaining tasks and habits.')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAI}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all hover:scale-102"
            >
              <Bot className="w-4 h-4 text-emerald-300" />
              <span>{t.navAssistant}</span>
            </button>
            <button
              onClick={onOpenDaily}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white text-[#14402a] font-bold text-xs shadow-sm hover:bg-emerald-50 transition-all hover:scale-102"
            >
              <span>{t.openToday}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Circular Progress Gauge in Header */}
        <div className="mt-6 pt-5 border-t border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-white">
              {overallPercentage}%
            </span>
            <span className="text-xs text-emerald-200">
              {t.overallCompletion}
            </span>
          </div>

          <div className="w-40 sm:w-60 bg-emerald-950/60 h-2.5 rounded-full overflow-hidden border border-emerald-700/50">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tasks Card */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-950/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {t.tasksTitle}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#14402a] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-2xl font-black text-gray-800">
              {completedTasks}
            </span>
            <span className="text-xs text-gray-400 font-semibold ml-1">
              / {totalTasks}
            </span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#14402a] h-full"
              style={{
                width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Water Card */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-950/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {t.waterTitle}
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-2xl font-black text-gray-800">
              {(todayData.water.currentMl / 1000).toFixed(1)}
            </span>
            <span className="text-xs text-gray-400 font-semibold ml-1">
              / {(todayData.water.targetMl / 1000).toFixed(1)} L
            </span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-600 h-full"
              style={{ width: `${waterPercent}%` }}
            />
          </div>
        </div>

        {/* Creatine Card */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-950/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {t.creatineTitle}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-200 flex items-center justify-center font-bold">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <span className={`text-xl font-black ${
              todayData.creatine.taken ? 'text-emerald-800' : 'text-gray-400'
            }`}>
              {todayData.creatine.taken ? t.creatineTaken : t.notTaken}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            {t.usualDose}: {todayData.creatine.dose || '5g'}
          </p>
        </div>

        {/* Supplements Card */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-950/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {t.supplementsTitle}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-2xl font-black text-gray-800">
              {takenSupps}
            </span>
            <span className="text-xs text-gray-400 font-semibold ml-1">
              / {totalSupps}
            </span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-700 h-full"
              style={{ width: `${suppPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Upcoming Reminders Section */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-950/5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 tracking-tight">
              {language === 'ar' ? 'التذكيرات القادمة' : 'Upcoming Reminders'}
            </h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
            {upcomingReminders.length}
          </span>
        </div>

        {upcomingReminders.length === 0 ? (
          <p className="text-xs text-gray-400 py-3 text-center">
            {t.noReminders}
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingReminders.map((rem) => (
              <div
                key={rem.id}
                className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/50 flex items-center justify-between"
              >
                <span className="text-xs font-bold text-gray-800" dir="auto">
                  {rem.text}
                </span>
                {rem.time && (
                  <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeDisplay(rem.time)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
