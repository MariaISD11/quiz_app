import { useState } from 'react';
import { useQuiz } from '@/hooks/useQuiz';
import { useTranslation, LOCALE_KEYS } from '@/services/localization';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Layout } from '@/components/layouts/Layout';
import { AlertCircle } from 'lucide-react';

export function Auth() {
  const { t } = useTranslation();
  const { login, register } = useQuiz();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
    } catch (err) {
      console.error(err);
      if (err.message?.includes('Email already in use') || err.code === '23505') {
        setError('REGISTER_ERROR');
      } else {
        setError('LOGIN_ERROR');
      }
    }
  };

  return (
    <Layout className="flex flex-col items-center justify-center pt-10">
      <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
        <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">QuizApp</h1>
      </div>

      <Card className="w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-500">
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-700 dark:text-gray-200">
          {isLogin ? t(LOCALE_KEYS.LOGIN) : t(LOCALE_KEYS.REGISTER)}
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-600 animate-in shake duration-500">
            <AlertCircle size={20} />
            <p className="text-sm font-semibold">{t(LOCALE_KEYS[error])}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">{t(LOCALE_KEYS.USER_NAME)}</label>
              <input
                className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-green-500/20 border border-gray-200 dark:border-gray-700 transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">{t(LOCALE_KEYS.EMAIL)}</label>
            <input
              type="email"
              className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-green-500/20 border border-gray-200 dark:border-gray-700 transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500 mb-1 block">{t(LOCALE_KEYS.PASSWORD)}</label>
            <input
              type="password"
              className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-green-500/20 border border-gray-200 dark:border-gray-700 transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full h-14 text-lg mt-4 shadow-lg shadow-green-500/20">
            {isLogin ? t(LOCALE_KEYS.LOGIN) : t(LOCALE_KEYS.REGISTER)}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          <button 
            className="text-green-600 font-bold hover:underline"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(false);
            }}
          >
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-400">
           Tip: Use <b>demo / demo</b> to login instantly.
        </div>
      </Card>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-in.shake { animation: shake 0.4s ease-in-out; }
      `}} />
    </Layout>
  );
}
