import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Todo } from './types';
import { Priority, Group } from './types';
import { getSmartSortedTasks } from './services/geminiService';
import TodoItem from './components/TodoItem';
import EmptyState from './components/EmptyState';
import ConfirmationModal from './components/ConfirmationModal';
import { SparklesIcon, PlusIcon, LoadingSpinner, SunIcon, MoonIcon, ChevronDownIcon, ChevronUpIcon } from './components/icons';

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
    onDragStart: (e: React.DragEvent<HTMLLIElement>, id: number) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, group: Group) => void;
}> = ({ title, todos, activeCount, group, isCollapsible, isCollapsed, onToggleCollapse, ...props }) => {
    return (
        <div 
          className="bg-white/50 dark:bg-slate-800/50 rounded-lg shadow-xl backdrop-blur-sm flex flex-col transition-all duration-300"
          onDragOver={props.onDragOver}
          onDrop={(e) => props.onDrop(e, group)}
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
                                onDragStart={props.onDragStart}
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      setTodos([{ id: Date.now(), text: newTodo.trim(), completed: false, priority: Priority.Medium, group: Group.Inbox }, ...todos]);
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

  const moveTodoGroup = useCallback((id: number, group: Group) => {
    setTodos(prevTodos => 
        prevTodos.map(todo => 
            todo.id === id ? { ...todo, group } : todo
        )
    );
  }, []);

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

  const handleSmartSort = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const todayActiveTasks = todos.filter(t => !t.completed && t.group === Group.Today);
      
      if (todayActiveTasks.length < 2) {
        setIsLoading(false);
        return;
      }
      
      const sortedTaskTexts = await getSmartSortedTasks(todayActiveTasks);

      const taskMap = new Map(todayActiveTasks.map(task => [task.text, task]));
      const sortedTodayTasks = sortedTaskTexts.map(text => taskMap.get(text)).filter((t): t is Todo => t !== undefined);
      
      const unsortedTodayTasks = todayActiveTasks.filter(task => !sortedTaskTexts.includes(task.text));
      const otherTasks = todos.filter(t => t.group !== Group.Today || t.completed);
      
      setTodos([...otherTasks, ...sortedTodayTasks, ...unsortedTodayTasks]);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('发生未知错误');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, id: number) => {
    e.dataTransfer.setData("todoId", id.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetGroup: Group) => {
    e.preventDefault();
    const todoId = parseInt(e.dataTransfer.getData("todoId"), 10);
    moveTodoGroup(todoId, targetGroup);
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
            智能清单
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
            <button
              onClick={handleSmartSort}
              disabled={isLoading || activeTodayCount < 2}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-all duration-300 disabled:bg-slate-500 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoadingSpinner className="h-5 w-5 mr-2" />
              ) : (
                <SparklesIcon className="h-5 w-5 mr-2" />
              )}
              智能排序今日任务
            </button>
          </div>
        </header>
        
        {error && <div className="bg-red-500/20 border border-red-500 text-red-400 dark:text-red-300 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}

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
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
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
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
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