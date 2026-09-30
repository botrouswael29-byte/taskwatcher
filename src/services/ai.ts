import { DayData, DayPlanResponse, ProposedChanges, QuoteData } from '../types';
import { getRandomCachedQuote, saveQuoteToCache } from './quotesCache';
import {
 
  getSavedApiKey, 
  hasSavedApiKeySync, 
  setKeyConnectionStatus 
} from './apiKeyStorage';
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ''
).replace(/\/$/, '');

const apiUrl = (endpoint: string) =>
  `${API_BASE_URL}${endpoint}`;
export interface ChatAIResponse {
  reply: string;
  proposedChanges?: ProposedChanges | null;
  error?: string;
  requiresKeySetup?: boolean;
}

export interface KeyTestResponse {
  success: boolean;
  message: string;
  errorType?: 'INVALID_KEY' | 'QUOTA_EXCEEDED' | 'NETWORK_ERROR' | 'GEMINI_ERROR' | 'MISSING_KEY';
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Custom error class for missing Gemini API key to trigger UI buttons
 */
export class MissingApiKeyError extends Error {
  code = 'MISSING_API_KEY';
  constructor(message: string) {
    super(message);
    this.name = 'MissingApiKeyError';
  }
}

/**
 * Builds request headers with the user's saved Gemini API key if present
 */
async function buildHeaders(customKey?: string): Promise<Record<string, string>> {
  const key = customKey || await getSavedApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (key && key.trim()) {
    headers['x-gemini-api-key'] = key.trim();
  }
  return headers;
}

/**
 * Test a Gemini API key with an independent live request to Gemini API.
 * Sends a minimal prompt ("Reply with the word OK") to verify connection.
 */
export async function testGeminiConnection(keyToTest?: string, language: 'en' | 'ar' = 'ar'): Promise<KeyTestResponse> {
  const isAr = language === 'ar';
  console.log('[AI] Request started - testGeminiConnection');

  if (!isOnline()) {
    console.error('[AI] Gemini request failed: Offline');
    return {
      success: false,
      errorType: 'NETWORK_ERROR',
      message: isAr
        ? 'تعذر الاتصال بخدمة Gemini. تحقق من اتصال الإنترنت.'
        : 'Unable to connect to Gemini service. Please check your internet connection.',
    };
  }

  const effectiveKey = keyToTest !== undefined ? keyToTest.trim() : (await getSavedApiKey());
  const hasKey = Boolean(effectiveKey && effectiveKey.length > 0);
  console.log(`[AI] API key found: ${hasKey}`);

  if (!hasKey) {
    console.error('[AI] Gemini request failed: No API key found');
    setKeyConnectionStatus('none');
    return {
      success: false,
      errorType: 'MISSING_KEY',
      message: isAr
        ? 'لم يتم إدخال مفتاح API.'
        : 'No API key entered.',
    };
  }
try {
  console.log('[AI] Sending request to test Gemini API connection');

  const res = await fetch(apiUrl('/api/ai/test-key'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gemini-api-key': effectiveKey,
    },
    body: JSON.stringify({ apiKey: effectiveKey }),
  });

  const data = await res.json().catch(() => ({}));

  if (res.ok && data.success) {
    console.log('[AI] Gemini response received - connection verified successfully');
    setKeyConnectionStatus('connected');
    return {
        success: true,
        message: isAr ? '✓ تم الاتصال بـ Gemini بنجاح' : '✓ Successfully connected to Gemini',
      };
    }

    console.error('[AI] Gemini request failed with status:', res.status, data.errorType);
    setKeyConnectionStatus('error');
    let friendlyMessage = data.message;
    if (!friendlyMessage) {
      if (data.errorType === 'INVALID_KEY' || res.status === 401 || res.status === 403) {
        friendlyMessage = isAr
          ? 'مفتاح Gemini غير صالح أو غير مصرح باستخدامه.'
          : 'Gemini API key is invalid or unauthorized.';
      } else if (data.errorType === 'QUOTA_EXCEEDED' || res.status === 429) {
        friendlyMessage = isAr
          ? 'تم تجاوز حد الاستخدام. حاول لاحقاً.'
          : 'Usage quota exceeded. Please try again later.';
      } else {
        friendlyMessage = isAr
          ? 'تعذر الاتصال بخدمة Gemini.'
          : 'Unable to connect to Gemini service.';
      }
    }

    return {
      success: false,
      errorType: data.errorType || 'GEMINI_ERROR',
      message: friendlyMessage,
    };
  } catch (err: any) {
    console.error('[AI] Gemini request failed with exception:', err?.message || err);
    setKeyConnectionStatus('error');
    return {
      success: false,
      errorType: 'NETWORK_ERROR',
      message: isAr
        ? 'تعذر الاتصال بخدمة Gemini. تحقق من اتصال الإنترنت.'
        : 'Unable to connect to Gemini service. Please check your internet connection.',
    };
  }
}

// Backward-compatible alias
export const testGeminiApiKey = testGeminiConnection;

/**
 * Natural language chat with Task Watcher AI
 */
