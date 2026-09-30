import { DayData, AppSettings } from '../types';
import { getDeterministicQuoteForDate } from './quotesCache';

const DB_NAME = 'TaskWatcherDB';
const DB_VERSION = 1;
const STORE_DAYS = 'daily_pages';
const STORE_SETTINGS = 'settings';

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  defaultWaterTargetMl: 3000,
  defaultCreatineDose: '5g',
  notificationsEnabled: true,
  hapticFeedback: true,
  reminderNotifications: true,
  waterReminders: false,
  supplementReminders: true,
  creatineReminders: true,
  displayOverOtherApps: false,
  customSupplementsTemplate: [
    { name: 'Vitamin D3', dose: '1', unit: 'capsule', dailyTarget: 1, time: '09:00' },
    { name: 'Magnesium', dose: '1', unit: 'capsule', dailyTarget: 1, time: '21:00' },
    { name: 'Omega-3', dose: '2', unit: 'softgels', dailyTarget: 2, time: '12:00' },
  ],
};

// IndexedDB Helper
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_DAYS)) {
        db.createObjectStore(STORE_DAYS, { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Normalizes day quote ensuring it deterministically corresponds to the date
 * unless explicitly customized by the user.
 */
function normalizeDayQuote(day: DayData, date: string, settings: AppSettings): DayData {
  if (
    !day.quote ||
    (!day.quote.isCustom &&
      (day.quote.text === 'قليل دائم خير من كثير منقطع.' ||
        day.quote.text === 'Small daily improvements over time lead to stunning results.' ||
        !day.quote.text))
  ) {
    day.quote = getDeterministicQuoteForDate(date, settings.language);
  }
  return day;
}

// Generate blank day template with deterministic quote for that specific date
export function createEmptyDay(date: string, settings: AppSettings = DEFAULT_SETTINGS): DayData {
  return {
    date,
    quote: getDeterministicQuoteForDate(date, settings.language),
    tasks: [],
    smallSteps: [],
    reminders: [],
    water: {
      currentMl: 0,
      targetMl: settings.defaultWaterTargetMl,
      history: [],
    },
    supplements: settings.customSupplementsTemplate.map((item, idx) => ({
      id: `supp_${date}_${idx}`,
      name: item.name,
      dose: item.dose,
      unit: item.unit,
      dailyTarget: item.dailyTarget,
      time: item.time,
      taken: false,
    })),
    creatine: {
      taken: false,
      dose: settings.defaultCreatineDose,
    },
  };
}

// Get Day Data
export async function getDayData(date: string, settings: AppSettings): Promise<DayData> {
  try {
    const db = await openDatabase();
    return await new Promise<DayData>((resolve) => {
      const tx = db.transaction(STORE_DAYS, 'readonly');
      const store = tx.objectStore(STORE_DAYS);
      const req = store.get(date);

      req.onsuccess = () => {
        if (req.result) {
          resolve(normalizeDayQuote(req.result as DayData, date, settings));
        } else {
          // Fallback to localStorage if exists
          const local = localStorage.getItem(`tw_day_${date}`);
          if (local) {
            try {
              const parsed = JSON.parse(local);
              resolve(normalizeDayQuote(parsed, date, settings));
              return;
            } catch {
              // ignore
            }
          }
          const fresh = createEmptyDay(date, settings);
          resolve(fresh);
        }
      };

      req.onerror = () => {
        const local = localStorage.getItem(`tw_day_${date}`);
        if (local) {
          try {
            resolve(normalizeDayQuote(JSON.parse(local), date, settings));
            return;
          } catch {
            // ignore
          }
        }
        resolve(createEmptyDay(date, settings));
      };
    });
  } catch {
    // If IndexedDB fails completely, use localStorage
    const local = localStorage.getItem(`tw_day_${date}`);
    if (local) {
      try {
        return normalizeDayQuote(JSON.parse(local), date, settings);
      } catch {
        // ignore
      }
    }
    return createEmptyDay(date, settings);
  }
}

// Save Day Data
export async function saveDayData(day: DayData): Promise<void> {
  // Always backup to localStorage for extra reliability
  try {
    localStorage.setItem(`tw_day_${day.date}`, JSON.stringify(day));
  } catch (e) {
    console.warn('localStorage save warning:', e);
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DAYS, 'readwrite');
      const store = tx.objectStore(STORE_DAYS);
      const req = store.put(day);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed, saved to localStorage', err);
  }
}

// Get All Stored Days (for calendar & history)
export async function getAllDays(): Promise<DayData[]> {
  try {
    const db = await openDatabase();
    return await new Promise<DayData[]>((resolve) => {
      const tx = db.transaction(STORE_DAYS, 'readonly');
      const store = tx.objectStore(STORE_DAYS);
      const req = store.getAll();
      req.onsuccess = () => {
        const list: DayData[] = req.result || [];
        resolve(list.sort((a, b) => b.date.localeCompare(a.date)));
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    // Read from localStorage
    const list: DayData[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tw_day_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '');
          if (item?.date) list.push(item);
        } catch {
          // ignore
        }
      }
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }
}

// Settings storage
export async function getSettings(): Promise<AppSettings> {
  try {
    const local = localStorage.getItem('tw_settings');
    if (local) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(local) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    localStorage.setItem('tw_settings', JSON.stringify(settings));
    const db = await openDatabase();
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    const store = tx.objectStore(STORE_SETTINGS);
    store.put({ key: 'app_settings', value: settings });
  } catch (err) {
    console.warn('Failed to save settings:', err);
  }
}
