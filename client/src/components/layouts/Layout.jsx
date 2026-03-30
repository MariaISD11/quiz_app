import { cn } from '@/services/utils';
import { useQuiz } from '@/hooks/useQuiz';
import { useTranslation, LOCALE_KEYS } from '@/services/localization';
import { LogOut, User } from 'lucide-react';

export function Layout({ children, className }) {
  const { currentUser, logout } = useQuiz();
  const { t } = useTranslation();

  return (
    <div className={cn("min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 font-sans selection:bg-green-200 dark:selection:bg-green-900", className)}>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">QuizApp</h1>
          
          {currentUser && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                <User size={16} className="text-gray-500" />
                <span className="text-sm font-medium">
                  {currentUser.user_metadata?.user_name || currentUser.email}
                </span>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title={t(LOCALE_KEYS.LOGOUT)}
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
