import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Todo, Settings } from './types';
import { Priority, Group } from './types';
import TodoItem from './components/TodoItem';
import EmptyState from './components/EmptyState';
import ConfirmationModal from './components/ConfirmationModal';
import SettingsPage from './components/SettingsPage';
import { PlusIcon, SunIcon, MoonIcon, ChevronDownIcon, ChevronUpIcon, PlayIcon, PauseIcon, StopIcon, TomatoIcon, SettingsIcon } from './components/icons';

// =================================================================
// TimerBar Component
// =================================================================
interface TimerBarProps {
    taskText: string;
    timeLeft: number;
    timerState: 'running' | 'paused';
    onPauseResume: () => void;
    onStop: () => void;
}

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const TimerBar: React.FC<TimerBarProps> = ({ taskText, timeLeft, timerState, onPauseResume, onStop }) => {
    useEffect(() => {
      document.title = `${formatTime(timeLeft)} - ${taskText}`;
      return () => {
        document.title = '番茄清单';
      };
    }, [timeLeft, taskText]);

    return (
        <div className="sticky top-4 z-20 mb-6 flex items-center justify-between p-4 bg-violet-600 text-white rounded-lg shadow-lg animate-fadeInDown">
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium opacity-80">正在专注</span>
                <p className="font-bold text-lg truncate" title={taskText}>{taskText}</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                <span className="text-3xl sm:text-4xl font-mono font-bold">{formatTime(timeLeft)}</span>
                <button
                    onClick={onPauseResume}
                    className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    aria-label={timerState === 'running' ? '暂停计时' : '继续计时'}
                >
                    {timerState === 'running' ? (
                        <PauseIcon className="h-6 w-6" />
                    ) : (
                        <PlayIcon className="h-6 w-6" />
                    )}
                </button>
                <button
                    onClick={onStop}
                    className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    aria-label="停止计时"
                >
                    <StopIcon className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
};

// =================================================================
// PomodoroCompletionModal Component
// =================================================================
interface PomodoroCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PomodoroCompletionModal: React.FC<PomodoroCompletionModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm m-4 p-6 text-center transform transition-all animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center">
            <TomatoIcon className="h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold leading-6 text-slate-900 dark:text-slate-100" id="modal-title">
              番茄钟完成！
            </h3>
            <div className="mt-2">
              <p className="text-md text-slate-500 dark:text-slate-400">
                干得漂亮！休息一下，放松眼睛和大脑。
              </p>
            </div>
        </div>
        <div className="mt-6">
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-violet-600 px-4 py-2.5 text-md font-semibold text-white shadow-sm hover:bg-violet-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 dark:focus:ring-offset-slate-800"
            onClick={onClose}
          >
            好的，开始休息
          </button>
        </div>
      </div>
    </div>
  );
};


// =================================================================
// TodoList Component
// =================================================================
const TodoList: React.FC<{
    title: string;
    todos: Todo[];
    activeCount: number;
    group: Group;
    isCollapsible?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    onToggle: (id: number) => void;
    onDeleteRequest: (id: number) => void;
    onEdit: (id: number, text: string) => void;
    onSetPriority: (id: number, priority: Priority) => void;
    onSetDueDate: (id: number, dueDate: string | undefined) => void;
    onSetPomodoros: (id: number, count: number) => void;
    onMoveGroup: (id: number) => void;
    activeTodoId: number | null;
    timerState: 'running' | 'paused' | 'idle';
    onStartTimer: (id: number) => void;
    onPauseTimer: () => void;
}> = ({ title, todos, activeCount, group, isCollapsible, isCollapsed, onToggleCollapse, onMoveGroup, activeTodoId, timerState, onStartTimer, onPauseTimer, ...props }) => {
    return (
        <div 
          className="bg-white/50 dark:bg-slate-800/50 rounded-lg shadow-xl backdrop-blur-sm flex flex-col transition-all duration-300"
        >
            <div 
              className={`flex justify-between items-center p-4 ${isCollapsible ? 'cursor-pointer' : ''} ${!isCollapsed ? 'border-b border-gray-200 dark:border-slate-700' : ''}`}
              onClick={isCollapsible ? onToggleCollapse : undefined}
            >
                <div className="flex items-center">
                   {isCollapsible && (
                     isCollapsed ? <ChevronDownIcon className="h-5 w-5 mr-2" /> : <ChevronUpIcon className="h-5 w-5 mr-2" />
                   )}
                   <h2 className="text-xl font-bold">{title}</h2>
                </div>
                <span className="text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-2.5 py-0.5">
                    {activeCount}
                </span>
            </div>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-screen opacity-100'}`}>
                {todos.length > 0 ? (
                    <ul className="space-y-2 p-4 overflow-y-auto min-h-48">
                        {todos.map(todo => (
                            <TodoItem
                                key={todo.id}
                                todo={todo}
                                onMoveGroup={onMoveGroup}
                                activeTodoId={activeTodoId}
                                timerState={timerState}
                                onStartTimer={onStartTimer}
                                onPauseTimer={onPauseTimer}
                                {...props}
                            />
                        ))}
                    </ul>
                ) : (
                     !isCollapsed && (
                        <div className="p-4 min-h-48 flex flex-col items-center justify-center">
                            <EmptyState message={title === '收件箱' ? '收件箱是空的！' : '今天没有任务，太棒了！'} />
                        </div>
                     )
                )}
            </div>
        </div>
    );
};

