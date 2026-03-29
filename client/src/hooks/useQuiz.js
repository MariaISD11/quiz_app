import { useState, useEffect, useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { supabase } from '@/services/supabase';

// Zustand Store for Global UI State & Cached Data
export const useQuizStore = create((set, get) => ({
  currentUser: null,
  categories: [],
  cards: [],
  loading: true,

  // Auth Actions
  setUser: (user) => set({ currentUser: user }),
  setLoading: (loading) => set({ loading }),
  
  // Data Setters
  setCategories: (categories) => set({ categories }),
  setCards: (cards) => set({ cards }),

  // Auth Operations
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  register: async (userData) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          user_name: userData.name,
        }
      }
    });
    if (error) throw error;
    return data.user;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ currentUser: null, categories: [], cards: [] });
  },

  // Database Operations
  fetchCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    set({ categories: data });
  },

  fetchCards: async () => {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    set({ cards: data });
  },

  addCategory: async (name) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, user_id: user.id }])
      .select()
      .single();
    if (error) throw error;
    set((state) => ({ categories: [data, ...state.categories] }));
  },

  updateCategory: async (id, name) => {
    const { error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id);
    if (error) throw error;
    set((state) => ({
      categories: state.categories.map(c => c.id === id ? { ...c, name } : c)
    }));
  },

  deleteCategory: async (id) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    set((state) => ({
      categories: state.categories.filter(c => c.id !== id),
      cards: state.cards.filter(c => c.category_id !== id)
    }));
  },

  addCard: async (card) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('cards')
      .insert([{ 
        ...card, 
        user_id: user.id,
        category_id: card.categoryId, // Ensure mapping from frontend camelCase to DB snake_case if needed
      }])
      .select()
      .single();
    if (error) throw error;
    set((state) => ({ cards: [data, ...state.cards] }));
  },

  updateCard: async (id, updates) => {
    const { error } = await supabase
      .from('cards')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
    set((state) => ({
      cards: state.cards.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  },

  deleteCard: async (id) => {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id);
    if (error) throw error;
    set((state) => ({
      cards: state.cards.filter(c => c.id !== id)
    }));
  },

  moveCard: async (cardId, newCategoryId) => {
    const { error } = await supabase
      .from('cards')
      .update({ category_id: newCategoryId })
      .eq('id', cardId);
    if (error) throw error;
    set((state) => ({
      cards: state.cards.map(c => c.id === cardId ? { ...c, category_id: newCategoryId } : c)
    }));
  },
}));

export function useQuiz() {
  const store = useQuizStore();

  // Initialize Auth & Data
  useEffect(() => {
    if (!supabase) {
      store.setLoading(false);
      return;
    }

    const initialize = async () => {
      store.setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          store.setUser(session.user);
          await Promise.all([
            store.fetchCategories(),
            store.fetchCards()
          ]);
        }
      } catch (err) {
        console.error('Supabase initialization failed:', err);
      } finally {
        store.setLoading(false);
      }
    };

    initialize();

    // Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        store.setUser(session.user);
        await Promise.all([
          store.fetchCategories(),
          store.fetchCards()
        ]);
      } else if (event === 'SIGNED_OUT') {
        store.setUser(null);
        store.setCategories([]);
        store.setCards([]);
      }
    });

    return () => subscription?.unsubscribe();
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
