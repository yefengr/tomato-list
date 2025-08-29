import React, { useState, useRef, useEffect, memo } from 'react';
import type { Todo } from '../types';
import { Priority } from '../types';
import { TrashIcon, EditIcon, CheckIcon, FlagIcon, CalendarIcon } from './icons';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDeleteRequest: (id: number) => void;
  onEdit: (id: number, text: string) => void;
  onSetPriority: (id: number, priority: Priority) => void;
  onSetDueDate: (id: number, dueDate: string | undefined) => void;
  onDragStart: (e: React.DragEvent<HTMLLIElement>, id: number) => void;
}

const priorityMap = {
  [Priority.High]: { color: 'bg-red-500', text: '高', textColor: 'text-red-500' },
  [Priority.Medium]: { color: 'bg-orange-500', text: '中', textColor: 'text-orange-500' },
  [Priority.Low]: { color: 'bg-blue-500', text: '低', textColor: 'text-blue-500' },
};

const formatDate = (dueDate: string): { text: string, isOverdue: boolean } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    const isOverdue = due < today;
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: '今天', isOverdue: false };
    if (diffDays === 1) return { text: '明天', isOverdue: false };
    if (diffDays === -1) return { text: '昨天', isOverdue: true };
    if (isOverdue) return { text: `逾期 ${-diffDays} 天`, isOverdue: true };
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', weekday: 'short' };
    return { text: new Intl.DateTimeFormat('zh-CN', options).format(due), isOverdue: false };
};


const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDeleteRequest, onEdit, onSetPriority, onSetDueDate, onDragStart }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [isPrioritySelectorOpen, setPrioritySelectorOpen] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
  
  const editInputRef = useRef<HTMLInputElement>(null);
  const prioritySelectorRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (prioritySelectorRef.current && !prioritySelectorRef.current.contains(event.target as Node)) {
        setPrioritySelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editText.trim()) {
      onEdit(todo.id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditText(todo.text);
      setIsEditing(false);
    }
  };
  
  const handlePriorityToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isPrioritySelectorOpen) {
      const ESTIMATED_DROPDOWN_HEIGHT = 120; // px, height of the dropdown
      const buttonElement = event.currentTarget;
      
      let scrollParent = buttonElement.parentElement;
      while (scrollParent) {
          const style = window.getComputedStyle(scrollParent);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
              break; // Found the scrollable container
          }
          if (scrollParent.tagName === 'BODY') { // Stop at body
              scrollParent = null;
              break;
          }
          scrollParent = scrollParent.parentElement;
      }

      const rect = buttonElement.getBoundingClientRect();
      
      // Default to window if no specific scroll parent is found
      const container = scrollParent || document.documentElement;
      
      let spaceBelow: number;
      let spaceAbove: number;

      if (container === document.documentElement) {
          spaceBelow = window.innerHeight - rect.bottom;
          spaceAbove = rect.top;
      } else {
          const containerRect = container.getBoundingClientRect();
          spaceBelow = containerRect.bottom - rect.bottom;
          spaceAbove = rect.top - containerRect.top;
      }

      if (spaceBelow < ESTIMATED_DROPDOWN_HEIGHT && spaceAbove > ESTIMATED_DROPDOWN_HEIGHT) {
        setDropdownDirection('up');
      } else {
        setDropdownDirection('down');
      }
    }
    setPrioritySelectorOpen(!isPrioritySelectorOpen);
  };

  const handleSetPriority = (priority: Priority) => {
    onSetPriority(todo.id, priority);
    setPrioritySelectorOpen(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSetDueDate(todo.id, e.target.value || undefined);
  };

  const priorityClasses = priorityMap[todo.priority] || priorityMap[Priority.Medium];
  const dateInfo = todo.dueDate ? formatDate(todo.dueDate) : null;
  
  return (
    <li 
      className={`relative flex items-center p-4 pl-6 bg-white dark:bg-slate-800 rounded-lg shadow-md transition-all duration-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 animate-fadeInDown cursor-grab active:cursor-grabbing ${isPrioritySelectorOpen ? 'z-10' : ''}`}
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, todo.id)}
    >
      <div className={`absolute left-0 top-0 h-full w-1.5 rounded-l-lg ${todo.completed ? 'bg-slate-400 dark:bg-slate-600' : priorityClasses.color}`}></div>
      <div className="flex-1 flex items-start">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          className={`mt-1 h-6 w-6 rounded-full bg-gray-200 dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-offset-0 focus:ring-2 cursor-pointer ${todo.completed ? 'text-green-500 focus:ring-green-500' : 'text-violet-500 focus:ring-violet-500'}`}
        />
        <div className="ml-4 flex-1">
           {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="w-full bg-gray-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-violet-500 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          ) : (
            <span
              onDoubleClick={handleEdit}
              className={`text-lg ${todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}
            >
              {todo.text}
            </span>
          )}
          {dateInfo && !isEditing && (
            <div className={`text-sm mt-1 ${dateInfo.isOverdue ? 'text-red-500 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                {dateInfo.text}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-1 ml-4">
        {isEditing ? (
          <button
            onClick={handleSave}
            className="p-2 text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors"
            aria-label="Save task"
          >
            <CheckIcon className="h-5 w-5" />
          </button>
        ) : (
          <>
            <div className="relative" ref={prioritySelectorRef}>
              <button
                onClick={handlePriorityToggle}
                className={`p-2 rounded-full transition-colors ${todo.completed ? 'text-slate-400 cursor-not-allowed' : `${priorityClasses.textColor} hover:bg-slate-200 dark:hover:bg-slate-700`}`}
                aria-label="Change priority"
                disabled={todo.completed}
              >
                <FlagIcon className="h-5 w-5" />
              </button>
              {isPrioritySelectorOpen && (
                 <div className={`absolute right-0 w-28 bg-white dark:bg-slate-900 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-30 animate-scaleIn ${dropdownDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                   {Object.values(Priority).map((p) => (
                      <button
                        key={p}
                        onClick={() => handleSetPriority(p)}
                        className="flex items-center w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                         <span className={`w-3 h-3 rounded-full mr-2 ${priorityMap[p].color}`}></span>
                         {priorityMap[p].text}
                      </button>
                   ))}
                 </div>
              )}
            </div>
             <div className="relative">
                <button
                  onClick={() => dateInputRef.current?.showPicker()}
                  className="p-2 text-slate-400 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  aria-label="Set due date"
                >
                  <CalendarIcon className="h-5 w-5" />
                </button>
                <input
                    ref={dateInputRef}
                    type="date"
                    value={todo.dueDate || ''}
                    onChange={handleDateChange}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>
            <button
              onClick={handleEdit}
              className="p-2 text-slate-400 dark:text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
              aria-label="Edit task"
            >
              <EditIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDeleteRequest(todo.id)}
              className="p-2 text-slate-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              aria-label="Delete task"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </li>
  );
};

export default memo(TodoItem);