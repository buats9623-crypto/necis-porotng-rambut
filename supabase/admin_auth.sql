-- ====================================================================
-- SUPABASE ADMIN AUTHENTICATION & PROFILES SETUP
-- Project: Necis Barbershop · Mas Anang
-- ====================================================================

-- 1. Buat tabel profiles yang berelasi dengan auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Buat index untuk performa query
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Aktifkan Row Level Security (RLS) pada tabel profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan RLS (Row Level Security Policies)
-- Pengguna yang login (authenticated) hanya dapat membaca profil miliknya sendiri
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  ON SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Pengguna yang login hanya dapat memperbarui profil miliknya sendiri
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 5. Function & Trigger otomatis untuk membuat profil baru saat user mendaftar di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- CARA MENGANGKAT USER MENJADI ADMIN
-- Jalankan query di bawah ini setelah membuat user di Supabase Auth:
-- Ganti 'EMAIL_ADMIN_ANDA@example.com' dengan email yang didaftarkan.
-- ====================================================================
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'EMAIL_ADMIN_ANDA@example.com';
-- ====================================================================
