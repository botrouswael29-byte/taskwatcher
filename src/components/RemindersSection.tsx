import React, { useState } from 'react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar as CalendarIcon, 
  Check, 
  X, 
  BellRing,
  AlertCircle
} from 'lucide-react';
import { ReminderItem } from '../types';
import { translations } from '../i18n/translations';
import { formatTimeDisplay } from '../utils/date';
import { notificationService } from '../services/notification';

interface RemindersSectionProps {
  reminders: ReminderItem[];
  onUpdateReminders: (reminders: ReminderItem[]) => void;
  language: 'en' | 'ar';
  currentDate: string;
  hapticEnabled?: boolean;
}

export const RemindersSection: React.FC<RemindersSectionProps> = ({
  reminders,
  onUpdateReminders,
  language,
  currentDate,
  hapticEnabled = true,
}) => {
  const t = translations[language];
  const [isAdding, setIsAdding] = useState(false);
  const [text, setText] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState(currentDate);
  const [hasNotification, setHasNotification] = useState(true);

  const resetForm = () => {
    setText('');
    setTime('');
    setDate(currentDate);
    setHasNotification(true);
    setIsAdding(false);
  };

  const handleAddReminder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    if (hasNotification && notificationService.isSupported()) {
      if (Notification.permission === 'default') {
        await notificationService.requestPermission();
      }
    }

    const newReminder: ReminderItem = {
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: text.trim(),
      date: date || currentDate,
      time: time.trim() || undefined,
      hasNotification,
      completed: false,
    };

    onUpdateReminders([...reminders, newReminder]);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t.confirmDeleteReminder)) {
      onUpdateReminders(reminders.filter((r) => r.id !== id));
    }
  };

  const handleToggleComplete = (id: string) => {
    const updated = reminders.map((r) => {
      if (r.id === id) {
        const nextState = !r.completed;
        if (nextState) {
          notificationService.playChime('task');
          notificationService.vibrate(25, hapticEnabled);
        }
        return { ...r, completed: nextState };
      }
      return r;
    });
    onUpdateReminders(updated);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-emerald-950/5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
            <Bell className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 tracking-tight">
              {t.remindersTitle}
            </h2>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
            {reminders.length}
          </span>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#14402a] text-white text-xs font-semibold hover:bg-[#1b4d36] transition-all active:scale-95 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addReminder}</span>
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="mb-4 p-4 rounded-xl bg-amber-50/40 border border-amber-200/60 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">
              {t.addReminder}
            </span>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.reminderPlaceholder}
            className="w-full text-sm p-2.5 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14402a]"
            autoFocus
            dir="auto"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                {t.reminderTime}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#14402a]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                {t.reminderDate}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#14402a]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 font-medium">
              <input
                type="checkbox"
                checked={hasNotification}
                onChange={(e) => setHasNotification(e.target.checked)}
                className="rounded text-[#14402a] focus:ring-[#14402a] w-4 h-4"
              />
              <span className="flex items-center gap-1">
                <BellRing className="w-3.5 h-3.5 text-amber-600" />
                {t.notifyMe}
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={resetForm}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAddReminder}
                disabled={!text.trim()}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#14402a] text-white text-xs font-semibold hover:bg-[#1b4d36] disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t.save}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder List */}
      <div className="space-y-2">
        {reminders.length === 0 ? (
          <div className="text-center py-5 text-gray-400">
            <p className="text-xs">{t.noReminders}</p>
          </div>
        ) : (
          reminders.map((rem) => (
            <div
              key={rem.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                rem.completed
                  ? 'bg-gray-50/70 border-gray-200/50 opacity-60'
                  : 'bg-white border-amber-200/50 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                <button
                  onClick={() => handleToggleComplete(rem.id)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    rem.completed
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'border-amber-400 hover:border-amber-600'
                  }`}
                >
                  {rem.completed && <Check className="w-3 h-3 stroke-3" />}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-semibold ${
                      rem.completed ? 'line-through text-gray-400' : 'text-gray-800'
                    }`}
                    dir="auto"
                  >
                    {rem.text}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {rem.time && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-800 font-medium">
                        <Clock className="w-3 h-3" />
                        {formatTimeDisplay(rem.time)}
                      </span>
                    )}
                    {rem.date && rem.date !== currentDate && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                        <CalendarIcon className="w-3 h-3" />
                        {rem.date}
                      </span>
                    )}
                    {rem.hasNotification && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-md font-medium">
                        <Bell className="w-2.5 h-2.5 inline mr-0.5" />
                        {t.notifyMe}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(rem.id)}
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
