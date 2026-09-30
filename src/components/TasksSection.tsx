import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Clock, 
  Trash2, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  Edit2, 
  Check, 
  X,
  AlertCircle
} from 'lucide-react';
import { TaskItem, Priority } from '../types';
import { translations } from '../i18n/translations';
import { formatTimeDisplay } from '../utils/date';
import { notificationService } from '../services/notification';

interface TasksSectionProps {
  tasks: TaskItem[];
  onUpdateTasks: (tasks: TaskItem[]) => void;
  language: 'en' | 'ar';
  hapticEnabled?: boolean;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
  tasks,
  onUpdateTasks,
  language,
  hapticEnabled = true,
}) => {
  const t = translations[language];
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  const resetForm = () => {
    setTitle('');
    setTime('');
    setPriority('medium');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    const newTask: TaskItem = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      time: time.trim() || undefined,
      priority,
      completed: false,
      order: tasks.length,
    };

    onUpdateTasks([...tasks, newTask]);
    resetForm();
  };

  const handleSaveEdit = (id: string) => {
    if (!title.trim()) return;
    const updated = tasks.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          title: title.trim(),
          time: time.trim() || undefined,
          priority,
        };
      }
      return t;
    });
    onUpdateTasks(updated);
    resetForm();
  };

  const handleToggleComplete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const nextState = !t.completed;
        if (nextState) {
          notificationService.playChime('task');
          notificationService.vibrate(25, hapticEnabled);
        }
        return { ...t, completed: nextState };
      }
      return t;
    });
    onUpdateTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm(t.confirmDeleteTask)) {
      const filtered = tasks.filter((t) => t.id === id);
      onUpdateTasks(filtered);
    }
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tasks.length) return;
    const copy = [...tasks];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    // update order numbers
    copy.forEach((item, idx) => {
      item.order = idx;
    });
    onUpdateTasks(copy);
  };

  const startEdit = (task: TaskItem) => {
    setEditingId(task.id);
    setTitle(task.title);
    setTime(task.time || '');
    setPriority(task.priority);
    setIsAdding(false);
  };

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'high':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
            {t.high}
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {t.medium}
          </span>
        );
      case 'low':
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {t.low}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-emerald-950/5 transition-all">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-[#14402a] flex items-center justify-center font-bold">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 tracking-tight">
              {t.tasksTitle}
            </h2>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
            {tasks.filter((t) => t.completed).length} / {tasks.length}
          </span>
        </div>

        {!isAdding && !editingId && (
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#14402a] text-white text-xs font-semibold hover:bg-[#1b4d36] transition-all active:scale-95 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addTask}</span>
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(isAdding || editingId) && (
        <div className="mb-4 p-4 rounded-xl bg-[#f4f6f4] border border-emerald-900/10 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#14402a]">
              {editingId ? t.editTask : t.addTask}
            </span>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.taskNamePlaceholder}
            className="w-full text-sm p-2.5 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14402a]/20 focus:border-[#14402a]"
            autoFocus
            dir="auto"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                {t.optionalTime}
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder={t.timePlaceholder}
                className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#14402a]"
                dir="auto"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                {t.priority}
              </label>
              <div className="flex gap-1.5">
                {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-red-500 text-white border-red-500'
                          : p === 'medium'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-[#14402a] text-white border-[#14402a]'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {t[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200"
            >
              {t.cancel}
            </button>
            <button
              onClick={() => (editingId ? handleSaveEdit(editingId) : handleAddTask())}
              disabled={!title.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#14402a] text-white text-xs font-semibold hover:bg-[#1b4d36] disabled:opacity-50 transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingId ? t.save : t.addTask}</span>
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p className="text-xs">{t.noTasks}</p>
          </div>
        ) : (
          tasks.map((task, idx) => (
            <div
              key={task.id}
              className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
                task.completed
                  ? 'bg-gray-50/70 border-gray-200/60 opacity-65'
                  : 'bg-white border-gray-200/80 hover:border-emerald-800/30 hover:shadow-xs'
              }`}
            >
              {/* Checkbox & Task details */}
              <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                <button
                  onClick={() => handleToggleComplete(task.id)}
                  className={`text-[#14402a] hover:scale-110 transition-transform ${
                    task.completed ? 'text-emerald-700' : 'text-gray-400 hover:text-[#14402a]'
                  }`}
                  title={task.completed ? t.completed : 'Mark as done'}
                >
                  {task.completed ? (
                    <CheckSquare className="w-5 h-5 fill-emerald-100" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold truncate ${
                      task.completed
                        ? 'line-through text-gray-500'
                        : 'text-gray-800'
                    }`}
                    dir="auto"
                  >
                    {task.title}
                  </p>

                  <div className="flex items-center gap-2 mt-0.5">
                    {task.time && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                        <Clock className="w-3 h-3 text-emerald-800" />
                        {formatTimeDisplay(task.time)}
                      </span>
                    )}
                    {getPriorityBadge(task.priority)}
                  </div>
                </div>
              </div>

              {/* Action Buttons (Reorder, Edit, Delete) */}
              <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                {/* Reorder Buttons */}
                <div className="flex flex-col">
                  <button
                    onClick={() => handleMoveOrder(idx, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveOrder(idx, 'down')}
                    disabled={idx === tasks.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => startEdit(task)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title={t.edit}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title={t.delete}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
