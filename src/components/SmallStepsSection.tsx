import React, { useState } from 'react';
import { 
  ListChecks, 
  Square, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ChevronUp, 
  ChevronDown,
  Sparkles 
} from 'lucide-react';
import { SmallStepItem } from '../types';
import { translations } from '../i18n/translations';
import { breakdownTaskWithAI } from '../services/ai';
import { notificationService } from '../services/notification';

interface SmallStepsSectionProps {
  steps: SmallStepItem[];
  onUpdateSteps: (steps: SmallStepItem[]) => void;
  language: 'en' | 'ar';
  hapticEnabled?: boolean;
}

export const SmallStepsSection: React.FC<SmallStepsSectionProps> = ({
  steps,
  onUpdateSteps,
  language,
  hapticEnabled = true,
}) => {
  const t = translations[language];
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stepText, setStepText] = useState('');

  // AI Break Down modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTaskPrompt, setAiTaskPrompt] = useState('');
  const [isBreakingDown, setIsBreakingDown] = useState(false);

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!stepText.trim()) return;

    const newStep: SmallStepItem = {
      id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: stepText.trim(),
      completed: false,
      order: steps.length,
    };

    onUpdateSteps([...steps, newStep]);
    setStepText('');
    setIsAdding(false);
  };

  const handleSaveEdit = (id: string) => {
    if (!stepText.trim()) return;
    const updated = steps.map((s) => (s.id === id ? { ...s, text: stepText.trim() } : s));
    onUpdateSteps(updated);
    setStepText('');
    setEditingId(null);
  };

  const handleToggleComplete = (id: string) => {
    const updated = steps.map((s) => {
      if (s.id === id) {
        const next = !s.completed;
        if (next) {
          notificationService.playChime('task');
          notificationService.vibrate(25, hapticEnabled);
        }
        return { ...s, completed: next };
      }
      return s;
    });
    onUpdateSteps(updated);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t.confirmDeleteStep)) {
      onUpdateSteps(steps.filter((s) => s.id !== id));
    }
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    const copy = [...steps];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    copy.forEach((item, idx) => {
      item.order = idx;
    });
    onUpdateSteps(copy);
  };

  const handleAiBreakdown = async () => {
    if (!aiTaskPrompt.trim()) return;
    try {
      setIsBreakingDown(true);
      const generatedSteps = await breakdownTaskWithAI(aiTaskPrompt.trim(), language);
      if (generatedSteps && generatedSteps.length > 0) {
        const newItems: SmallStepItem[] = generatedSteps.map((txt, idx) => ({
          id: `step_${Date.now()}_${idx}`,
          text: txt,
          completed: false,
          order: steps.length + idx,
        }));
        onUpdateSteps([...steps, ...newItems]);
        setAiTaskPrompt('');
        setShowAiModal(false);
      }
    } catch (e) {
      console.warn('AI breakdown failed:', e);
    } finally {
      setIsBreakingDown(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-emerald-950/5 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-[#14402a] flex items-center justify-center font-bold">
            <ListChecks className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 tracking-tight">
              {t.smallStepsTitle}
            </h2>
          </div>
          {totalCount > 0 && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              {completedCount} / {totalCount} {t.completed} — {percentage}%
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {/* AI Breakdown button */}
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors border border-emerald-200/50"
            title="Break down any task with AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.aiBreakdown}</span>
          </button>

          {!isAdding && !editingId && (
            <button
              onClick={() => {
                setStepText('');
                setIsAdding(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#14402a] text-white text-xs font-semibold hover:bg-[#1b4d36] transition-all active:scale-95 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addSmallStep}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-4">
          <div
            className="bg-[#14402a] h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* AI Breakdown Input Modal */}
      {showAiModal && (
        <div className="mb-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-300/60 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#14402a] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              {t.aiBreakdown}
            </span>
            <button
              onClick={() => setShowAiModal(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-600">
            {language === 'ar'
              ? 'أدخل اسم المهمة أو المشروع ليقوم الذكاء الاصطناعي بتقسيمها إلى خطوات صغيرة متسلسلة:'
              : 'Enter a large task to have Task Watcher AI break it into bite-sized sequential actions:'}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiTaskPrompt}
              onChange={(e) => setAiTaskPrompt(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: إعداد درس الكيمياء...' : 'e.g., Prepare chemistry presentation...'}
              className="flex-1 text-xs p-2.5 rounded-lg bg-white border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-[#14402a]"
              dir="auto"
              autoFocus
            />
            <button
              onClick={handleAiBreakdown}
              disabled={isBreakingDown || !aiTaskPrompt.trim()}
              className="px-3 py-2 rounded-lg bg-[#14402a] text-white text-xs font-semibold hover:bg-[#1b4d36] disabled:opacity-50 flex items-center gap-1"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isBreakingDown ? 'animate-spin' : ''}`} />
              <span>{isBreakingDown ? '...' : t.send}</span>
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Form */}
      {(isAdding || editingId) && (
        <div className="mb-3 p-3 rounded-xl bg-[#f4f6f4] border border-emerald-900/10 flex items-center gap-2 animate-in fade-in duration-150">
          <input
            type="text"
            value={stepText}
            onChange={(e) => setStepText(e.target.value)}
            placeholder={t.smallStepPlaceholder}
            className="flex-1 text-xs p-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#14402a]"
            autoFocus
            dir="auto"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                editingId ? handleSaveEdit(editingId) : handleAddStep();
              }
            }}
          />
          <button
            onClick={() => (editingId ? handleSaveEdit(editingId) : handleAddStep())}
            disabled={!stepText.trim()}
            className="px-3 py-2 rounded-lg bg-[#14402a] text-white text-xs font-semibold hover:bg-[#1b4d36] disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setEditingId(null);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Steps List */}
      <div className="space-y-1.5">
        {steps.length === 0 ? (
          <div className="text-center py-5 text-gray-400">
            <p className="text-xs">{t.noSmallSteps}</p>
          </div>
        ) : (
          steps.map((step, idx) => (
            <div
              key={step.id}
              className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                step.completed
                  ? 'bg-gray-50/60 border-gray-200/50 opacity-60'
                  : 'bg-white border-gray-100 hover:border-emerald-800/30'
              }`}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                <button
                  onClick={() => handleToggleComplete(step.id)}
                  className={`text-[#14402a] transition-transform hover:scale-110 ${
                    step.completed ? 'text-emerald-700' : 'text-gray-400 hover:text-[#14402a]'
                  }`}
                >
                  {step.completed ? (
                    <CheckSquare className="w-4 h-4 fill-emerald-100" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <span
                  className={`text-xs font-medium truncate ${
                    step.completed ? 'line-through text-gray-400' : 'text-gray-700'
                  }`}
                  dir="auto"
                >
                  {step.text}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-col">
                  <button
                    onClick={() => handleMoveOrder(idx, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleMoveOrder(idx, 'down')}
                    disabled={idx === steps.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setEditingId(step.id);
                    setStepText(step.text);
                    setIsAdding(false);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded"
                >
                  <Edit2 className="w-3 h-3" />
                </button>

                <button
                  onClick={() => handleDelete(step.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
