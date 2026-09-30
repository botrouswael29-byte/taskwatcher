import React, { useState } from 'react';
import { 
  History, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Droplets, 
  Dumbbell, 
  Pill, 
  Quote, 
  Calendar as CalendarIcon, 
  ArrowRight 
} from 'lucide-react';
import { DayData } from '../types';
import { translations } from '../i18n/translations';
import { formatDateDisplay } from '../utils/date';

interface HistoryViewProps {
  allDays: DayData[];
  onSelectDate: (date: string) => void;
  language: 'en' | 'ar';
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  allDays,
  onSelectDate,
  language,
}) => {
  const t = translations[language];
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDays = allDays.filter((d) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const dateMatch = d.date.includes(term);
    const quoteMatch = d.quote?.text?.toLowerCase().includes(term);
    const taskMatch = d.tasks?.some((t) => t.title.toLowerCase().includes(term));
    return dateMatch || quoteMatch || taskMatch;
  });

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 animate-in fade-in duration-200">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-emerald-950/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#14402a] flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800 tracking-tight">
                {t.historyTitle}
              </h2>
              <p className="text-xs text-gray-400">
                {t.historyDesc}
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 rtl:right-3 rtl:left-auto" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchDays}
              className="w-full text-xs pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#14402a]"
            />
          </div>
        </div>

        {/* Days List */}
        <div className="space-y-3">
          {filteredDays.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-xs">
                {language === 'ar' ? 'لا توجد سجلات مطابقة للبحث.' : 'No recorded days matching your search.'}
              </p>
            </div>
          ) : (
            filteredDays.map((day) => {
              const { dayLabel, formattedDate } = formatDateDisplay(day.date, language);
              const completedTasks = day.tasks?.filter((t) => t.completed).length || 0;
              const incompleteTasks = (day.tasks?.length || 0) - completedTasks;
              const totalTasks = day.tasks?.length || 0;
              const waterL = ((day.water?.currentMl || 0) / 1000).toFixed(1);
              const waterTargetL = ((day.water?.targetMl || 3000) / 1000).toFixed(1);
              const suppTaken = day.supplements?.filter((s) => s.taken).length || 0;
              const suppTotal = day.supplements?.length || 0;

              return (
                <div
                  key={day.date}
                  onClick={() => onSelectDate(day.date)}
                  className="bg-[#fbfcfb] hover:bg-white p-4 rounded-2xl border border-gray-200/80 hover:border-emerald-800/30 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-3">
                    <div>
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                        {dayLabel}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">
                        {formattedDate}
                      </span>
                    </div>

                    <button className="self-end sm:self-auto flex items-center gap-1 text-xs font-bold text-emerald-800 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      <span>{t.viewDay}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </div>

                  {/* Daily Quote if present */}
                  {day.quote?.text && (
                    <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-50/50 border border-emerald-900/5 text-xs text-gray-700 italic flex items-center gap-2">
                      <Quote className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                      <span className="truncate">"{day.quote.text}"</span>
                    </div>
                  )}

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {/* Tasks */}
                    <div className="p-2 rounded-xl bg-white border border-gray-100 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#14402a] flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">
                          {t.tasksTitle}
                        </span>
                        <span className="font-bold text-gray-800">
                          {completedTasks} / {totalTasks}
                        </span>
                      </div>
                    </div>

                    {/* Water */}
                    <div className="p-2 rounded-xl bg-white border border-gray-100 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">
                          {t.waterTitle}
                        </span>
                        <span className="font-bold text-gray-800">
                          {waterL} / {waterTargetL} L
                        </span>
                      </div>
                    </div>

                    {/* Creatine */}
                    <div className="p-2 rounded-xl bg-white border border-gray-100 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-200 flex items-center justify-center font-bold">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">
                          {t.creatineTitle}
                        </span>
                        <span className={`font-bold ${day.creatine?.taken ? 'text-emerald-700' : 'text-gray-500'}`}>
                          {day.creatine?.taken ? t.creatineTaken : t.notTaken}
                        </span>
                      </div>
                    </div>

                    {/* Supplements */}
                    <div className="p-2 rounded-xl bg-white border border-gray-100 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">
                          {t.supplementsTitle}
                        </span>
                        <span className="font-bold text-gray-800">
                          {suppTaken} / {suppTotal}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
