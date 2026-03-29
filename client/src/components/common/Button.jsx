import { cn } from '@/services/utils';

export function Button({ className, children, variant = 'primary', ...props }) {
  const variants = {
    primary: 'bg-green-600 hover:bg-green-700 text-white shadow-sm active:scale-95',
    secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95',
    outline: 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95'
  };

  return (
    <button
      className={cn(
        'px-4 py-2 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
