import { useState, useRef } from 'react';
import { useQuiz } from '@/hooks/useQuiz';
import { useTranslation, LOCALE_KEYS } from '@/services/localization';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Layout } from '@/components/layouts/Layout';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ArrowLeft, Plus, Image as ImageIcon, Edit2, Type, Upload, X, Trash2 } from 'lucide-react';

export function Cards({ category, onBack, onDeleteCategory, onAddCard, onUpdateCard, onDeleteCard, onMoveCard }) {
  const { t } = useTranslation();
  const { getCardsByCategory, userCategories } = useQuiz();
  const cards = getCardsByCategory(category.id);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const fileInputRef = useRef(null);
  
  // State for Custom Confirm Dialog
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [formData, setFormData] = useState({
    learnObjectType: 'text',
    learnObject: '',
    answer: '',
    example: '',
  });

  const handleAdd = async () => {
    if (formData.learnObject.trim() && formData.answer.trim()) {
      await onAddCard({ 
        learn_object_type: formData.learnObjectType,
        learn_object: formData.learnObject,
        answer: formData.answer,
        example: formData.example,
        categoryId: category.id 
      });
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (formData.learnObject.trim() && formData.answer.trim()) {
      await onUpdateCard(editingCard.id, {
        learn_object_type: formData.learnObjectType,
        learn_object: formData.learnObject,
        answer: formData.answer,
        example: formData.example,
      });
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({ learnObjectType: 'text', learnObject: '', answer: '', example: '' });
    setIsAdding(false);
    setEditingCard(null);
  };

  const startEdit = (card) => {
    setEditingCard(card);
    setFormData({
      learnObjectType: card.learn_object_type || 'text',
      learnObject: card.learn_object,
      answer: card.answer,
      example: card.example || '',
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, learnObject: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const openDeleteCategoryConfirm = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Category",
      message: `Are you sure you want to delete the entire category "${category.name}" and all its ${cards.length} cards? This action cannot be undone.`,
      onConfirm: () => {
        onDeleteCategory(category.id);
        setConfirmConfig({ ...confirmConfig, isOpen: false });
      }
    });
  };

  const openDeleteCardConfirm = (card) => {
    setConfirmConfig({
      isOpen: true,
      title: "Delete Card",
      message: "Are you sure you want to delete this card? This action cannot be undone.",
      onConfirm: () => {
        onDeleteCard(card.id);
        setConfirmConfig({ ...confirmConfig, isOpen: false });
      }
    });
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft size={24} />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{category.name}</h2>
        </div>
        
        <Button 
          variant="ghost" 
          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          onClick={openDeleteCategoryConfirm}
        >
          <Trash2 size={20} className="mr-2" />
          Delete Category
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">{t(LOCALE_KEYS.CARDS)}</h3>
        <Button onClick={() => setIsAdding(true)}>
          <Plus size={20} />
          {t(LOCALE_KEYS.ADD_CARD)}
        </Button>
      </div>

      {isAdding && (
        <Card className="p-6 mb-8 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
               <button 
                 className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${formData.learnObjectType === 'text' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                 onClick={() => setFormData({...formData, learnObjectType: 'text'})}
               >
                 <Type size={16} /> {t(LOCALE_KEYS.TEXT)}
               </button>
               <button 
                 className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${formData.learnObjectType === 'image' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                 onClick={() => setFormData({...formData, learnObjectType: 'image'})}
               >
                 <ImageIcon size={16} /> {t(LOCALE_KEYS.IMAGE)}
               </button>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">
                {formData.learnObjectType === 'text' ? t(LOCALE_KEYS.LEARN_OBJECT) : t(LOCALE_KEYS.IMAGE)}
              </label>
              
              {formData.learnObjectType === 'image' ? (
                <div className="space-y-4">
                  {formData.learnObject ? (
                    <div className="relative w-full h-40 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img src={formData.learnObject} alt="Preview" className="w-full h-full object-contain" />
                      <button 
                        onClick={() => setFormData({...formData, learnObject: ''})}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 hover:border-green-500 hover:text-green-500 cursor-pointer transition-all"
                    >
                      <Upload size={24} className="mb-2" />
                      <p className="font-medium text-sm">Upload from device</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileUpload} 
                  />
                  <input
                    className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-green-500/20 border border-gray-200 dark:border-gray-700 transition-all text-sm"
                    value={formData.learnObject.startsWith('data:') ? 'Image uploaded from device' : formData.learnObject}
                    readOnly={formData.learnObject.startsWith('data:')}
                    onChange={(e) => setFormData({ ...formData, learnObject: e.target.value })}
                    placeholder="...or paste image URL here"
                  />
                </div>
              ) : (
                <input
                  className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-green-500/20 border border-gray-200 dark:border-gray-700 transition-all"
                  value={formData.learnObject}
                  onChange={(e) => setFormData({ ...formData, learnObject: e.target.value })}
                  placeholder="Word or phrase..."
                />
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">{t(LOCALE_KEYS.ANSWER)}</label>
              <input
                className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-green-500/20 border border-gray-200 dark:border-gray-700 transition-all"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">{t(LOCALE_KEYS.EXAMPLE)}</label>
              <textarea
                className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-green-500/20 border border-gray-200 dark:border-gray-700 transition-all h-20 resize-none"
                value={formData.example}
                onChange={(e) => setFormData({ ...formData, example: e.target.value })}
              />
            </div>

            {editingCard && (
               <div>
                 <label className="text-sm font-medium text-gray-500 mb-1 block">{t(LOCALE_KEYS.MOVE_TO_CATEGORY)}</label>
                 <select 
                   className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none border border-gray-200 dark:border-gray-700"
                   onChange={(e) => onMoveCard(editingCard.id, e.target.value)}
                   value={category.id}
                 >
                   {userCategories.map(cat => (
                     <option key={cat.id} value={cat.id}>{cat.name}</option>
                   ))}
                 </select>
               </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={resetForm}>{t(LOCALE_KEYS.CANCEL)}</Button>
              <Button onClick={editingCard ? handleUpdate : handleAdd}>{t(LOCALE_KEYS.SAVE)}</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {cards.map((card) => (
          <Card key={card.id} className="p-4 flex gap-4 items-center group">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700">
              {card.learn_object_type === 'image' ? (
                <img src={card.learn_object} alt="" className="w-full h-full object-cover" />
              ) : (
                <Type size={24} className="text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-lg truncate">{card.learn_object_type === 'image' ? 'Image card' : card.learn_object}</h4>
              <p className="text-gray-500 text-sm truncate">{card.answer}</p>
            </div>
            <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                className="p-2 hover:text-green-600"
                onClick={() => startEdit(card)}
              >
                <Edit2 size={18} />
              </Button>
              <Button 
                variant="ghost" 
                className="p-2 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteCardConfirm(card);
                }}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </Layout>
  );
}
