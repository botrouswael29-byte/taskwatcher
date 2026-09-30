/**
 * AI & Gemini Model Configuration
 * Centralized constant for the active Gemini model name and settings.
 */

export const GEMINI_MODEL = 'gemini-3.8-flash';

export interface KeyTestResult {
  success: boolean;
  message: string;
  errorType?: 'INVALID_KEY' | 'QUOTA_EXCEEDED' | 'NETWORK_ERROR' | 'GEMINI_ERROR' | 'MISSING_KEY';
}