export async function chatWithAI(
  message: string,
  context: {
    date: string;
    tasks: DayData['tasks'];
    smallSteps: DayData['smallSteps'];
    reminders: DayData['reminders'];
    water: DayData['water'];
    supplements: DayData['supplements'];
    creatine: DayData['creatine'];
    quote: DayData['quote'];
    language: 'en' | 'ar';
  }
): Promise<ChatAIResponse> {
  const isAr = context.language === 'ar';
  console.log('[AI] Request started - chatWithAI');

  if (!isOnline()) {
    console.error('[AI] Gemini request failed: Offline');
    throw new Error(
      isAr
        ? 'تعذر الاتصال بخدمة Gemini. تحقق من اتصال الإنترنت.'
        : 'Unable to connect to Gemini service. Please check your internet connection.'
    );
  }

  const savedKey = await getSavedApiKey();
  const hasKey = Boolean(savedKey && savedKey.trim().length > 0);
  console.log(`[AI] API key found: ${hasKey}`);

  if (!hasKey) {
    console.error('[AI] Gemini request failed: Missing API Key');
    throw new MissingApiKeyError(
      isAr
        ? 'لم يتم إعداد مفتاح Gemini API بعد.\nاذهب إلى الإعدادات > المساعد الذكي وأضف مفتاح API.'
        : 'Gemini API key is not configured yet.\nGo to Settings > Smart Assistant and add an API key.'
    );
  }

  console.log('[AI] Sending request to /api/ai/chat');
  const headers = await buildHeaders(savedKey);
  
  let res: Response;
  try {
    res = await fetch(apiUrl('/api/ai/chat'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, context }),
    });
  } catch (networkErr: any) {
    console.error('[AI] Gemini request failed: Network error', networkErr);
    throw new Error(
      isAr
        ? 'تعذر الاتصال بخدمة Gemini. تحقق من اتصال الإنترنت.'
        : 'Unable to connect to Gemini service. Please check your internet connection.'
    );
  }

  console.log(`[AI] Gemini response received with HTTP status: ${res.status}`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('[AI] Gemini request failed with error payload:', errorData);

    if (res.status === 401 || errorData.error === 'MISSING_API_KEY') {
      setKeyConnectionStatus('none');
      throw new MissingApiKeyError(
        isAr
          ? 'لم يتم إعداد مفتاح Gemini API بعد.\nاذهب إلى الإعدادات > المساعد الذكي وأضف مفتاح API.'
          : 'Gemini API key is not configured yet.\nGo to Settings > Smart Assistant and add an API key.'
      );
    }
    if (errorData.error === 'INVALID_API_KEY' || res.status === 403) {
      setKeyConnectionStatus('error');
      throw new Error(
        isAr
          ? 'مفتاح Gemini غير صالح أو غير مصرح باستخدامه. يرجى التحقق من المفتاح في الإعدادات.'
          : 'Gemini API key is invalid or unauthorized. Please check your key in Settings.'
      );
    }
    if (res.status === 429 || errorData.error === 'QUOTA_EXCEEDED') {
      throw new Error(
        isAr
          ? 'تم تجاوز حد الاستخدام. حاول لاحقاً.'
          : 'Usage quota exceeded. Please try again later.'
      );
    }
    if (res.status === 503 || errorData.error === 'NETWORK_ERROR') {
      throw new Error(
        isAr
          ? 'تعذر الاتصال بخدمة Gemini. تحقق من اتصال الإنترنت.'
          : 'Unable to connect to Gemini service. Please check your internet connection.'
      );
    }

    throw new Error(
      errorData.reply ||
      (isAr
        ? 'حدث خطأ أثناء معالجة طلب المساعد الذكي. يرجى المحاولة لاحقاً.'
        : 'An error occurred while communicating with Gemini API. Please try again later.')
    );
  }

  const data = await res.json().catch(() => ({}));
  console.log('[AI] Response parsed successfully');

  if (!data.reply || typeof data.reply !== 'string' || !data.reply.trim()) {
    data.reply = isAr ? 'لم يصل رد من Gemini.' : 'No response received from Gemini.';
  }

  setKeyConnectionStatus('connected');
  return data;
}

/**
 * Plan daily schedule with AI
 */
