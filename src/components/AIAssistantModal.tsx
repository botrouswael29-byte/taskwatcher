import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  Check, 
  AlertCircle, 
  Clock, 
  Droplets, 
  Dumbbell, 
  Bell, 
  ListChecks,
  CornerDownLeft,
  CheckCircle2,
  Wifi,
  WifiOff,
  KeyRound,
  Settings as SettingsIcon
} from 'lucide-react';
import { DayData, ProposedChanges, TaskItem, SmallStepItem, ReminderItem } from '../types';
import { translations } from '../i18n/translations';
import { chatWithAI, isOnline as checkOnline, MissingApiKeyError } from '../services/ai';
import { notificationService } from '../services/notification';
import { formatTimeDisplay } from '../utils/date';
import { getSavedApiKey } from '../services/apiKeyStorage';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayData: DayData;
  onApplyChangesToDay: (changes: ProposedChanges, targetDate?: string) => void;
  language: 'en' | 'ar';
  onOpenSettings?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  proposedChanges?: ProposedChanges | null;
  timestamp: string;
  isKeyError?: boolean;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  dayData,
  onApplyChangesToDay,
  language,
  onOpenSettings,
}) => {
  const t = translations[language];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProposal, setActiveProposal] = useState<ProposedChanges | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => checkOnline());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome_1',
          sender: 'assistant',
          text: language === 'ar'
            ? 'مرحبًا بك في مساعد تاسك ووتشر الذكي! 🌿 كيف أساعدك في تنظيم يومك، إضافة مهامك، تتبع المياه، الكرياتين أو التذكيرات اليوم؟'
            : 'Welcome to Task Watcher AI! 🌿 How can I help organize your schedule, add tasks, track your water, creatine or set reminders today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, activeProposal]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Pre-check for API key existence before sending request
    const savedKey = await getSavedApiKey();
    if (!savedKey) {
      const errorMsg: ChatMessage = {
        id: `msg_key_${Date.now() + 1}`,
        sender: 'assistant',
        text: language === 'ar'
          ? 'لم يتم إعداد مفتاح Gemini API بعد.\nاذهب إلى الإعدادات > المساعد الذكي وأضف مفتاح API.'
          : 'Gemini API key is not configured yet.\nGo to Settings > Smart Assistant and add an API key.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isKeyError: true,
      };
      setMessages((prev) => [...prev, userMsg, errorMsg]);
      setInput('');
      return;
    }

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithAI(text.trim(), {
        date: dayData.date,
        tasks: dayData.tasks,
        smallSteps: dayData.smallSteps,
        reminders: dayData.reminders,
        water: dayData.water,
        supplements: dayData.supplements,
        creatine: dayData.creatine,
        quote: dayData.quote,
        language,
      });

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'assistant',
        text: response.reply,
        proposedChanges: response.proposedChanges || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (response.proposedChanges) {
        setActiveProposal(response.proposedChanges);
      }
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      const isMissingKey = err instanceof MissingApiKeyError || 
        err?.code === 'MISSING_API_KEY' || 
        msg.includes('مفتاح gemini') || 
        msg.includes('api key') ||
        msg.includes('invalid') ||
        msg.includes('غير صالح');

      const errorText = err?.message || (
        language === 'ar'
          ? 'تعذر الوصول لخدمة الذكاء الاصطناعي عبر الإنترنت. يرجى التحقق من اتصالك بالإنترنت.'
          : 'Unable to connect to the online AI service. Please verify your internet connection.'
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'assistant',
          text: errorText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isKeyError: isMissingKey,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyChanges = (proposal: ProposedChanges) => {
    onApplyChangesToDay(proposal, proposal.targetDate);
    setActiveProposal(null);
    notificationService.playChime('celebrate');

    setMessages((prev) => [
      ...prev,
      {
        id: `msg_applied_${Date.now()}`,
        sender: 'assistant',
        text: `✓ ${t.changesApplied}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleCancelChanges = () => {
    setActiveProposal(null);
  };

  const handleOpenSettingsClick = () => {
    if (onOpenSettings) {
      onClose();
      onOpenSettings();
    }
  };

  const quickCommands = [
    { label: t.cmd1, prompt: language === 'ar' ? 'رتب لي خطة اليوم بأوقات مناسبة' : 'Plan my day with optimized times' },
    { label: t.cmd2, prompt: language === 'ar' ? 'أضف مهمة مذاكرة الساعة 6 بأولوية عالية' : 'Add study task at 6 PM with high priority' },
    { label: t.cmd3, prompt: language === 'ar' ? 'ما الذي لم أنجزه اليوم؟' : 'What tasks haven\'t I finished today?' },
    { label: t.cmd4, prompt: language === 'ar' ? 'سجل أنني شربت 500 مل مياه وأخذت الكرياتين' : 'I drank 500ml water and took my creatine' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-emerald-950/10">
        {/* Header */}
        <div className="bg-[#14402a] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-emerald-300 flex items-center justify-center font-bold border border-white/20 shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  {t.aiAssistantTitle}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 font-bold border border-emerald-400/30">
                  Gemini
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                {t.aiAssistantSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!isOnline && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-200 bg-amber-950/60 px-2 py-1 rounded-full border border-amber-600/50">
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>{t.networkOffline}</span>
              </span>
            )}
            {onOpenSettings && (
              <button
                onClick={handleOpenSettingsClick}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                title={t.settings}
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat History Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#f8faf9]">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-[#14402a] flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div 
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isUser
                      ? 'bg-[#14402a] text-white rounded-br-xs'
                      : msg.isKeyError
                      ? 'bg-amber-50/90 text-amber-950 border border-amber-300 rounded-bl-xs'
                      : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line font-medium" dir="auto">
                    {msg.text}
                  </p>

                  {/* Special Button when API Key is missing or invalid */}
                  {msg.isKeyError && onOpenSettings && (
                    <div className="mt-3 pt-2.5 border-t border-amber-200 flex items-center">
                      <button
                        type="button"
                        onClick={handleOpenSettingsClick}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#14402a] hover:bg-[#1b4d36] text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-emerald-300" />
                        <span>{t.openAssistantSettings}</span>
                      </button>
                    </div>
                  )}

                  <span className={`text-[10px] block mt-1.5 ${isUser ? 'text-emerald-200/70 text-end' : 'text-gray-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-gray-500 italic p-2 bg-emerald-50/60 rounded-2xl w-fit">
              <Bot className="w-4 h-4 text-[#14402a] animate-spin" />
              <span>{t.thinking}</span>
            </div>
          )}

          {/* Active Proposal Preview Card */}
          {activeProposal && (
            <div className="bg-white border-2 border-emerald-700/60 rounded-2xl p-4 shadow-md space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs pb-1 border-b border-gray-100">
                <AlertCircle className="w-4 h-4 text-emerald-700" />
                <span>{t.iUnderstood}</span>
              </div>

              {activeProposal.summary && (
                <p className="text-xs text-gray-700 font-semibold" dir="auto">
                  {activeProposal.summary}
                </p>
              )}

              {/* Tasks to add preview */}
              {activeProposal.tasksToAdd && activeProposal.tasksToAdd.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    {t.tasksTitle}:
                  </span>
                  {activeProposal.tasksToAdd.map((tsk, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                      <span className="font-semibold text-gray-800" dir="auto">
                        • {tsk.title}
                      </span>
                      {tsk.time && (
                        <span className="text-[11px] text-emerald-800 font-medium">
                          {formatTimeDisplay(tsk.time)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Water Target preview */}
              {activeProposal.waterTargetMl && (
                <div className="flex items-center gap-2 text-xs bg-cyan-50 p-2 rounded-lg text-cyan-900 border border-cyan-100">
                  <Droplets className="w-4 h-4 text-cyan-600" />
                  <span>
                    {t.waterTitle}: {(activeProposal.waterTargetMl / 1000).toFixed(1)} L
                  </span>
                </div>
              )}

              {/* Creatine preview */}
              {activeProposal.creatineTaken !== null && activeProposal.creatineTaken !== undefined && (
                <div className="flex items-center gap-2 text-xs bg-emerald-950 text-white p-2 rounded-lg">
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                  <span>
                    {t.creatineTitle}: {activeProposal.creatineTaken ? t.creatineTaken : t.notTaken}
                  </span>
                </div>
              )}

              {/* Reminders to add preview */}
              {activeProposal.remindersToAdd && activeProposal.remindersToAdd.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    {t.remindersTitle}:
                  </span>
                  {activeProposal.remindersToAdd.map((rem, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-amber-50 p-2 rounded-lg border border-amber-100 text-amber-900">
                      <span className="font-semibold" dir="auto">• {rem.text}</span>
                      {rem.time && <span>{formatTimeDisplay(rem.time)}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Small Steps preview */}
              {activeProposal.smallStepsToAdd && activeProposal.smallStepsToAdd.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    {t.smallStepsTitle}:
                  </span>
                  {activeProposal.smallStepsToAdd.map((st, i) => (
                    <div key={i} className="text-xs bg-gray-50 p-1.5 rounded text-gray-700" dir="auto">
                      ✓ {st.text}
                    </div>
                  ))}
                </div>
              )}

              {/* Confirm / Cancel Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={handleCancelChanges}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => handleApplyChanges(activeProposal)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#14402a] text-white text-xs font-bold hover:bg-[#1b4d36] transition-all shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{t.applyChanges}</span>
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Commands chips */}
        <div className="px-4 py-2 bg-gray-50/90 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[10px] font-bold text-gray-400 shrink-0">
            {language === 'ar' ? 'أوامر سريعة:' : 'Quick:'}
          </span>
          {quickCommands.map((cmd, i) => (
            <button
              key={i}
              onClick={() => handleSend(cmd.prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 text-[11px] font-semibold transition-all shrink-0 active:scale-95 disabled:opacity-50"
            >
              {cmd.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-200/80 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t.aiInputPlaceholder}
            className="flex-1 text-xs sm:text-sm p-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14402a]/20 focus:border-[#14402a] transition-all"
            dir="auto"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-2xl bg-[#14402a] text-white flex items-center justify-center hover:bg-[#1b4d36] transition-all disabled:opacity-40 disabled:hover:bg-[#14402a] shadow-xs active:scale-95 shrink-0"
            title={t.send}
          >
            <Send className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
