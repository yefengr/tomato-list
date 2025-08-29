
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
}

export enum FilterStatus {
  All = 'all',
  Active = 'active',
  Completed = 'completed',
}