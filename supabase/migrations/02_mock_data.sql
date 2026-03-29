-- 1. Create a demo user
DO $$
DECLARE
  demo_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Insert into auth.users (if schema exists)
  -- Removing confirmed_at as it is a generated column in some environments
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role)
    VALUES (
      demo_id, 
      'demo@example.com', 
      '{"user_name": "Demo Explorer"}', 
      'authenticated', 
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Ensure public.profile exists (manual insert ensures reliability)
  INSERT INTO public.profiles (id, email, user_name)
  VALUES (demo_id, 'demo@example.com', 'Demo Explorer')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Mock Categories
  INSERT INTO public.categories (id, user_id, name)
  VALUES 
    ('11111111-1111-1111-1111-111111111111', demo_id, 'English Phrases'),
    ('22222222-2222-2222-2222-222222222222', demo_id, 'Programming Concepts')
  ON CONFLICT (id) DO NOTHING;

  -- 3. Mock Cards
  INSERT INTO public.cards (user_id, category_id, learn_object_type, learn_object, answer, example)
  VALUES 
    (demo_id, '11111111-1111-1111-1111-111111111111', 'text', 'Bite the bullet', 'Accept something difficult or unpleasant', 'I hate going to the dentist, but I just have to bite the bullet.'),
    (demo_id, '11111111-1111-1111-1111-111111111111', 'text', 'Break a leg', 'Good luck', 'I know you can do it! Break a leg!'),
    (demo_id, '22222222-2222-2222-2222-222222222222', 'text', 'Closure', 'A function having access to the parent scope', 'Closures are frequently used in JavaScript for data privacy.');
END $$;
