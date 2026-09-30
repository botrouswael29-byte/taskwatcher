import React, { useState, useEffect } from 'react';
import { 
  Quote, 
  Sparkles, 
  Edit3, 
  Check, 
  X, 
  RefreshCw, 
  Bookmark, 
  WifiOff, 
  Globe2 
} from 'lucide-react';
import { QuoteData } from '../types';
import { generateQuoteWithAI, isOnline as checkOnline } from '../services/ai';
import { translations } from '../i18n/translations';
import { notificationService } from '../services/notification';
import { getDeterministicQuoteForDate } from '../services/quotesCache';

interface QuoteCardProps {
  date: string;
  quote: QuoteData;
  onUpdateQuote: (quote: QuoteData) => void;
  language: 'en' | 'ar';
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  date,
  quote,
  onUpdateQuote,
  language,
}) => {
  const t = translations[language];

  // Resolve base quote strictly based on selectedDate
  const effectiveQuote = quote?.text ? quote : getDeterministicQuoteForDate(date, language);

  // Language choice for quotes: 'en' | 'ar' | 'random'
  const [quoteLangChoice, setQuoteLangChoice] = useState<'en' | 'ar' | 'random'>(
    effectiveQuote?.language || language || 'en'
  );

  // Manual edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(effectiveQuote?.text || '');
  const [editAuthor, setEditAuthor] = useState(effectiveQuote?.author || '');

  // Preview / generated quote states
  const [previewQuote, setPreviewQuote] = useState<QuoteData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Network state
  const [isOnline, setIsOnline] = useState<boolean>(() => checkOnline());
  const [offlineNotice, setOfflineNotice] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineNotice(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Synchronize strictly when selectedDate or quote changes
  useEffect(() => {
    setPreviewQuote(null);
    setIsEditing(false);
    const resolved = quote?.text ? quote : getDeterministicQuoteForDate(date, language);
    setEditText(resolved.text || '');
    setEditAuthor(resolved.author || '');
    setSavedSuccess(false);
  }, [date, quote?.text, quote?.author, language]);

  // Fetch or generate new quote (online AI or cached offline)
  const handleFetchQuote = async () => {
    try {
      setIsGenerating(true);
      setSavedSuccess(false);

      const currentlyOnline = checkOnline();
      setIsOnline(currentlyOnline);

      if (!currentlyOnline) {
        setOfflineNotice(true);
      } else {
        setOfflineNotice(false);
      }

      const { quote: newQuote, isFromCache } = await generateQuoteWithAI(
        quoteLangChoice,
        'focus, discipline, and daily progress'
      );

      setPreviewQuote(newQuote);

      if (isFromCache && !currentlyOnline) {
        setOfflineNotice(true);
      }
    } catch (err) {
      console.warn('Quote fetch error:', err);
      setOfflineNotice(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save quote permanently to the daily page
  const handleSavePreviewQuote = () => {
    const quoteToSave: QuoteData = previewQuote ? {
      ...previewQuote,
      isCustom: true,
    } : {
      text: editText.trim(),
      author: editAuthor.trim() || undefined,
      language: quoteLangChoice === 'random' ? language : quoteLangChoice,
      isCustom: true,
    };

    onUpdateQuote(quoteToSave);
    setSavedSuccess(true);
    notificationService.vibrate(25, true);

    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  const handleManualSave = () => {
    if (!editText.trim()) return;
    const manualQuote: QuoteData = {
      text: editText.trim(),
      author: editAuthor.trim() || undefined,
      language: quoteLangChoice === 'random' ? language : quoteLangChoice,
      isCustom: true,
    };
    onUpdateQuote(manualQuote);
    setPreviewQuote(null);
    setIsEditing(false);
    setSavedSuccess(true);
    notificationService.vibrate(25, true);

    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  const currentDisplayQuote = previewQuote || effectiveQuote;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-xs border border-emerald-950/5 relative overflow-hidden transition-all hover:shadow-sm">
      {/* Subtle background quote watermark */}
      <Quote className="absolute -bottom-3 -right-3 w-28 h-28 text-emerald-950/3 pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-emerald-50 text-[#14402a] flex items-center justify-center font-bold">
            <Quote className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 tracking-tight">
              {t.quoteTitle}
            </h2>
          </div>

          {/* Network indicator pill */}
          {!isOnline && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <WifiOff className="w-3 h-3 text-amber-600" />
              <span>{t.noInternet}</span>
            </span>
          )}
        </div>

        {/* Language selector chips: Arabic, English, Random */}
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200/70 self-start sm:self-auto">
          <Globe2 className="w-3 h-3 text-gray-400 mx-1" />
          <button
            type="button"
            onClick={() => setQuoteLangChoice('en')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
              quoteLangChoice === 'en'
                ? 'bg-[#14402a] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.englishLang}
          </button>
          <button
            type="button"
            onClick={() => setQuoteLangChoice('ar')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
              quoteLangChoice === 'ar'
                ? 'bg-[#14402a] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.arabicLang}
          </button>
          <button
            type="button"
            onClick={() => setQuoteLangChoice('random')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
              quoteLangChoice === 'random'
                ? 'bg-[#14402a] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.randomLang}
          </button>
        </div>
      </div>

      {/* Offline Notice banner if user tried fetching while disconnected */}
      {offlineNotice && (
        <div className="mb-3 py-1.5 px-3 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 font-medium">
            <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>{t.usingOfflineCache}</span>
          </div>
          <button 
            onClick={() => setOfflineNotice(false)} 
            className="text-amber-700 hover:text-amber-900 p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Quote Content Display or Manual Edit Mode */}
      <div className="relative z-10">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder={t.quotePlaceholder}
              rows={3}
              className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14402a]/30 focus:border-[#14402a] resize-none"
              dir="auto"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editAuthor}
                onChange={(e) => setEditAuthor(e.target.value)}
                placeholder={t.authorLabel}
                className="flex-1 text-xs p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#14402a]"
                dir="auto"
              />
              <button
                onClick={handleManualSave}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#14402a] text-white text-xs font-semibold hover:bg-[#1b4d36] transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t.saveQuote}</span>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => {
              setEditText(currentDisplayQuote?.text || '');
              setEditAuthor(currentDisplayQuote?.author || '');
              setIsEditing(true);
            }}
            className="cursor-pointer group py-2"
          >
            <p 
              className="text-sm sm:text-base font-medium text-gray-700 leading-relaxed italic tracking-wide group-hover:text-gray-900 transition-colors" 
              dir="auto"
            >
              "{currentDisplayQuote?.text || t.quotePlaceholder}"
            </p>
            {currentDisplayQuote?.author && (
              <p className="text-xs text-emerald-800 font-semibold mt-2 text-end" dir="auto">
                — {currentDisplayQuote.author}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Buttons: Generate Quote, New Quote, Save Quote */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-2 border-t border-gray-100 relative z-10">
        <div className="flex items-center gap-1.5">
          {/* Generate Quote / New Quote button */}
          <button
            type="button"
            onClick={handleFetchQuote}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 border border-emerald-200/60"
            title="Generate a new online motivational quote"
          >
            {previewQuote ? (
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isGenerating ? 'animate-spin' : ''}`} />
            ) : (
              <Sparkles className={`w-3.5 h-3.5 text-emerald-700 ${isGenerating ? 'animate-spin' : ''}`} />
            )}
            <span>
              {isGenerating ? t.generatingQuote : (previewQuote ? t.newQuote : t.generateQuote)}
            </span>
          </button>

          {/* New Quote button if a preview quote is already shown */}
          {previewQuote && !isGenerating && (
            <button
              type="button"
              onClick={handleFetchQuote}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-all border border-gray-200"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t.newQuote}</span>
            </button>
          )}

          {/* Manual Edit icon */}
          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setEditText(currentDisplayQuote?.text || '');
                setEditAuthor(currentDisplayQuote?.author || '');
                setIsEditing(true);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title={t.editQuote}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Save Quote Button */}
        <div>
          {previewQuote && previewQuote.text !== quote.text ? (
            <button
              type="button"
              onClick={handleSavePreviewQuote}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#14402a] hover:bg-[#1b4d36] text-white text-xs font-bold transition-all shadow-xs active:scale-95 animate-in zoom-in-95 duration-150"
            >
              <Bookmark className="w-3.5 h-3.5 text-emerald-300" />
              <span>{t.saveQuote}</span>
            </button>
          ) : savedSuccess ? (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 animate-in fade-in duration-150">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.quoteSaved}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
