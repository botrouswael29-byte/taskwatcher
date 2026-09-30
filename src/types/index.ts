export type Priority = 'high' | 'medium' | 'low';

export interface TaskItem {
  id: string;
  title: string;
  time?: string; // e.g. "14:30" or "02:30 PM"
  priority: Priority;
  completed: boolean;
  order: number;
}

export interface SmallStepItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

export interface ReminderItem {
  id: string;
  text: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  hasNotification: boolean;
  completed?: boolean;
}

export interface WaterData {
  currentMl: number;
  targetMl: number;
  history: number[]; // history of added amounts for Undo
}

export interface SupplementItem {
  id: string;
  name: string;
  dose: string; // e.g. "1" or "500"
  unit: string; // e.g. "capsule", "tablet", "mg"
  dailyTarget: number;
  time?: string;
  taken: boolean;
}

export interface CreatineData {
  taken: boolean;
  dose: string; // e.g. "5g"
  takenTime?: string;
}

export interface QuoteData {
  text: string;
  author?: string;
  language?: 'en' | 'ar';
  isCustom?: boolean; // Indicates if user customized or explicitly saved a quote for this day
}

export interface DayData {
  date: string; // "YYYY-MM-DD"
  quote: QuoteData;
  tasks: TaskItem[];
  smallSteps: SmallStepItem[];
  reminders: ReminderItem[];
  water: WaterData;
  supplements: SupplementItem[];
  creatine: CreatineData;
}

export interface AppSettings {
  language: 'en' | 'ar';
  defaultWaterTargetMl: number;
  defaultCreatineDose: string;
  notificationsEnabled: boolean;
  hapticFeedback: boolean; // Vibration on completing tasks/items
  reminderNotifications: boolean; // Reminders & scheduled tasks
  waterReminders: boolean; // Water hydration nudges
  supplementReminders: boolean; // Supplement alerts
  creatineReminders: boolean; // Creatine alerts
  displayOverOtherApps: boolean; // Small floating overlay reminder
  customSupplementsTemplate: Array<{
    name: string;
    dose: string;
    unit: string;
    dailyTarget: number;
    time?: string;
  }>;
}

export interface ActiveOverlayReminder {
  id: string;
  type: 'task' | 'reminder' | 'supplement' | 'creatine' | 'water';
  title: string;
  subtitle: string;
  time?: string;
  date: string;
}

export interface ProposedChanges {
  summary: string;
  targetDate?: string;
  tasksToAdd?: Array<{
    title: string;
    time?: string | null;
    priority?: Priority;
  }>;
  tasksToUpdate?: Array<{
    id: string;
    title?: string;
    time?: string;
    priority?: Priority;
    completed?: boolean;
  }>;
  remindersToAdd?: Array<{
    text: string;
    date?: string | null;
    time?: string | null;
  }>;
  waterTargetMl?: number | null;
  waterAddMl?: number | null;
  creatineTaken?: boolean | null;
  smallStepsToAdd?: Array<{
    text: string;
  }>;
  explanation?: string;
}

export interface DayPlanScheduleItem {
  time: string;
  title: string;
  type: 'task' | 'water' | 'creatine' | 'reminder' | 'break';
  priority?: Priority;
  tips?: string;
}

export interface DayPlanResponse {
  overview: string;
  schedule: DayPlanScheduleItem[];
  reorderedTasks?: Array<{
    id?: string;
    title: string;
    suggestedTime: string;
    priority: Priority;
  }>;
}
