export enum Priority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export enum Group {
  Inbox = 'inbox',
  Today = 'today',
}

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
  group: Group;
  dueDate?: string; // YYYY-MM-DD format
  pomodoros?: number; // 预计完成任务需要的番茄钟数量
  completedPomodoros?: number; // 已完成的番茄钟数量
}

export enum FilterStatus {
  All = 'all',
  Active = 'active',
  Completed = 'completed',
}

export interface Settings {
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
}
