import React from 'react';
import { CheckCircleIcon } from './icons';

interface EmptyStateProps {
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <CheckCircleIcon className="w-24 h-24 text-slate-300 dark:text-slate-600 mb-4" />
      <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
        {message}
      </p>
    </div>
  );
};

export default EmptyState;
