import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Todo } from './types';
import { Priority, Group } from './types';
import TodoItem from './components/TodoItem';
import EmptyState from './components/EmptyState';
import ConfirmationModal from './components/ConfirmationModal';
import { PlusIcon, SunIcon, MoonIcon, ChevronDownIcon, ChevronUpIcon } from './components/icons';

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
}> = ({ title, todos, activeCount, group, isCollapsible, isCollapsed, onToggleCollapse, onMoveGroup, ...props }) => {
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

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });
  const [newTodo, setNewTodo] = useState('');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [pendingDeletion, setPendingDeletion] = useState<number | 'clear-completed' | null>(null);
  const [isInboxCollapsed, setIsInboxCollapsed] = useState(true);

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

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      setTodos([{ id: Date.now(), text: newTodo.trim(), completed: false, priority: Priority.Medium, group: Group.Inbox, pomodoros: 1 }, ...todos]);
      setNewTodo('');
      setIsInboxCollapsed(false); // expand inbox when a new task is added
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
      <div className="w-full max-w-4xl mx-auto">
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
             {completedCount > 0 && (
                <button onClick={clearCompletedRequest} className="px-3 py-1.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors font-medium">清除已完成 ({completedCount})</button>
              )}
          </div>
        </header>
        
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
            />
        </div>

        <ConfirmationModal
            isOpen={pendingDeletion !== null}
            onClose={handleModalClose}
            onConfirm={handleModalConfirm}
            title={pendingDeletion === 'clear-completed' ? '清除已完成的任务' : '删除任务'}
            message={getModalMessage()}
            confirmButtonText={pendingDeletion === 'clear-completed' ? '全部清除' : '删除'}
        />

      </div>
    </div>
  );
};

export default App;