const DEFAULT_SETTINGS: Settings = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
};

// =================================================================
// Main App Component
// =================================================================
const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });
  const [newTodo, setNewTodo] = useState('');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [pendingDeletion, setPendingDeletion] = useState<number | 'clear-completed' | null>(null);
  const [isInboxCollapsed, setIsInboxCollapsed] = useState(true);
  
  const [view, setView] = useState<'main' | 'settings'>('main');
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    return DEFAULT_SETTINGS;
  });

  // Timer State
  const [activeTodoId, setActiveTodoId] = useState<number | null>(null);
  const [timerState, setTimerState] = useState<'running' | 'paused' | 'idle'>('idle');
  const [secondsLeft, setSecondsLeft] = useState(settings.pomodoroDuration * 60);

  // Completion Modal State
  const [isPomodoroCompleteModalOpen, setPomodoroCompleteModalOpen] = useState(false);
  
  // Audio for completion
  const completionSound = useMemo(() => typeof Audio !== 'undefined' ? new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg') : undefined, []);


  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);
  
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    if (timerState === 'idle') {
      setSecondsLeft(settings.pomodoroDuration * 60);
    }
  }, [settings, timerState]);


  // Timer logic using useEffect
  useEffect(() => {
      let interval: ReturnType<typeof setTimeout> | null = null;
      
      if (timerState === 'running' && secondsLeft > 0) {
          interval = setInterval(() => {
              setSecondsLeft(seconds => seconds - 1);
          }, 1000);
      } else if (timerState === 'running' && secondsLeft === 0) {
          // Pomodoro finished!
          completionSound?.play();
          setTodos(prevTodos => 
              prevTodos.map(todo => 
                  todo.id === activeTodoId 
                  ? { ...todo, completedPomodoros: (todo.completedPomodoros || 0) + 1 }
                  : todo
              )
          );
          setTimerState('idle');
          setActiveTodoId(null);
          setSecondsLeft(settings.pomodoroDuration * 60);
          setPomodoroCompleteModalOpen(true);
      }

      return () => {
          if (interval) {
              clearInterval(interval);
          }
      };
  }, [timerState, secondsLeft, activeTodoId, completionSound, settings.pomodoroDuration]);


  // Timer control handlers
  const handleStartTimer = useCallback((id: number) => {
      if (id === activeTodoId) {
          setTimerState('running');
      } else {
          setActiveTodoId(id);
          setSecondsLeft(settings.pomodoroDuration * 60);
          setTimerState('running');
      }
  }, [activeTodoId, settings.pomodoroDuration]);

  const handlePauseTimer = useCallback(() => {
      setTimerState('paused');
  }, []);

  const handleStopTimer = useCallback(() => {
      setTimerState('idle');
      setActiveTodoId(null);
      setSecondsLeft(settings.pomodoroDuration * 60);
  }, [settings.pomodoroDuration]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      setTodos([{ id: Date.now(), text: newTodo.trim(), completed: false, priority: Priority.Medium, group: Group.Inbox, pomodoros: 1, completedPomodoros: 0 }, ...todos]);
      setNewTodo('');
      setIsInboxCollapsed(false);
    }
  };

  const toggleTodo = useCallback((id: number) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);

  const deleteTodoRequest = useCallback((id: number) => {
    setPendingDeletion(id);
  }, []);
  
  const editTodo = useCallback((id: number, text: string) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, text } : todo
      )
    );
  }, []);
  
  const editTodoPriority = useCallback((id: number, priority: Priority) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, priority } : todo
      )
    );
  }, []);

  const editTodoDueDate = useCallback((id: number, dueDate: string | undefined) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, dueDate } : todo
      )
    );
  }, []);

  const editTodoPomodoros = useCallback((id: number, count: number) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id && count >= 1 ? { ...todo, pomodoros: count } : todo
      )
    );
  }, []);

  const handleMoveGroup = useCallback((id: number) => {
    const todoToMove = todos.find(t => t.id === id);
    if (todoToMove && todoToMove.group === Group.Today && isInboxCollapsed) {
      setIsInboxCollapsed(false);
    }
    setTodos(prevTodos => 
        prevTodos.map(todo => 
            todo.id === id 
            ? { ...todo, group: todo.group === Group.Today ? Group.Inbox : Group.Today } 
            : todo
        )
    );
  }, [todos, isInboxCollapsed]);

  const clearCompletedRequest = () => {
    if (todos.some(t => t.completed)) {
        setPendingDeletion('clear-completed');
    }
  }

  const handleModalConfirm = () => {
    if (pendingDeletion === 'clear-completed') {
        setTodos(prevTodos => prevTodos.filter(todo => !todo.completed));
    } else if (typeof pendingDeletion === 'number') {
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== pendingDeletion));
    }
    setPendingDeletion(null);
  };

  const handleModalClose = () => {
      setPendingDeletion(null);
  };

  const inboxTodos = useMemo(() => todos.filter(t => t.group === Group.Inbox), [todos]);
  const todayTodos = useMemo(() => todos.filter(t => t.group === Group.Today), [todos]);
  
  const activeInboxCount = useMemo(() => inboxTodos.filter(t => !t.completed).length, [inboxTodos]);
  const activeTodayCount = useMemo(() => todayTodos.filter(t => !t.completed).length, [todayTodos]);
  const completedCount = useMemo(() => todos.filter(t => t.completed).length, [todos]);
  const activeTodo = useMemo(() => todos.find(todo => todo.id === activeTodoId), [todos, activeTodoId]);


  const getModalMessage = () => {
      if (pendingDeletion === 'clear-completed') {
          return '您确定要删除所有已完成的任务吗？此操作无法撤销。';
      }
      if (typeof pendingDeletion === 'number') {
          const todo = todos.find(t => t.id === pendingDeletion);
          return <>您确定要删除任务 <strong className="font-semibold text-slate-800 dark:text-slate-200">"{todo?.text}"</strong> 吗？</>;
      }
      return '';
  };


  return (
    <div className="min-h-screen font-sans p-4 sm:p-8 flex items-start justify-center">
      {view === 'settings' ? (
        <SettingsPage
          currentSettings={settings}
          onSave={setSettings}
          onBack={() => setView('main')}
          defaultSettings={DEFAULT_SETTINGS}
        />
      ) : (
        <div className="w-full max-w-4xl mx-auto animate-fadeIn">
          <header className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-600">
              番茄清单
            </h1>
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-slate-700" />}
              </button>
              <button
                onClick={() => setView('settings')}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="打开设置"
              >
                <SettingsIcon className="h-6 w-6" />
              </button>
              {completedCount > 0 && (
                  <button onClick={clearCompletedRequest} className="px-3 py-1.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors font-medium">清除已完成 ({completedCount})</button>
              )}
            </div>
          </header>

          {timerState !== 'idle' && activeTodo && (
              <TimerBar 
                  taskText={activeTodo.text}
                  timeLeft={secondsLeft}
                  timerState={timerState === 'paused' ? 'paused' : 'running'}
                  onPauseResume={timerState === 'running' ? handlePauseTimer : () => handleStartTimer(activeTodo.id)}
                  onStop={handleStopTimer}
              />
          )}
          
          <form onSubmit={addTodo} className="mb-6 relative">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="有什么新任务？添加到收件箱..."
              className="w-full pl-5 pr-14 py-3 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-lg"
            />
             <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-600 rounded-md hover:bg-violet-700 transition-colors" aria-label="Add new todo">
               <PlusIcon className="h-6 w-6 text-white"/>
             </button>
          </form>

          <div className="flex flex-col gap-8">
              <TodoList
                  title="今日代办"
                  todos={todayTodos}
                  activeCount={activeTodayCount}
                  group={Group.Today}
                  onToggle={toggleTodo}
                  onDeleteRequest={deleteTodoRequest}
                  onEdit={editTodo}
                  onSetPriority={editTodoPriority}
                  onSetDueDate={editTodoDueDate}
                  onSetPomodoros={editTodoPomodoros}
                  onMoveGroup={handleMoveGroup}
                  activeTodoId={activeTodoId}
                  timerState={timerState}
                  onStartTimer={handleStartTimer}
                  onPauseTimer={handlePauseTimer}
              />
              <TodoList
                  title="收件箱"
                  todos={inboxTodos}
                  activeCount={activeInboxCount}
                  group={Group.Inbox}
                  isCollapsible={true}
                  isCollapsed={isInboxCollapsed}
                  onToggleCollapse={() => setIsInboxCollapsed(!isInboxCollapsed)}
                  onToggle={toggleTodo}
                  onDeleteRequest={deleteTodoRequest}
                  onEdit={editTodo}
                  onSetPriority={editTodoPriority}
                  onSetDueDate={editTodoDueDate}
                  onSetPomodoros={editTodoPomodoros}
                  onMoveGroup={handleMoveGroup}
                  activeTodoId={activeTodoId}
                  timerState={timerState}
                  onStartTimer={handleStartTimer}
                  onPauseTimer={handlePauseTimer}
              />
          </div>
        </div>
      )}

      <ConfirmationModal
          isOpen={pendingDeletion !== null}
          onClose={handleModalClose}
          onConfirm={handleModalConfirm}
          title={pendingDeletion === 'clear-completed' ? '清除已完成的任务' : '删除任务'}
          message={getModalMessage()}
          confirmButtonText={pendingDeletion === 'clear-completed' ? '全部清除' : '删除'}
      />

      <PomodoroCompletionModal 
          isOpen={isPomodoroCompleteModalOpen}
          onClose={() => setPomodoroCompleteModalOpen(false)}
      />

    </div>
  );
};

export default App;
