export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

export function getAdjacentDate(dateStr: string, offsetDays: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offsetDays);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateDisplay(dateStr: string, language: 'en' | 'ar'): {
  dayLabel: string;
  formattedDate: string;
  isCurrentDay: boolean;
} {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const todayStr = getTodayDateString();

  let dayLabel = '';
  if (dateStr === todayStr) {
    dayLabel = language === 'ar' ? 'اليوم' : 'Today';
  } else if (dateStr === getAdjacentDate(todayStr, -1)) {
    dayLabel = language === 'ar' ? 'أمس' : 'Yesterday';
  } else if (dateStr === getAdjacentDate(todayStr, 1)) {
    dayLabel = language === 'ar' ? 'غداً' : 'Tomorrow';
  } else {
    // Weekday name
    dayLabel = date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long',
    });
  }

  const formattedDate = date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    dayLabel,
    formattedDate,
    isCurrentDay: dateStr === todayStr,
  };
}

export function formatTimeDisplay(timeStr?: string): string {
  if (!timeStr) return '';
  // If already formatted like "2:00 PM"
  if (timeStr.includes('AM') || timeStr.includes('PM') || timeStr.includes('ص') || timeStr.includes('م')) {
    return timeStr;
  }
  // If "HH:mm"
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 || 12;
  const displayMinute = String(m || 0).padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}