export async function planDayWithAI(day: DayData, language: 'en' | 'ar'): Promise<DayPlanResponse> {
  const isAr = language === 'ar';
  console.log('[AI] Request started - planDayWithAI');

  if (!isOnline()) {
    console.error('[AI] Gemini request failed: Offline');
    throw new Error(
      isAr
        ? 'تعذر الاتصال بخدمة Gemini. تحقق من اتصال الإنترنت.'
        : 'Unable to connect to Gemini service. Please check your internet connection.'
    );
  }

  const savedKey = await getSavedApiKey();
  const hasKey = Boolean(savedKey && savedKey.trim().length > 0);
  console.log(`[AI] API key found: ${hasKey}`);

  if (!hasKey) {
    console.error('[AI] Gemini request failed: Missing API Key');
    throw new MissingApiKeyError(
      isAr
        ? 'يرجى إضافة Gemini API Key من إعدادات المساعد الذكي أولاً.'
        : 'Please add a Gemini API Key from Smart Assistant settings first.'
    );
  }

  console.log('[AI] Sending request to /api/ai/plan');
  const headers = await buildHeaders(savedKey);
  const res = await fetch(apiUrl('/api/ai/plan'), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      date: day.date,
      tasks: day.tasks,
      smallSteps: day.smallSteps,
      reminders: day.reminders,
      water: day.water,
      creatine: day.creatine,
      language,
    }),
  });

  console.log(`[AI] Gemini response received with HTTP status: ${res.status}`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('[AI] Gemini request failed:', errorData);

    if (res.status === 401 || errorData.error === 'MISSING_API_KEY') {
      setKeyConnectionStatus('none');
      throw new MissingApiKeyError(
        isAr
          ? 'يرجى إضافة Gemini API Key من إعدادات المساعد الذكي أولاً.'
          : 'Please add a Gemini API Key from Smart Assistant settings first.'
      );
    }
    if (errorData.error === 'INVALID_API_KEY') {
      setKeyConnectionStatus('error');
      throw new Error(
        isAr
          ? 'مفتاح Gemini غير صالح أو غير مصرح به.'
          : 'Invalid or unauthorized Gemini API key.'
      );
    }

    throw new Error(
      errorData.message ||
      (isAr
        ? 'تعذر إنشاء الخطة اليومية بواسطة الذكاء الاصطناعي حالياً.'
        : 'Failed to generate daily plan via AI.')
    );
  }

  const data = await res.json();
  console.log('[AI] Response parsed successfully');
  setKeyConnectionStatus('connected');
  return data;
}

/**
 * Break down a task into small steps using Gemini AI
 */
export async function breakdownTaskWithAI(taskTitle: string, language: 'en' | 'ar'): Promise<string[]> {
  const isAr = language === 'ar';
  console.log('[AI] Request started - breakdownTaskWithAI');

  if (!isOnline()) {
    console.error('[AI] Gemini request failed: Offline');
    throw new Error(
      isAr
        ? 'تعذر الاتصال بخدمة Gemini. تحقق من اتصال الإنترنت.'
        : 'Unable to connect to Gemini service. Please check your internet connection.'
    );
  }

  const savedKey = await getSavedApiKey();
  const hasKey = Boolean(savedKey && savedKey.trim().length > 0);
  console.log(`[AI] API key found: ${hasKey}`);

  if (!hasKey) {
    throw new MissingApiKeyError(
      isAr
        ? 'يرجى إضافة Gemini API Key من إعدادات المساعد الذكي أولاً.'
        : 'Please add a Gemini API Key from Smart Assistant settings first.'
    );
  }

  console.log('[AI] Sending request to /api/ai/breakdown');
  const headers = await buildHeaders(savedKey);
  const res = await fetch(apiUrl('/api/ai/breakdown'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ taskTitle, language }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('[AI] Gemini request failed:', errorData);

    if (res.status === 401 || errorData.error === 'MISSING_API_KEY') {
      setKeyConnectionStatus('none');
      throw new MissingApiKeyError(
        isAr
          ? 'يرجى إضافة Gemini API Key من إعدادات المساعد الذكي أولاً.'
          : 'Please add a Gemini API Key from Smart Assistant settings first.'
      );
    }
    throw new Error(
      errorData.message ||
      (isAr ? 'فشل تقسيم المهمة' : 'Failed to break down task')
    );
  }

  const data = await res.json();
  console.log('[AI] Response parsed successfully');
  setKeyConnectionStatus('connected');
  return data.steps || [];
}

/**
 * Generate motivational quote online with Gemini AI
 */
export async function generateQuoteWithAI(
  language: 'en' | 'ar' | 'random' = 'ar',
  theme?: string
): Promise<{ quote: QuoteData; isFromCache: boolean }> {
  console.log('[AI] Request started - generateQuoteWithAI');
  const targetLang = language === 'random' ? (Math.random() > 0.5 ? 'ar' : 'en') : language;

  if (!isOnline()) {
    console.log('[AI] Offline - using cached quote');
    return {
      quote: getRandomCachedQuote(targetLang),
      isFromCache: true,
    };
  }

  const savedKey = await getSavedApiKey();
  const hasKey = Boolean(savedKey && savedKey.trim().length > 0);
  console.log(`[AI] API key found: ${hasKey}`);

  try {
    const headers = await buildHeaders(savedKey);
    console.log('[AI] Sending request to /api/ai/quote');
    const res = await fetch(apiUrl('/api/ai/quote'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ language: targetLang, theme }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    console.log('[AI] Gemini response received for quote');

    const generatedQuote: QuoteData = {
      text: data.text || 'Action is the foundational key to all success.',
      author: data.author || 'Anonymous',
      language: data.language || targetLang,
      isCustom: true,
    };

    saveQuoteToCache(generatedQuote);
    if (hasKey) {
      setKeyConnectionStatus('connected');
    }

    return {
      quote: generatedQuote,
      isFromCache: Boolean(data.isFallback),
    };
  } catch (err) {
    console.warn('[AI] Quote fetch failed, using offline fallback:', err);
    return {
      quote: getRandomCachedQuote(targetLang),
      isFromCache: true,
    };
  }
}
