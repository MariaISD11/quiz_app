-- 1. CLEANUP: Drop with CASCADE to resolve dependency errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- 2. UTILS: Timestamp Handler
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CORE TABLES
-- Profile table (linked to auth.users if available)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL CHECK (role_name IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role_name)
);

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  learn_object_type TEXT NOT NULL CHECK (learn_object_type IN ('text', 'image')),
  learn_object TEXT NOT NULL,
  answer TEXT NOT NULL,
  example TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TRIGGERS: Timestamps
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_cards_updated_at BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. AUTH SYNC & CONSTRAINTS (Conditional for Supabase environment)
DO $setup$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    -- Add Foreign Key to auth.users
    EXECUTE 'ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE';

    -- Sync Function
    EXECUTE $f$
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, user_name)
        VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.email))
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, user_name = EXCLUDED.user_name;
        
        INSERT INTO public.user_roles (user_id, role_name)
        VALUES (NEW.id, 'user')
        ON CONFLICT DO NOTHING;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    $f$;

    -- Sync Trigger
    EXECUTE 'CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()';
  END IF;
END $setup$;

-- 6. RLS: Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- 7. POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own cards" ON public.cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cards" ON public.cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON public.cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards" ON public.cards FOR DELETE USING (auth.uid() = user_id);

-- 8. INDEXES
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_cards_category_id ON public.cards(category_id);
CREATE INDEX idx_cards_user_id ON public.cards(user_id);
