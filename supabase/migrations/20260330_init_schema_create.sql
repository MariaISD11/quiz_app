-- 20260330_init_schema_create.sql
-- ROLLBACK FIRST (згідно з пунктом 1 SUPABASE.md)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- UTILS: Timestamp Handler (згідно з пунктом 5)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CORE TABLES
-- Profile table (пункт 3: Never use auth.users directly)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RBAC (пункт 3: Role-Based Access Control)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL CHECK (role_name IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role_name)
);

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  learn_object_type TEXT NOT NULL CHECK (learn_object_type IN ('text', 'image')),
  learn_object TEXT NOT NULL,
  answer TEXT NOT NULL,
  example TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TRIGGERS: Timestamps (пункт 5)
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_cards_updated_at BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- AUTH SYNC: Trigger (пункт 3: sync with auth.users via a Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role_name)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: Security (пункт 4: Strict Default)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- POLICIES (пункт 4: Specific policies)
CREATE POLICY "Profiles viewable by owner" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users manage own categories" ON public.categories 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own cards" ON public.cards 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- INDEXES (пункт 5)
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_cards_user_id ON public.cards(user_id);
CREATE INDEX idx_cards_category_id ON public.cards(category_id);
