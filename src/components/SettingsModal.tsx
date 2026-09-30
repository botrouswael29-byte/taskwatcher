import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  X, 
  Globe, 
  Bell, 
  Droplets, 
  Dumbbell, 
  Check, 
  ShieldCheck,
  BellRing,
  Vibrate,
  Layers,
  Sparkles,
  Pill,
  Clock,
  Wifi,
  WifiOff,
  Bot,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  KeyRound,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { AppSettings } from '../types';
import { translations } from '../i18n/translations';
import { notificationService } from '../services/notification';
import { isOnline as checkOnline, testGeminiApiKey } from '../services/ai';
import { 
  getSavedApiKey, 
  saveApiKey, 
  clearApiKey, 
  maskApiKey, 
  getKeyConnectionStatus,
  KeyConnectionStatus 
} from '../services/apiKeyStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  initialSection?: 'general' | 'ai';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  initialSection = 'general',
}) => {
  const t = translations[settings.language];
  const [language, setLanguage] = useState(settings.language);
  const [waterTargetL, setWaterTargetL] = useState(String(settings.defaultWaterTargetMl / 1000));
  const [creatineDose, setCreatineDose] = useState(settings.defaultCreatineDose || '5g');

  // Notification & Behavior states
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled ?? true);
  const [hapticFeedback, setHapticFeedback] = useState(settings.hapticFeedback ?? true);
  const [reminderNotifications, setReminderNotifications] = useState(settings.reminderNotifications ?? true);
  const [waterReminders, setWaterReminders] = useState(settings.waterReminders ?? false);
  const [supplementReminders, setSupplementReminders] = useState(settings.supplementReminders ?? true);
  const [creatineReminders, setCreatineReminders] = useState(settings.creatineReminders ?? true);
  const [displayOverOtherApps, setDisplayOverOtherApps] = useState(settings.displayOverOtherApps ?? false);

  const [notifState, setNotifState] = useState(notificationService.getPermission());
  const [isOnline, setIsOnline] = useState<boolean>(() => checkOnline());

  // Gemini API Key States
  const [savedKey, setSavedKey] = useState<string>('');
  const [keyInput, setKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isEditingKey, setIsEditingKey] = useState<boolean>(false);
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [keyStatus, setKeyStatus] = useState<KeyConnectionStatus>('none');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const aiSectionRef = useRef<HTMLDivElement>(null);

  // Network listeners
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

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      async function loadKey() {
        const stored = await getSavedApiKey();
        if (stored && stored.trim()) {
          setSavedKey(stored.trim());
          setKeyInput('');
          setIsEditingKey(false);
          setKeyStatus(getKeyConnectionStatus());
        } else {
          setSavedKey('');
          setKeyInput('');
          setIsEditingKey(true);
          setKeyStatus('none');
        }
        setTestResult(null);
        setSaveNotice(null);
      }
      loadKey();

      if (initialSection === 'ai') {
        setTimeout(() => {
          aiSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [isOpen, initialSection]);

  if (!isOpen) return null;

  const handleSave = () => {
    const numWater = parseFloat(waterTargetL);
    const updated: AppSettings = {
      ...settings,
      language,
      defaultWaterTargetMl: !isNaN(numWater) && numWater > 0 ? Math.round(numWater * 1000) : 3000,
      defaultCreatineDose: creatineDose.trim() || '5g',
      notificationsEnabled,
      hapticFeedback,
      reminderNotifications,
      waterReminders,
      supplementReminders,
      creatineReminders,
      displayOverOtherApps,
    };
    onUpdateSettings(updated);
    onClose();
  };

  // Save Gemini Key
  const handleSaveGeminiKey = async () => {
    const candidate = keyInput.trim();
    if (!candidate && !savedKey) {
      return;
    }
    const finalKey = candidate || savedKey;
    await saveApiKey(finalKey, 'none');
    setSavedKey(finalKey);
    setKeyInput('');
    setIsEditingKey(false);
    setSaveNotice(t.keySavedSuccess);
    notificationService.vibrate(20, hapticFeedback);

    // Auto-test the key immediately to verify connection
    setIsTestingKey(true);
    setTestResult(null);
    const result = await testGeminiApiKey(finalKey, language);
    setIsTestingKey(false);
    setTestResult(result);
    setKeyStatus(result.success ? 'connected' : 'error');

    setTimeout(() => {
      setSaveNotice(null);
    }, 3000);
  };

  // Clear Gemini Key
  const handleClearGeminiKey = async () => {
    await clearApiKey();
    setSavedKey('');
    setKeyInput('');
    setIsEditingKey(true);
    setShowKey(false);
    setKeyStatus('none');
    setTestResult(null);
    setSaveNotice(t.keyClearedSuccess);
    notificationService.vibrate(20, hapticFeedback);

    setTimeout(() => {
      setSaveNotice(null);
    }, 2500);
  };

  // Test Gemini Key Connection
  const handleTestConnection = async () => {
    const keyToTest = keyInput.trim() || savedKey;
    if (!keyToTest) {
      setKeyStatus('none');
      setTestResult({
        success: false,
        message: t.statusNoKey,
      });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);
    notificationService.vibrate(15, hapticFeedback);

    const result = await testGeminiApiKey(keyToTest, language);
    setIsTestingKey(false);
    setTestResult(result);
    setKeyStatus(result.success ? 'connected' : 'error');
  };

  const handleRequestNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setNotifState(granted ? 'granted' : 'denied');
    if (granted) {
      setNotificationsEnabled(true);
      notificationService.notify(
        settings.language === 'ar' ? 'تاسك ووتشر — الإشعارات مفعلة' : 'Task Watcher — Notifications Enabled',
        { 
          body: settings.language === 'ar' ? 'ستصلك تذكيراتك اليومية على شاشة القفل وفي شريط التنبيهات.' : 'Your daily reminders will appear on the lock screen and notification shade with a Done button.',
          hapticEnabled: hapticFeedback,
        }
      );
    }
  };

  const handleTestNotification = () => {
    notificationService.notify(
      settings.language === 'ar' ? 'تاسك ووتشر — تنبيه تجريبي' : 'Task Watcher — Test Alert',
      { 
        body: settings.language === 'ar' ? 'تنبيه مجدول: حان وقت شرب الماء وإنجاز خطوتك التالية!' : 'Scheduled reminder: Time for your workout and next task!',
        hapticEnabled: hapticFeedback,
      }
    );
  };

  const handleTestHaptic = () => {
    notificationService.vibrate(30, true);
  };

  const handleToggleOverlayPermission = async () => {
    const nextState = !displayOverOtherApps;
    setDisplayOverOtherApps(nextState);
    if (nextState) {
      notificationService.vibrate(25, hapticFeedback);
    }
  };

  const hasKeyConfigured = Boolean(savedKey || keyInput.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-3xl shadow-xl flex flex-col overflow-hidden border border-emerald-950/10">
        {/* Header */}
        <div className="bg-[#14402a] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/10 text-emerald-300 flex items-center justify-center font-bold border border-white/20">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {t.settingsTitle}
              </h3>
              <p className="text-xs text-emerald-200/80">
                {t.appName}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#f8faf9]">
          {/* Section 1: Language */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-800" />
              <span>{t.language}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  language === 'en'
                    ? 'bg-[#14402a] text-white border-[#14402a] shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                English (LTR)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  language === 'ar'
                    ? 'bg-[#14402a] text-white border-[#14402a] shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                العربية (RTL)
              </button>
            </div>
          </div>

          {/* Section: المساعد الذكي (Smart Assistant & Gemini API Key) */}
          <div 
            ref={aiSectionRef}
            className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-800/20 shadow-xs space-y-4 relative overflow-hidden"
          >
            {/* Header of Section */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#14402a] flex items-center justify-center font-bold border border-emerald-100">
                  <Bot className="w-4 h-4 text-emerald-800" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
                    <span>{t.smartAssistant}</span>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {t.geminiTitle}
                  </p>
                </div>
              </div>

              {/* Status pill badge */}
              <div className="text-end">
                {keyStatus === 'connected' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{language === 'ar' ? 'متصل' : 'Connected'}</span>
                  </span>
                ) : keyStatus === 'error' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>{language === 'ar' ? 'فشل الاتصال' : 'Failed'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-300">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    <span>{language === 'ar' ? 'غير متصل' : 'Not Set'}</span>
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {t.geminiDesc}
            </p>

            {/* Input Field Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-800" />
                  <span>{t.geminiApiKeyLabel}</span>
                </label>
                {savedKey && !isEditingKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingKey(true);
                      setKeyInput(savedKey);
                    }}
                    className="text-[11px] text-emerald-800 hover:underline font-bold"
                  >
                    {language === 'ar' ? 'تعديل المفتاح' : 'Change Key'}
                  </button>
                )}
              </div>

              {/* Password-style input with Show/Hide eye button */}
              <div className="relative flex items-center">
                {savedKey && !isEditingKey ? (
                  <div className="w-full text-xs font-mono p-3 pr-10 rtl:pr-3 rtl:pl-10 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 flex items-center justify-between select-all">
                    <span>{showKey ? savedKey : maskApiKey(savedKey)}</span>
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                      title={showKey ? t.hideKey : t.showKey}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder={t.geminiApiKeyPlaceholder}
                      className="w-full text-xs font-mono p-3 pr-10 rtl:pr-3 rtl:pl-10 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14402a]/20 focus:border-[#14402a] transition-all"
                      autoComplete="off"
                      spellCheck="false"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 rtl:right-auto rtl:left-3 p-1 text-gray-400 hover:text-gray-700 transition-colors"
                      title={showKey ? t.hideKey : t.showKey}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Connection Status Text */}
            <div className="py-1">
              <div className="text-xs font-semibold">
                {keyStatus === 'connected' ? (
                  <div className="flex items-center gap-1.5 text-emerald-800">
                    <span>{t.statusConnected}</span>
                  </div>
                ) : keyStatus === 'error' ? (
                  <div className="flex items-center gap-1.5 text-rose-700">
                    <span>{t.statusFailed}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <span>{t.statusNoKey}</span>
                  </div>
                )}
              </div>

              {testResult && (
                <div className={`mt-2 p-2.5 rounded-xl text-xs font-medium flex items-start gap-2 ${
                  testResult.success 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {saveNotice && (
                <div className="mt-2 p-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{saveNotice}</span>
                </div>
              )}
            </div>

            {/* Buttons Area: حفظ المفتاح, اختبار الاتصال, مسح المفتاح */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                {/* Save Key Button */}
                <button
                  type="button"
                  onClick={handleSaveGeminiKey}
                  disabled={!keyInput.trim() && !isEditingKey}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#14402a] text-white text-xs font-bold hover:bg-[#1b4d36] transition-all shadow-xs active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{t.saveKey}</span>
                </button>

                {/* Test Connection Button */}
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingKey || (!keyInput.trim() && !savedKey)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-all border border-emerald-200/80 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isTestingKey ? 'animate-spin' : ''}`} />
                  <span>{isTestingKey ? t.testingConnection : t.testConnection}</span>
                </button>
              </div>

              {/* Clear Key Button */}
              {hasKeyConfigured && (
                <button
                  type="button"
                  onClick={handleClearGeminiKey}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-700 hover:text-rose-900 hover:bg-rose-50 text-xs font-semibold transition-colors"
                  title={t.clearKey}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.clearKey}</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-400 leading-normal">
              {t.keyPurposeDesc}
            </p>
          </div>

          {/* Section 2: Dedicated Notifications & Behavior */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-800">
                  {t.notificationsAndBehavior}
                </h4>
              </div>
            </div>

            {/* Master Notifications toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/70">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-gray-800 block">
                  {t.notifications}
                </span>
                <span className="text-[11px] text-gray-500 block">
                  {notifState === 'granted' 
                    ? (language === 'ar' ? 'إذن النظام: مفعل ✓' : 'System Permission: Granted ✓') 
                    : (language === 'ar' ? 'إذن النظام: مطلوب للمتابعة' : 'System Permission: Required')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {notifState !== 'granted' ? (
                  <button
                    type="button"
                    onClick={handleRequestNotifications}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#14402a] text-white hover:bg-[#1b4d36] transition-all shadow-2xs"
                  >
                    {language === 'ar' ? 'طلب الإذن' : 'Request'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all ${
                      notificationsEnabled
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-gray-200 text-gray-600 border-gray-300'
                    }`}
                  >
                    {notificationsEnabled ? t.on : t.off}
                  </button>
                )}
              </div>
            </div>

            {/* Haptic Feedback Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/70">
              <div className="space-y-0.5 max-w-[70%]">
                <div className="flex items-center gap-1.5">
                  <Vibrate className="w-3.5 h-3.5 text-emerald-800" />
                  <span className="text-xs font-bold text-gray-800">
                    {t.hapticFeedback}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  {t.hapticFeedbackDesc}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {hapticFeedback && (
                  <button
                    type="button"
                    onClick={handleTestHaptic}
                    className="text-[10px] text-emerald-800 underline font-semibold hidden sm:inline"
                    title="Test subtle haptic vibration"
                  >
                    {language === 'ar' ? 'تجربة' : 'Test'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const next = !hapticFeedback;
                    setHapticFeedback(next);
                    if (next) notificationService.vibrate(25, true);
                  }}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all ${
                    hapticFeedback
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-gray-200 text-gray-600 border-gray-300'
                  }`}
                >
                  {hapticFeedback ? t.on : t.off}
                </button>
              </div>
            </div>

            {/* Sub-Notification Switches */}
            <div className="space-y-2 pt-1">
              {/* Reminder Notifications */}
              <div className="flex items-center justify-between py-1.5 px-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  {t.reminderNotifications}
                </span>
                <button
                  type="button"
                  onClick={() => setReminderNotifications(!reminderNotifications)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${
                    reminderNotifications
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  {reminderNotifications ? t.on : t.off}
                </button>
              </div>

              {/* Supplement Reminders */}
              <div className="flex items-center justify-between py-1.5 px-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-purple-600" />
                  {t.supplementReminders}
                </span>
                <button
                  type="button"
                  onClick={() => setSupplementReminders(!supplementReminders)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${
                    supplementReminders
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  {supplementReminders ? t.on : t.off}
                </button>
              </div>

              {/* Creatine Reminders */}
              <div className="flex items-center justify-between py-1.5 px-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-800" />
                  {t.creatineReminders}
                </span>
                <button
                  type="button"
                  onClick={() => setCreatineReminders(!creatineReminders)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${
                    creatineReminders
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  {creatineReminders ? t.on : t.off}
                </button>
              </div>

              {/* Water Reminders */}
              <div className="flex items-center justify-between py-1.5 px-2">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                  {t.waterReminders}
                </span>
                <button
                  type="button"
                  onClick={() => setWaterReminders(!waterReminders)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${
                    waterReminders
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  {waterReminders ? t.on : t.off}
                </button>
              </div>
            </div>

            {/* Display Over Other Apps (SYSTEM_ALERT_WINDOW capability) */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-800" />
                    <span className="text-xs font-bold text-emerald-950">
                      {t.displayOverOtherApps}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-900/80 mt-0.5 leading-relaxed">
                    {t.displayOverOtherAppsDesc}
                  </p>
                </div>

                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 border ${
                    displayOverOtherApps
                      ? 'bg-emerald-200/80 text-emerald-950 border-emerald-400'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {displayOverOtherApps ? t.enabled : t.notEnabled}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleToggleOverlayPermission}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-2xs ${
                    displayOverOtherApps
                      ? 'bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                      : 'bg-[#14402a] text-white hover:bg-[#1b4d36]'
                  }`}
                >
                  {displayOverOtherApps ? (language === 'ar' ? 'تعطيل' : 'Disable') : t.enableOverlayPermission}
                </button>

                {notificationsEnabled && (
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>{t.testNotification}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Network Status */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                  isOnline ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                }`}>
                  {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-800 block">
                    {t.internetConnection}
                  </span>
                  <span className="text-[11px] text-gray-500 block">
                    {isOnline
                      ? (language === 'ar' ? 'الميزات الذكية متوفرة عبر الإنترنت' : 'Online AI features available')
                      : (language === 'ar' ? 'التطبيق يعمل بكفاءة كاملة بلا إنترنت' : 'All planner data works offline')}
                  </span>
                </div>
              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                isOnline
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {isOnline ? t.networkConnected : t.networkOffline}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 pt-1 leading-relaxed">
              {t.networkStatusDesc}
            </p>
          </div>

          {/* Section 4: Default Targets */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
            <label className="text-xs font-bold text-gray-800 block">
              {t.defaults}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-gray-500 font-medium block mb-1">
                  {t.waterTitle} (L)
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="10"
                  value={waterTargetL}
                  onChange={(e) => setWaterTargetL(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#14402a]"
                />
              </div>
              <div>
                <span className="text-[11px] text-gray-500 font-medium block mb-1">
                  {t.creatineTitle}
                </span>
                <input
                  type="text"
                  value={creatineDose}
                  onChange={(e) => setCreatineDose(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#14402a]"
                />
              </div>
            </div>
          </div>

          {/* Offline Safety Assurance */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-950 font-medium leading-relaxed">
              {t.clearDataWarning}
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-200/80 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {t.close}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#14402a] text-white text-xs font-bold hover:bg-[#1b4d36] transition-all shadow-xs"
          >
            <Check className="w-3.5 h-3.5 text-emerald-300" />
            <span>{t.save}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
