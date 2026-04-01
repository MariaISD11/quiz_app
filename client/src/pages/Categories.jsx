import { useState } from 'react';
import { useQuiz } from '@/hooks/useQuiz';
import { useTranslation, LOCALE_KEYS } from '@/services/localization';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Layout } from '@/components/layouts/Layout';
import { Plus, ChevronRight, BookOpen, Edit2, Check, X } from 'lucide-react';

export function Categories({ onSelectCategory, onAddCategory, onUpdateCategory }) {
  const { t } = useTranslation();
  const { userCategories, getCategoryStats, loading } = useQuiz();
  console.log("Categories Render:", { loading, categoriesCount: userCategories?.length });
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleAdd = async () => {
    if (newCategoryName.trim()) {
      const result = await onAddCategory(newCategoryName);
      if (result) {
        setNewCategoryName('');
        setIsAdding(false);
      }
    }
  };

  const startEdit = (e, cat) => {
    e.stopPropagation();
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const handleSaveEdit = (e) => {
    e.stopPropagation();
    if (editName.trim()) {
      onUpdateCategory(editingId, editName);
      setEditingId(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4">
          <p className="text-gray-500 animate-pulse">Loading categories...</p>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">{t(LOCALE_KEYS.CATEGORIES) || 'Categories'}</h2>
        <Button onClick={() => setIsAdding(true)}>
          <Plus size={20} />
          {t(LOCALE_KEYS.ADD_CATEGORY) || 'Add Category'}
        </Button>
      </div>

      {isAdding && (
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <input
              autoFocus
              className="w-full bg-transparent text-xl font-medium outline-none border-b border-gray-200 dark:border-gray-800 pb-2 focus:border-green-500 transition-colors"
              placeholder="Enter category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd}>{t(LOCALE_KEYS.SAVE) || 'Save'}</Button>
              <Button variant="secondary" onClick={() => setIsAdding(false)}>{t(LOCALE_KEYS.CANCEL) || 'Cancel'}</Button>
            </div>
          </div>
        </Card>
      )}

      {userCategories.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
           <p className="text-gray-400">No categories found. Create your first one!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {userCategories.map((cat) => (
            <Card key={cat.id} className="group p-6 cursor-pointer relative" onClick={() => onSelectCategory(cat)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 mb-1" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        className="bg-transparent text-xl font-semibold outline-none border-b border-green-500"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit(e)}
                      />
                      <button onClick={handleSaveEdit} className="text-green-600"><Check size={20} /></button>
                      <button onClick={e => { e.stopPropagation(); setEditingId(null); }} className="text-gray-400"><X size={20} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group/title">
                      <h3 className="text-xl font-semibold mb-1 group-hover:text-green-600 transition-colors">{cat.name}</h3>
                      <button 
                        onClick={(e) => startEdit(e, cat)}
                        className="opacity-100 lg:opacity-0 lg:group-hover/title:opacity-100 p-1 text-gray-400 hover:text-green-600 transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  )}
                  <p className="text-gray-500 text-sm font-medium">{getCategoryStats(cat.id)} {t(LOCALE_KEYS.CARDS) || 'cards'}</p>
                </div>
                <div className="p-2 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={20} />
                </div>
              </div>
              <div className="mt-6">
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCategory(cat, true);
                  }}
                >
                  <BookOpen size={18} />
                  {t(LOCALE_KEYS.LEARN) || 'Learn'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
