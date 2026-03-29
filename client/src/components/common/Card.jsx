import { cn } from '@/services/utils';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
