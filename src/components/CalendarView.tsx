import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Droplets, 
  Dumbbell, 
  Clock 
} from 'lucide-react';
import { DayData } from '../types';
import { translations } from '../i18n/translations';
import { getTodayDateString } from '../utils/date';

interface CalendarViewProps {
  currentDate: string;
  allDays: DayData[];
  onSelectDate: (date: string) => void;
  language: 'en' | 'ar';
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  allDays,
  onSelectDate,
  language,
}) => {
  const t = translations[language];
  const isRtl = language === 'ar';

  const [currentYear, setCurrentYear] = useState(() => {
    return parseInt(currentDate.split('-')[0], 10) || new Date().getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    return parseInt(currentDate.split('-')[1], 10) - 1 || new Date().getMonth();
  });

  const todayStr = getTodayDateString();

  // Create a map for fast lookup of day records
  const dayDataMap = new Map<string, DayData>();
  allDays.forEach((d) => {
    dayDataMap.set(d.date, d);
  });

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Get month name
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString(
    language === 'ar' ? 'ar-EG' : 'en-US',
    { month: 'long', year: 'numeric' }
  );

  // Month days computation
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const dayCells = [];
  // Empty leading cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    dayCells.push(null);
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateKey = `${currentYear}-${mStr}-${dStr}`;
    dayCells.push({
      dayNumber: d,
      dateKey,
      data: dayDataMap.get(dateKey),
    });
  }

  const weekDayNames = language === 'ar'
    ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 animate-in fade-in duration-200">
      {/* Calendar Card */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-emerald-950/5">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#14402a] flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800 capitalize">
                {monthName}
              </h2>
              <p className="text-xs text-gray-400">
                {t.monthView}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setCurrentYear(now.getFullYear());
                setCurrentMonth(now.getMonth());
                onSelectDate(todayStr);
              }}
              className="px-3 py-1 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              {t.todayBtn}
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Days of week row */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekDayNames.map((name, i) => (
            <div key={i} className="text-[11px] font-bold text-gray-400 py-1">
              {name}
            </div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {dayCells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty_${idx}`} className="h-20 sm:h-24 rounded-2xl bg-transparent" />;
            }

            const { dayNumber, dateKey, data } = cell;
            const isSelected = dateKey === currentDate;
            const isTodayDate = dateKey === todayStr;

            const totalTasks = data?.tasks?.length || 0;
            const completedTasks = data?.tasks?.filter((t) => t.completed).length || 0;
            const incompleteTasks = totalTasks - completedTasks;
            const waterReached = (data?.water?.currentMl || 0) >= (data?.water?.targetMl || 3000) && (data?.water?.targetMl || 0) > 0;
            const creatineTaken = !!data?.creatine?.taken;

            return (
              <div
                key={dateKey}
                onClick={() => onSelectDate(dateKey)}
                className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:scale-102 active:scale-98 ${
                  isSelected
                    ? 'border-[#14402a] ring-2 ring-[#14402a]/20 bg-emerald-50/40 shadow-xs'
                    : isTodayDate
                    ? 'border-emerald-600/50 bg-white font-bold'
                    : 'border-gray-100 bg-[#fbfcfb] hover:border-emerald-200 hover:bg-white'
                }`}
              >
                {/* Cell Header: Day Number */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isTodayDate
                        ? 'bg-[#14402a] text-white'
                        : isSelected
                        ? 'bg-emerald-200/80 text-emerald-950'
                        : 'text-gray-700'
                    }`}
                  >
                    {dayNumber}
                  </span>

                  {totalTasks > 0 && (
                    <span className="text-[10px] text-gray-500 font-semibold hidden sm:inline">
                      {completedTasks}/{totalTasks}
                    </span>
                  )}
                </div>

                {/* Subtle dark-green visual indicators */}
                <div className="space-y-1">
                  {/* Task bar */}
                  {totalTasks > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-[#14402a] h-full"
                          style={{
                            width: `${Math.round((completedTasks / totalTasks) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Habit Badges */}
                  <div className="flex items-center gap-1">
                    {waterReached && (
                      <span className="w-2 h-2 rounded-full bg-cyan-600" title="Water Goal Reached" />
                    )}
                    {creatineTaken && (
                      <span className="w-2 h-2 rounded-full bg-[#14402a]" title="Creatine Taken" />
                    )}
                    {incompleteTasks > 0 && (
                      <span className="text-[9px] text-amber-700 font-semibold px-1 bg-amber-50 rounded hidden sm:inline">
                        {incompleteTasks} left
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#14402a]" />
            <span>{t.tasksCompleted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
            <span>{t.waterProgress}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
            <span>{t.creatineRecord}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
