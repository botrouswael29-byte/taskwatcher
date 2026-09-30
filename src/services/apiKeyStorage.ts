/**
 * Gemini API Key Storage Service
 *
 * SECURITY NOTICE FOR WEB / PWA CLIENT ENVIRONMENTS:
 * In a client-side Web/PWA application, storing an API key in localStorage
 * or IndexedDB makes it accessible to any script executing in the same origin.
 * Client-side storage cannot be considered 100% impenetrable against local inspection.
 * Users should ideally use API keys with restricted quotas or permissions.
 *
 * This service implements persistent local storage so users only enter their
 * key once, offers full masking in UI displays (e.g. AIza••••••••••••••1234),
 * and allows instant one-click key clearance.
 */

const STORAGE_KEY = 'tw_gemini_api_key';
const STATUS_KEY = 'tw_gemini_key_status';

export type KeyConnectionStatus = 'connected' | 'error' | 'none';

let inMemoryKeyCache: string | null = null;
let inMemoryStatusCache: KeyConnectionStatus = 'none';

// Initialize synchronous memory cache from localStorage if available
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) {
      inMemoryKeyCache = saved.trim();
      const savedStatus = localStorage.getItem(STATUS_KEY) as KeyConnectionStatus;
      inMemoryStatusCache = savedStatus === 'connected' || savedStatus === 'error' ? savedStatus : 'none';
    }
  } catch (e) {
    console.warn('[apiKeyStorage] Failed to read initial key from localStorage:', e);
  }
}

/**
 * Mask API key for secure UI presentation.
 * Example: "AIzaSyD1234567890abcdef1234" -> "AIza••••••••••••••1234"
 */
export function maskApiKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••••••••${suffix}`;
}

/**
 * Check synchronously if a key is present in memory/local storage
 */
export function hasSavedApiKeySync(): boolean {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim().length > 0) {
        inMemoryKeyCache = stored.trim();
        return true;
      }
    } catch {
      // fallback to memory
    }
  }
  return Boolean(inMemoryKeyCache && inMemoryKeyCache.trim().length > 0);
}

/**
 * Retrieve saved API key synchronously (directly from localStorage to avoid stale state)
 */
export function getSavedApiKeySync(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        inMemoryKeyCache = stored.trim();
        return inMemoryKeyCache;
      }
    } catch {
      // fallback to memory
    }
  }
  return inMemoryKeyCache || '';
}

/**
 * Retrieve saved API key asynchronously (reads directly from storage)
 */
export async function getSavedApiKey(): Promise<string> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        inMemoryKeyCache = stored.trim();
        return inMemoryKeyCache;
      }
    } catch (e) {
      console.warn('[apiKeyStorage] Storage read error:', e);
    }
  }
  return inMemoryKeyCache || '';
}

/**
 * Save Gemini API key locally
 */
export async function saveApiKey(key: string, status: KeyConnectionStatus = 'connected'): Promise<void> {
  const cleanKey = key.trim();
  inMemoryKeyCache = cleanKey;
  inMemoryStatusCache = status;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, cleanKey);
      localStorage.setItem(STATUS_KEY, status);
      // Dispatch custom event for reactive UI updates across modals/views
      window.dispatchEvent(new CustomEvent('tw:apikey-changed', {
        detail: { hasKey: cleanKey.length > 0, status },
      }));
    } catch (e) {
      console.warn('[apiKeyStorage] Storage write error:', e);
    }
  }
}

/**
 * Update connection status of the stored key
 */
export function setKeyConnectionStatus(status: KeyConnectionStatus): void {
  inMemoryStatusCache = status;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STATUS_KEY, status);
      window.dispatchEvent(new CustomEvent('tw:apikey-status-changed', {
        detail: { status },
      }));
    } catch (e) {
      console.warn('[apiKeyStorage] Status write error:', e);
    }
  }
}

/**
 * Get current connection status of the stored key
 */
export function getKeyConnectionStatus(): KeyConnectionStatus {
  if (typeof window !== 'undefined') {
    try {
      const key = localStorage.getItem(STORAGE_KEY);
      if (!key || !key.trim()) return 'none';
      const storedStatus = localStorage.getItem(STATUS_KEY) as KeyConnectionStatus;
      if (storedStatus === 'connected' || storedStatus === 'error') {
        inMemoryStatusCache = storedStatus;
        return storedStatus;
      }
    } catch {
      // fallback
    }
  }
  if (!inMemoryKeyCache) return 'none';
  return inMemoryStatusCache;
}

/**
 * Completely clear the saved API key
 */
export async function clearApiKey(): Promise<void> {
  inMemoryKeyCache = '';
  inMemoryStatusCache = 'none';

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STATUS_KEY);
      window.dispatchEvent(new CustomEvent('tw:apikey-changed', {
        detail: { hasKey: false, status: 'none' },
      }));
    } catch (e) {
      console.warn('[apiKeyStorage] Storage clear error:', e);
    }
  }
}
