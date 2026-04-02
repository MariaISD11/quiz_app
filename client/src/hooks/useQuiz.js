import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { supabase } from '@/services/supabase';

// 1. Zustand Store - Централізований стан та логіка
export const useQuizStore = create((set, get) => ({
  currentUser: null,
  userCategories: [],
  cards: [],
  loading: true,
  isFetching: false, // Блокувальник одночасних запитів

  setUser: (user) => set({ currentUser: user }),
  setLoading: (loading) => set({ loading }),
  setUserCategories: (userCategories) => set({ userCategories }),
  setCards: (cards) => set({ cards }),

  // Централізований метод оновлення даних з блокуванням
  refreshData: async () => {
    if (get().isFetching) return;
    set({ isFetching: true });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ currentUser: session.user });
        // Виконуємо запити паралельно
        const [categories, cards] = await Promise.all([
          supabase.from('categories').select('*').order('created_at', { ascending: false }),
          supabase.from('cards').select('*').order('created_at', { ascending: false })
        ]);

        if (!categories.error) set({ userCategories: categories.data || [] });
        if (!cards.error) set({ cards: cards.data || [] });
      } else {
        set({ currentUser: null });
      }
    } catch (err) {
      console.error("Refresh Data Error:", err);
    } finally {
      set({ loading: false, isFetching: false });
    }
  },

  // Auth Actions
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ currentUser: data.user });
    // Відразу завантажуємо дані після логіну
    await get().refreshData();
    return data.user;
  },

  register: async ({ email, password, name }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_name: name,
          full_name: name, // Для сумісності
        },
      },
    });
    if (error) throw error;
    set({ currentUser: data.user });
    // Відразу завантажуємо дані після реєстрації
    await get().refreshData();
    return data.user;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ currentUser: null, userCategories: [], cards: [] });
  },

  // Database Actions (допоміжні методи для CRUD зазвичай не потребують повного refreshData)
  fetchCategories: async () => {
    const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
    if (!error) set({ userCategories: data || [] });
  },

  fetchCards: async () => {
    const { data, error } = await supabase.from('cards').select('*').order('created_at', { ascending: false });
    if (!error) set({ cards: data || [] });
  },

  addCategory: async (name) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('categories').insert([{ name, user_id: user.id }]).select().single();
    if (error) return null;
    set((state) => ({ userCategories: [data, ...state.userCategories] }));
    return data;
  },

  updateCategory: async (id, name) => {
    const { error } = await supabase.from('categories').update({ name }).eq('id', id);
    if (error) return false;
    set((state) => ({ userCategories: state.userCategories.map(c => c.id === id ? { ...c, name } : c) }));
    return true;
  },

  deleteCategory: async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return false;
    set((state) => ({
      userCategories: state.userCategories.filter(c => c.id !== id),
      cards: state.cards.filter(c => c.category_id !== id)
    }));
    return true;
  },

  addCard: async (card) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const dbCard = {
        user_id: user.id,
        category_id: card.categoryId || card.category_id,
        learn_object_type: card.learn_object_type || card.learnObjectType,
        learn_object: card.learn_object || card.learnObject,
        answer: card.answer,
        example: card.example || '',
      };
      const { data, error } = await supabase.from('cards').insert([dbCard]).select().single();
      if (error) throw error;
      set((state) => ({ cards: [data, ...state.cards] }));
      return data;
    } catch (error) { 
      console.error("Add Card Error:", error);
      return null; 
    }
  },

  updateCard: async (id, updates) => {
    const dbUpdates = { ...updates };
    if (updates.learnObjectType) { dbUpdates.learn_object_type = updates.learnObjectType; delete dbUpdates.learnObjectType; }
    if (updates.learnObject) { dbUpdates.learn_object = updates.learnObject; delete dbUpdates.learnObject; }
    const { error } = await supabase.from('cards').update(dbUpdates).eq('id', id);
    if (error) return false;
    set((state) => ({ cards: state.cards.map(c => c.id === id ? { ...c, ...dbUpdates } : c) }));
    return true;
  },

  deleteCard: async (id) => {
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) return false;
    set((state) => ({ cards: state.cards.filter(c => c.id !== id) }));
    return true;
  },

  moveCard: async (cardId, newCategoryId) => {
    const { error } = await supabase.from('cards').update({ category_id: newCategoryId }).eq('id', cardId);
    if (error) return false;
    set((state) => ({ cards: state.cards.map(c => c.id === cardId ? { ...c, category_id: newCategoryId } : c) }));
    return true;
  }
}));

// 2. Хук ініціалізації та використання
export function useQuiz() {
  const store = useQuizStore();

  useEffect(() => {
    // 1. Початкове завантаження (виконується ОДИН раз при монтуванні)
    store.refreshData();

    // 2. Слухач авторизації (ТІЛЬКИ зміна стану користувача)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        store.setUser(session?.user || null);
        // Рефетч тут не робимо, бо він або вже зроблений в initialize, або буде в login()
      } else if (event === 'SIGNED_OUT') {
        store.setUser(null);
        store.setUserCategories([]);
        store.setCards([]);
      }
    });

    // 3. Єдиний тригер оновлення при поверненні на сторінку
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        store.refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Порожній масив - гарантія одного запуску

  const getCardsByCategory = useCallback((categoryId) => {
    return store.cards.filter(c => c.category_id === categoryId);
  }, [store.cards]);

  const getCategoryStats = useCallback((categoryId) => {
    return store.cards.filter(c => c.category_id === categoryId).length;
  }, [store.cards]);

  return {
    ...store,
    getCardsByCategory,
    getCategoryStats
  };
}
