import React from 'react';
import { DayData, TaskItem, SmallStepItem, ReminderItem, WaterData, SupplementItem, CreatineData, QuoteData } from '../types';
import { QuoteCard } from './QuoteCard';
import { TasksSection } from './TasksSection';
import { SmallStepsSection } from './SmallStepsSection';
import { RemindersSection } from './RemindersSection';
import { WaterTrackerSection } from './WaterTrackerSection';
import { SupplementsSection } from './SupplementsSection';
import { CreatineSection } from './CreatineSection';
import { translations } from '../i18n/translations';
import { CheckCircle2 } from 'lucide-react';

interface DailyPageProps {
  dayData: DayData;
  onUpdateDay: (updated: DayData) => void;
  language: 'en' | 'ar';
  allDaysHistory: DayData[];
  hapticEnabled?: boolean;
}

export const DailyPage: React.FC<DailyPageProps> = ({
  dayData,
  onUpdateDay,
  language,
  allDaysHistory,
  hapticEnabled = true,
}) => {
  const t = translations[language];

  // Calculate day completion percentage (tasks + small steps)
  const totalTasks = dayData.tasks.length;
  const completedTasks = dayData.tasks.filter((t) => t.completed).length;

  const totalSteps = dayData.smallSteps.length;
  const completedSteps = dayData.smallSteps.filter((s) => s.completed).length;

  const totalActionItems = totalTasks + totalSteps;
  const completedActionItems = completedTasks + completedSteps;
  const overallPercentage = totalActionItems > 0 
    ? Math.round((completedActionItems / totalActionItems) * 100) 
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 transition-all">
      {/* Day Progress Indicator Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-emerald-950/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#14402a] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">
                {t.dayProgress}
              </span>
              <span className="text-xs font-black text-emerald-800">
                {overallPercentage}%
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              {completedActionItems} / {totalActionItems} {t.tasksAndSteps} {t.completed}
            </p>
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="w-24 sm:w-36 bg-gray-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-[#14402a] h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
      </div>

      {/* Section 1: Today's Quote */}
      <QuoteCard
        date={dayData.date}
        quote={dayData.quote}
        onUpdateQuote={(quote: QuoteData) => onUpdateDay({ ...dayData, quote })}
        language={language}
      />

      {/* Section 2: Tasks */}
      <TasksSection
        tasks={dayData.tasks}
        onUpdateTasks={(tasks: TaskItem[]) => onUpdateDay({ ...dayData, tasks })}
        language={language}
        hapticEnabled={hapticEnabled}
      />

      {/* Section 3: Small Steps */}
      <SmallStepsSection
        steps={dayData.smallSteps}
        onUpdateSteps={(smallSteps: SmallStepItem[]) => onUpdateDay({ ...dayData, smallSteps })}
        language={language}
        hapticEnabled={hapticEnabled}
      />

      {/* Section 4: Important Reminders */}
      <RemindersSection
        reminders={dayData.reminders}
        onUpdateReminders={(reminders: ReminderItem[]) => onUpdateDay({ ...dayData, reminders })}
        language={language}
        currentDate={dayData.date}
        hapticEnabled={hapticEnabled}
      />

      {/* Section 5: Water Tracker */}
      <WaterTrackerSection
        water={dayData.water}
        onUpdateWater={(water: WaterData) => onUpdateDay({ ...dayData, water })}
        language={language}
      />

      {/* Section 6: Supplements */}
      <SupplementsSection
        supplements={dayData.supplements}
        onUpdateSupplements={(supplements: SupplementItem[]) => onUpdateDay({ ...dayData, supplements })}
        language={language}
        hapticEnabled={hapticEnabled}
      />

      {/* Section 7: Creatine Tracker */}
      <CreatineSection
        creatine={dayData.creatine}
        onUpdateCreatine={(creatine: CreatineData) => onUpdateDay({ ...dayData, creatine })}
        language={language}
        allDaysHistory={allDaysHistory}
        hapticEnabled={hapticEnabled}
      />
    </div>
  );
};
