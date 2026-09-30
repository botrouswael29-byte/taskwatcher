import React, { useState } from 'react';
import { Calendar as CalendarIcon, X, Check } from 'lucide-react';
import { translations } from '../i18n/translations';
import { getTodayDateString } from '../utils/date';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  onSelectDate: (date: string) => void;
  language: 'en' | 'ar';
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  onSelectDate,
  language,
}) => {
  const t = translations[language];
  const [selectedDate, setSelectedDate] = useState(currentDate);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedDate) {
      onSelectDate(selectedDate);
      onClose();
    }
  };

  const handleJumpToday = () => {
    const today = getTodayDateString();
    onSelectDate(today);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-5 border border-emerald-950/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#14402a] flex items-center justify-center font-bold">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">
              {t.selectDate}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14402a] bg-gray-50"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleJumpToday}
            className="text-xs text-emerald-800 font-bold hover:underline"
          >
            {t.todayBtn}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-1.5 rounded-xl bg-[#14402a] text-white text-xs font-bold hover:bg-[#1b4d36]"
            >
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
