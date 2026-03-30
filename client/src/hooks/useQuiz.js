import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { supabase } from '@/services/supabase';

// 1. Zustand Store - Стан та всі дії
export const useQuizStore = create((set, get) => ({
  currentUser: null,
  userCategories: [],
  cards: [],
  loading: true,

  setUser: (user) => set({ currentUser: user }),
  setLoading: (loading) => set({ loading }),
  setUserCategories: (userCategories) => set({ userCategories }),
  setCards: (cards) => set({ cards }),

  // Auth Actions
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ currentUser: data.user });
    return data.user;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ currentUser: null, userCategories: [], cards: [] });
  },

  // Database Actions
  fetchCategories: async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      set({ userCategories: data || [] });
    } catch (err) { console.error("fetchCategories Error:", err); }
  },

  fetchCards: async () => {
    try {
      const { data, error } = await supabase.from('cards').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      set({ cards: data || [] });
    } catch (err) { console.error("fetchCards Error:", err); }
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
    console.log("addCard: STARTING", card);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active session found");

      const dbCard = {
        user_id: user.id,
        category_id: card.categoryId || card.category_id,
        learn_object_type: card.learn_object_type || card.learnObjectType,
        learn_object: card.learn_object || card.learnObject,
        answer: card.answer,
        example: card.example || '',
      };

      console.log("addCard: Sending to DB", dbCard);

      const { data, error } = await supabase
        .from('cards')
        .insert([dbCard])
        .select()
        .single();

      if (error) throw error;
      
      console.log("addCard: SUCCESS", data);
      set((state) => ({ cards: [data, ...state.cards] }));
      return data;
    } catch (err) {
      console.error("addCard: ERROR", err);
      alert("Failed to save card: " + (err.message || "Unknown error"));
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
let authListenerActive = false;

export function useQuiz() {
  const store = useQuizStore();

  useEffect(() => {
    if (authListenerActive) return;
    authListenerActive = true;

    const initialize = async () => {
      // 1. Миттєва перевірка існуючої сесії
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        store.setUser(session.user);
        await Promise.all([store.fetchCategories(), store.fetchCards()]);
      }
      store.setLoading(false);

      // 2. Слухач майбутніх змін
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          store.setUser(session.user);
          store.setLoading(true);
          await Promise.all([store.fetchCategories(), store.fetchCards()]);
          store.setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          store.setUser(null);
          store.setUserCategories([]);
          store.setCards([]);
          store.setLoading(false);
        }
      });
    };

    initialize();
  }, []);

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
