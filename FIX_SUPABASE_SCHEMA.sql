-- ==========================================
-- ФІНАЛЬНИЙ СКРИПТ ВИПРАВЛЕННЯ БАЗИ
-- Скопіюйте цей текст у Supabase SQL Editor
-- ==========================================

-- 1. ОЧИЩЕННЯ СТАРИХ ОБМЕЖЕНЬ
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_user_id_fkey;

-- 2. ПРИВ'ЯЗКА НАПРЯМУ ДО AUTH.USERS
ALTER TABLE public.categories
ADD CONSTRAINT categories_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE public.cards
ADD CONSTRAINT cards_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 3. ПРИМУСОВА СИНХРОНІЗАЦІЯ ПРОФІЛІВ
INSERT INTO public.profiles (id, email, user_name)
SELECT id, email, email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. ПОВНЕ ОНОВЛЕННЯ ПОЛІТИК (RLS) ДЛЯ КАТЕГОРІЙ
DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users manage own categories" ON public.categories;

CREATE POLICY "Allow select for owners" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow insert for owners" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow update for owners" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow delete for owners" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- 5. ПОВНЕ ОНОВЛЕННЯ ПОЛІТИК (RLS) ДЛЯ КАРТОК
DROP POLICY IF EXISTS "Users can view own cards" ON public.cards;
DROP POLICY IF EXISTS "Users manage own cards" ON public.cards;

CREATE POLICY "Allow select for cards" ON public.cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow insert for cards" ON public.cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow update for cards" ON public.cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow delete for cards" ON public.cards FOR DELETE USING (auth.uid() = user_id);
