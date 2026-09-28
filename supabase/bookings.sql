-- ====================================================================
-- SUPABASE BOOKINGS TABLE & REALTIME SETUP
-- Project: Necis Barbershop · Mas Anang
-- ====================================================================

-- 1. Buat tabel bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  booking_code TEXT NOT NULL UNIQUE,
  queue_number TEXT NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  branch_id TEXT NOT NULL CHECK (branch_id IN ('grojokan', 'tugurejo', 'cabang-1', 'cabang-2')),
  nama_cabang TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'completed', 'cancelled')),
  booking_type TEXT NOT NULL DEFAULT 'online' CHECK (booking_type IN ('online', 'walk-in')),
  total_price INTEGER NOT NULL DEFAULT 8000,
  total_duration INTEGER NOT NULL DEFAULT 25,
  barber_id TEXT NOT NULL DEFAULT 'barber-anang',
  hairstyle_model TEXT DEFAULT 'Textured Crop / French Crop',
  has_custom_photo BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  cancel_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index untuk mempercepat query active bookings (status IN ('waiting', 'serving'))
CREATE INDEX IF NOT EXISTS idx_bookings_active ON public.bookings(status, booking_date, branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date, booking_time);
CREATE INDEX IF NOT EXISTS idx_bookings_queue ON public.bookings(branch_id, booking_date, queue_number);
CREATE INDEX IF NOT EXISTS idx_bookings_lookup ON public.bookings(booking_code, customer_phone);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Publik dapat melihat booking (untuk cek ketersediaan slot jam & tracking status tiket)
DROP POLICY IF EXISTS "Public can view bookings for availability" ON public.bookings;
CREATE POLICY "Public can view bookings for availability"
  ON public.bookings
  FOR SELECT
  TO public
  USING (true);

-- Policy 2: Publik dapat membuat reservasi online baru
DROP POLICY IF EXISTS "Public can insert online booking" ON public.bookings;
CREATE POLICY "Public can insert online booking"
  ON public.bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy 3: Hanya Admin yang dapat memperbarui status booking (Mulai Cukur, Selesai, Batalkan)
DROP POLICY IF EXISTS "Only admin can update bookings" ON public.bookings;
CREATE POLICY "Only admin can update bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Policy 4: Hanya Admin yang dapat menghapus data jika diperlukan
DROP POLICY IF EXISTS "Only admin can delete bookings" ON public.bookings;
CREATE POLICY "Only admin can delete bookings"
  ON public.bookings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 3. Aktifkan Supabase Realtime pada tabel bookings
-- Memastikan perubahan status (waiting -> serving -> completed) langsung terkirim ke semua HP tanpa refresh browser
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
END $$;

ALTER TABLE public.bookings REPLICA IDENTITY FULL;

-- 4. Data Awal Contoh Hari Ini (Seed Data)
INSERT INTO public.bookings (
  id, booking_code, queue_number, branch_id, nama_cabang, 
  customer_name, customer_phone, booking_date, booking_time, 
  status, booking_type, total_price, total_duration, 
  hairstyle_model, notes
)
VALUES
  (
    'seed-g-001', 'G-001', 'G-001', 'grojokan', 'Cabang Grojokan',
    'Bayu Prasetyo', '081234998811', CURRENT_DATE, '09:00',
    'serving', 'online', 8000, 25,
    'Textured Crop / French Crop', 'Minta poni jangan kependekan.'
  ),
  (
    'seed-g-002', 'G-002', 'G-002', 'grojokan', 'Cabang Grojokan',
    'Budi Santoso', '085732114422', CURRENT_DATE, '09:30',
    'waiting', 'online', 8000, 25,
    'Modern Buzz Cut', 'Rapi cepat'
  ),
  (
    'seed-t-001', 'T-001', 'T-001', 'tugurejo', 'Cabang Tugurejo',
    'Rian Saputra', '085732114455', CURRENT_DATE, '19:00',
    'waiting', 'online', 8000, 25,
    'Low Taper Fade', 'Nanti saya tunjukkan foto dari HP saat tiba.'
  ),
  (
    'seed-g-hist-1', 'G-000', 'G-000', 'grojokan', 'Cabang Grojokan',
    'Candra Wijaya', '081299887766', CURRENT_DATE, '08:30',
    'completed', 'walk-in', 8000, 25,
    'Crew Cut', 'Pelanggan pertama pagi ini'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = timezone('utc'::text, now());
