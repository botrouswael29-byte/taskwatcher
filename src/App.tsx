/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DayData, AppSettings, ProposedChanges, TaskItem, ActiveOverlayReminder } from './types';
import { 
  DEFAULT_SETTINGS, 
  getSettings, 
  saveSettings, 
  getDayData, 
  saveDayData, 
  getAllDays 
} from './services/storage';
import { getTodayDateString, getAdjacentDate } from './utils/date';
import { notificationService } from './services/notification';

// Components
import { Header } from './components/Header';
import { DailyPage } from './components/DailyPage';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { HistoryView } from './components/HistoryView';
import { AIAssistantModal } from './components/AIAssistantModal';
import { PlanMyDayModal } from './components/PlanMyDayModal';
import { DatePickerModal } from './components/DatePickerModal';
import { SettingsModal } from './components/SettingsModal';
import { FloatingReminderOverlay } from './components/FloatingReminderOverlay';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [allDays, setAllDays] = useState<DayData[]>([]);
  const [currentView, setCurrentView] = useState<'daily' | 'dashboard' | 'calendar' | 'history'>('daily');

  // Modals & Overlays
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isPlanDayModalOpen, setIsPlanDayModalOpen] = useState(false);
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<'general' | 'ai'>('general');
  const [activeOverlayReminder, setActiveOverlayReminder] = useState<ActiveOverlayReminder | null>(null);

  const notifiedKeysRef = useRef<Set<string>>(new Set());

  // 1. Initial Load of Settings
  useEffect(() => {
    async function loadInitialSettings() {
      const stored = await getSettings();
      setSettings(stored);
      document.documentElement.dir = stored.language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = stored.language;
    }
    loadInitialSettings();
  }, []);

  // Update HTML direction when language changes
  useEffect(() => {
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  // 2. Load Day Data whenever currentDate or settings change
  const refreshDayData = useCallback(async (date: string, appSettings: AppSettings) => {
    const data = await getDayData(date, appSettings);
    setDayData(data);
    const all = await getAllDays();
    setAllDays(all);
  }, []);

  useEffect(() => {
    refreshDayData(currentDate, settings);
  }, [currentDate, settings, refreshDayData]);

  // 3. Save Day Data updates
  const handleUpdateDay = async (updated: DayData) => {
    setDayData(updated);
    await saveDayData(updated);
    const all = await getAllDays();
    setAllDays(all);
  };

  // 4. Update Settings
  const handleUpdateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  // 5. Navigate Days (strictly through top navigation buttons)
  const handleNavigateOffset = (offset: number) => {
    const nextDate = getAdjacentDate(currentDate, offset);
    setCurrentDate(nextDate);
  };

  const handleSelectDate = (date: string) => {
    setCurrentDate(date);
    setCurrentView('daily');
  };

  const handleOpenGeneralSettings = () => {
    setSettingsInitialSection('general');
    setIsSettingsModalOpen(true);
  };

  const handleOpenAiSettings = () => {
    setSettingsInitialSection('ai');
    setIsSettingsModalOpen(true);
  };

  // 6. Apply Proposed Changes from AI Assistant
  const handleApplyChangesToDay = async (changes: ProposedChanges, targetDate?: string) => {
    const effectiveDate = targetDate || currentDate;
    const targetData = effectiveDate === currentDate && dayData 
      ? dayData 
      : await getDayData(effectiveDate, settings);

    const updated: DayData = {
      ...targetData,
      tasks: [...targetData.tasks],
      reminders: [...targetData.reminders],
      smallSteps: [...targetData.smallSteps],
      water: { ...targetData.water },
      creatine: { ...targetData.creatine },
    };

    // Add tasks
    if (changes.tasksToAdd && changes.tasksToAdd.length > 0) {
      changes.tasksToAdd.forEach((t, i) => {
        updated.tasks.push({
          id: `task_ai_${Date.now()}_${i}`,
          title: t.title,
          time: t.time || undefined,
          priority: t.priority || 'medium',
          completed: false,
          order: updated.tasks.length,
        });
      });
    }

    // Update tasks
    if (changes.tasksToUpdate && changes.tasksToUpdate.length > 0) {
      updated.tasks = updated.tasks.map((t) => {
        const u = changes.tasksToUpdate?.find((item) => item.id === t.id);
        if (u) {
          return {
            ...t,
            title: u.title !== undefined ? u.title : t.title,
            time: u.time !== undefined ? u.time : t.time,
            priority: u.priority !== undefined ? u.priority : t.priority,
            completed: u.completed !== undefined ? u.completed : t.completed,
          };
        }
        return t;
      });
    }

    // Add reminders
    if (changes.remindersToAdd && changes.remindersToAdd.length > 0) {
      changes.remindersToAdd.forEach((r, i) => {
        updated.reminders.push({
          id: `rem_ai_${Date.now()}_${i}`,
          text: r.text,
          date: r.date || effectiveDate,
          time: r.time || undefined,
          hasNotification: true,
          completed: false,
        });
      });
    }

    // Add small steps
    if (changes.smallStepsToAdd && changes.smallStepsToAdd.length > 0) {
      changes.smallStepsToAdd.forEach((s, i) => {
        updated.smallSteps.push({
          id: `step_ai_${Date.now()}_${i}`,
          text: s.text,
          completed: false,
          order: updated.smallSteps.length,
        });
      });
    }

    // Water target adjustment
    if (changes.waterTargetMl) {
      updated.water.targetMl = changes.waterTargetMl;
    }
    if (changes.waterAddMl) {
      updated.water.currentMl += changes.waterAddMl;
      updated.water.history = [...(updated.water.history || []), changes.waterAddMl];
    }

    // Creatine status
    if (changes.creatineTaken !== null && changes.creatineTaken !== undefined) {
      updated.creatine.taken = changes.creatineTaken;
      if (changes.creatineTaken) {
        updated.creatine.takenTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }

    await handleUpdateDay(updated);
  };

  // 7. Apply Plan My Day Schedule
  const handleApplySchedule = async (updatedTasks: TaskItem[]) => {
    if (!dayData) return;
    const updated: DayData = {
      ...dayData,
      tasks: updatedTasks,
    };
    await handleUpdateDay(updated);
  };

  // 8. Handle marking an item completed directly from lock-screen notification action or overlay
  const handleMarkItemDone = useCallback(async (data: { type?: string; id?: string; date?: string }) => {
    const targetDate = data.date || currentDate;
    const day = targetDate === currentDate && dayData 
      ? dayData 
      : await getDayData(targetDate, settings);

    const updated: DayData = {
      ...day,
      tasks: [...day.tasks],
      reminders: [...day.reminders],
      supplements: [...day.supplements],
      creatine: { ...day.creatine },
    };
    let found = false;

    if (data.type === 'task' && data.id) {
      updated.tasks = updated.tasks.map((t) => {
        if (t.id === data.id) {
          found = true;
          return { ...t, completed: true };
        }
        return t;
      });
    } else if (data.type === 'reminder' && data.id) {
      updated.reminders = updated.reminders.map((r) => {
        if (r.id === data.id) {
          found = true;
          return { ...r, completed: true };
        }
        return r;
      });
    } else if (data.type === 'supplement' && data.id) {
      updated.supplements = updated.supplements.map((s) => {
        if (s.id === data.id) {
          found = true;
          return { ...s, taken: true };
        }
        return s;
      });
    } else if (data.type === 'creatine') {
      updated.creatine = {
        ...updated.creatine,
        taken: true,
        takenTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      found = true;
    }

    if (found) {
      await handleUpdateDay(updated);
      notificationService.vibrate(25, settings.hapticFeedback);
      notificationService.playChime('celebrate');
    }
  }, [currentDate, dayData, settings]);

  // 9. Service Worker Message Listener (for lock-screen notifications and action buttons)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleSwMessage = async (event: MessageEvent) => {
      const { type, data, date } = event.data || {};
      if (type === 'NAVIGATE_DATE' && date) {
        handleSelectDate(date);
      } else if (type === 'TASK_COMPLETED_FROM_NOTIFICATION' && data) {
        await handleMarkItemDone(data);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    };
  }, [handleMarkItemDone]);

  // 10. Background Reminder & Habit Scheduler
  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    const checkScheduledAlerts = () => {
      if (!dayData) return;
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayStr = getTodayDateString();

      // Helper to trigger alert (notification + sound + haptic + overlay)
      const triggerAlert = (reminderObj: ActiveOverlayReminder, channel: 'reminders' | 'tasks' | 'supplements' | 'creatine' | 'water') => {
        const cacheKey = `${reminderObj.id}_${todayStr}_${currentTimeStr}`;
        if (notifiedKeysRef.current.has(cacheKey)) return;
        notifiedKeysRef.current.add(cacheKey);

        // 1. Android Notification with Action "Done"
        notificationService.notify(
          reminderObj.title,
          {
            body: reminderObj.subtitle,
            channel,
            hapticEnabled: settings.hapticFeedback,
            tag: `tw-${reminderObj.id}`,
            data: {
              id: reminderObj.id,
              date: reminderObj.date,
              type: reminderObj.type,
              title: reminderObj.title,
            },
          },
          true
        );

        // 2. Display Over Other Apps (Overlay) if enabled
        if (settings.displayOverOtherApps) {
          setActiveOverlayReminder(reminderObj);
          // Also invoke native Picture-in-Picture window if supported
          notificationService.showNativePipOverlay(
            reminderObj,
            () => handleMarkItemDone(reminderObj),
            () => setActiveOverlayReminder(null)
          );
        }
      };

      // A. Important Reminders
      if (settings.reminderNotifications) {
        dayData.reminders.forEach((rem) => {
          if (
            rem.hasNotification &&
            !rem.completed &&
            rem.time === currentTimeStr &&
            (rem.date === todayStr || !rem.date)
          ) {
            triggerAlert(
              {
                id: rem.id,
                type: 'reminder',
                title: settings.language === 'ar' ? 'تذكير هام' : 'Important Reminder',
                subtitle: rem.text,
                time: rem.time,
                date: rem.date || todayStr,
              },
              'reminders'
            );
          }
        });

        // B. Scheduled Tasks with time
        dayData.tasks.forEach((tsk) => {
          if (!tsk.completed && tsk.time === currentTimeStr) {
            triggerAlert(
              {
                id: tsk.id,
                type: 'task',
                title: tsk.title,
                subtitle: settings.language === 'ar' ? `حان وقت المهمة: ${tsk.title}` : `It's time for: ${tsk.title}`,
                time: tsk.time,
                date: dayData.date,
              },
              'tasks'
            );
          }
        });
      }

      // C. Supplements
      if (settings.supplementReminders) {
        dayData.supplements.forEach((supp) => {
          if (!supp.taken && supp.time === currentTimeStr) {
            triggerAlert(
              {
                id: supp.id,
                type: 'supplement',
                title: settings.language === 'ar' ? 'تذكير المكملات الغذائية' : 'Supplement Reminder',
                subtitle: settings.language === 'ar' ? `تناول ${supp.name} (${supp.dose} ${supp.unit})` : `Time to take ${supp.name} (${supp.dose} ${supp.unit})`,
                time: supp.time,
                date: dayData.date,
              },
              'supplements'
            );
          }
        });
      }

      // D. Creatine
      if (settings.creatineReminders && !dayData.creatine.taken && currentTimeStr === '13:00') {
        triggerAlert(
          {
            id: `creatine_${dayData.date}`,
            type: 'creatine',
            title: settings.language === 'ar' ? 'تذكير الكرياتين' : 'Creatine Reminder',
            subtitle: settings.language === 'ar' ? `الجرعة اليومية: ${dayData.creatine.dose || '5g'}` : `Daily dose: ${dayData.creatine.dose || '5g'}`,
            time: '13:00',
            date: dayData.date,
          },
          'creatine'
        );
      }

      // E. Water Reminders (Hydration nudges at 10:00, 14:00, 17:00, 20:00)
      if (
        settings.waterReminders &&
        dayData.water.currentMl < dayData.water.targetMl &&
        ['10:00', '14:00', '17:00', '20:00'].includes(currentTimeStr)
      ) {
        triggerAlert(
          {
            id: `water_${dayData.date}_${currentTimeStr}`,
            type: 'water',
            title: settings.language === 'ar' ? 'تذكير شرب المياه' : 'Hydration Reminder',
            subtitle: settings.language === 'ar' 
              ? `المستهلك: ${(dayData.water.currentMl/1000).toFixed(1)}L من أصل ${(dayData.water.targetMl/1000).toFixed(1)}L`
              : `You drank ${(dayData.water.currentMl/1000).toFixed(1)}L of ${(dayData.water.targetMl/1000).toFixed(1)}L target.`,
            time: currentTimeStr,
            date: dayData.date,
          },
          'water'
        );
      }
    };

    const interval = setInterval(checkScheduledAlerts, 15000);
    checkScheduledAlerts();

    return () => clearInterval(interval);
  }, [dayData, settings, handleMarkItemDone]);

  const toggleLanguage = () => {
    const nextLang = settings.language === 'en' ? 'ar' : 'en';
    handleUpdateSettings({ ...settings, language: nextLang });
  };

  return (
    <div className="min-h-screen bg-[#f4f6f4] text-[#1f2937] flex flex-col font-sans pb-16 selection:bg-[#14402a] selection:text-white">
      {/* Top App Header */}
      <Header
        currentDate={currentDate}
        onSelectDate={handleSelectDate}
        onNavigateOffset={handleNavigateOffset}
        onOpenCalendar={() => setIsDatePickerModalOpen(true)}
        onOpenAI={() => setIsAIModalOpen(true)}
        onOpenPlanDay={() => setIsPlanDayModalOpen(true)}
        onOpenSettings={handleOpenGeneralSettings}
        currentView={currentView}
        onChangeView={setCurrentView}
        language={settings.language}
        onToggleLanguage={toggleLanguage}
      />

      {/* Main Content by Current View */}
      <main className="flex-1 w-full overflow-x-hidden relative">
        {currentView === 'daily' && dayData && (
          <div key={currentDate} className="w-full">
            <DailyPage
              dayData={dayData}
              onUpdateDay={handleUpdateDay}
              language={settings.language}
              allDaysHistory={allDays}
              hapticEnabled={settings.hapticFeedback ?? true}
            />
          </div>
        )}

        {currentView === 'dashboard' && dayData && (
          <DashboardView
            todayData={dayData}
            onOpenDaily={() => setCurrentView('daily')}
            onOpenAI={() => setIsAIModalOpen(true)}
            language={settings.language}
          />
        )}

        {currentView === 'calendar' && (
          <CalendarView
            currentDate={currentDate}
            allDays={allDays}
            onSelectDate={handleSelectDate}
            language={settings.language}
          />
        )}

        {currentView === 'history' && (
          <HistoryView
            allDays={allDays}
            onSelectDate={handleSelectDate}
            language={settings.language}
          />
        )}
      </main>

      {/* Small, non-intrusive floating overlay (Display over other apps) */}
      <FloatingReminderOverlay
        reminder={activeOverlayReminder}
        onDone={(rem) => {
          setActiveOverlayReminder(null);
          handleMarkItemDone(rem);
        }}
        onLater={() => {
          setActiveOverlayReminder(null);
        }}
        onOpenItem={(rem) => {
          setActiveOverlayReminder(null);
          if (rem.date) {
            handleSelectDate(rem.date);
          }
        }}
        language={settings.language}
      />

      {/* Floating Action Button for AI Assistant (visible on daily page) */}
      {currentView === 'daily' && (
        <button
          onClick={() => setIsAIModalOpen(true)}
          className="fixed bottom-5 right-5 rtl:left-5 rtl:right-auto z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-[#14402a] hover:bg-[#1b4d36] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 border border-emerald-400/30"
          title="Task Watcher AI"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-black tracking-wide">
            {settings.language === 'ar' ? 'مساعد الذكاء الاصطناعي' : 'Task Watcher AI'}
          </span>
        </button>
      )}

      {/* Modals */}
      {dayData && (
        <>
          <AIAssistantModal
            isOpen={isAIModalOpen}
            onClose={() => setIsAIModalOpen(false)}
            dayData={dayData}
            onApplyChangesToDay={handleApplyChangesToDay}
            language={settings.language}
            onOpenSettings={handleOpenAiSettings}
          />

          <PlanMyDayModal
            isOpen={isPlanDayModalOpen}
            onClose={() => setIsPlanDayModalOpen(false)}
            dayData={dayData}
            onApplySchedule={handleApplySchedule}
            language={settings.language}
            onOpenSettings={handleOpenAiSettings}
          />
        </>
      )}

      <DatePickerModal
        isOpen={isDatePickerModalOpen}
        onClose={() => setIsDatePickerModalOpen(false)}
        currentDate={currentDate}
        onSelectDate={handleSelectDate}
        language={settings.language}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        initialSection={settingsInitialSection}
      />
    </div>
  );
}
