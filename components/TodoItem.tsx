

import React, { useState, useRef, useEffect, memo } from 'react';
import type { Todo } from '../types';
import { Priority, Group } from '../types';
import { TrashIcon, EditIcon, CheckIcon, FlagIcon } from './icons';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDeleteRequest: (id: number) => void;
  onEdit: (id: number, text: string) => void;
  onSetPriority: (id: number, priority: Priority) => void;
  onDragStart: (e: React.DragEvent<HTMLLIElement>, id: number) => void;
}

const priorityMap = {
  [Priority.High]: { color: 'bg-red-500', text: '高', textColor: 'text-red-500' },
  [Priority.Medium]: { color: 'bg-orange-500', text: '中', textColor: 'text-orange-500' },
  [Priority.Low]: { color: 'bg-blue-500', text: '低', textColor: 'text-blue-500' },
};


const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDeleteRequest, onEdit, onSetPriority, onDragStart }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [isPrioritySelectorOpen, setPrioritySelectorOpen] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const prioritySelectorRef = useRef<HTMLDivElement>(null);

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

  const handleSetPriority = (priority: Priority) => {
    onSetPriority(todo.id, priority);
    setPrioritySelectorOpen(false);
  };

  const priorityClasses = priorityMap[todo.priority] || priorityMap[Priority.Medium];
  
  return (
    <li 
      className={`relative flex items-center p-4 pl-6 bg-white dark:bg-slate-800 rounded-lg shadow-md transition-all duration-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 animate-fadeInDown cursor-grab active:cursor-grabbing ${isPrioritySelectorOpen ? 'z-20' : 'z-auto'}`}
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, todo.id)}
    >
      <div className={`absolute left-0 top-0 h-full w-1.5 rounded-l-lg ${todo.completed ? 'bg-slate-400 dark:bg-slate-600' : priorityClasses.color}`}></div>
      <div className="flex items-center flex-grow">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          className={`h-6 w-6 rounded-full bg-gray-200 dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-offset-0 focus:ring-2 cursor-pointer ${todo.completed ? 'text-green-500 focus:ring-green-500' : 'text-violet-500 focus:ring-violet-500'}`}
        />
        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="ml-4 flex-grow bg-gray-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-violet-500 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        ) : (
          <span
            onDoubleClick={handleEdit}
            className={`ml-4 text-lg ${todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}
          >
            {todo.text}
          </span>
        )}
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
                onClick={() => setPrioritySelectorOpen(!isPrioritySelectorOpen)}
                className={`p-2 rounded-full transition-colors ${todo.completed ? 'text-slate-400 cursor-not-allowed' : `${priorityClasses.textColor} hover:bg-slate-200 dark:hover:bg-slate-700`}`}
                aria-label="Change priority"
                disabled={todo.completed}
              >
                <FlagIcon className="h-5 w-5" />
              </button>
              {isPrioritySelectorOpen && (
                 <div className="absolute right-0 bottom-full mb-2 w-28 bg-white dark:bg-slate-900 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-10 animate-scaleIn">
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
