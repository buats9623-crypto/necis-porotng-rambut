-- ====================================================================
-- SUPABASE POSTGRESQL DATABASE MIGRATION: NECIS BARBERSHOP (MAS ANANG)
-- Modules: Branches, Services, Customers, Bookings, Booking Services,
-- Queue Protection, Anti-Duplicate Queue, Atomic Booking RPC, & RLS.
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TRIGGER FUNCTION: update_timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 3. TABEL: branches (2 Cabang: Grojokan & Tugurejo)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  max_queue_per_hour INTEGER NOT NULL DEFAULT 4,
  is_open BOOLEAN NOT NULL DEFAULT true,
  google_maps_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS trg_branches_updated_at ON public.branches;
CREATE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ====================================================================
-- 4. TABEL: services (Layanan & Tarif)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ====================================================================
-- 5. TABEL: customers (Pelanggan)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ====================================================================
-- 6. TABEL: bookings (Reservasi & Antrean)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  queue_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'completed', 'cancelled')),
  booking_type TEXT NOT NULL DEFAULT 'online' CHECK (booking_type IN ('online', 'walk_in')),
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  -- Anti-Duplicate: satu cabang pada satu tanggal tidak boleh memiliki nomor antrean kembar!
  CONSTRAINT uq_branch_date_queue UNIQUE (branch_id, booking_date, queue_number)
);

CREATE INDEX IF NOT EXISTS idx_bookings_branch_date ON public.bookings(branch_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON public.bookings(booking_code);

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ====================================================================
-- 7. TABEL: booking_services (Relasi Layanan & Snapshot Harga)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON public.booking_services(booking_id);

-- ====================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;

-- Helper check role admin dari tabel profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- BRANCHES ---
DROP POLICY IF EXISTS "Public can view active branches" ON public.branches;
CREATE POLICY "Public can view active branches"
  ON public.branches FOR SELECT TO public
  USING (is_open = true);

DROP POLICY IF EXISTS "Admins have full access to branches" ON public.branches;
CREATE POLICY "Admins have full access to branches"
  ON public.branches FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --- SERVICES ---
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services"
  ON public.services FOR SELECT TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins have full access to services" ON public.services;
CREATE POLICY "Admins have full access to services"
  ON public.services FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --- CUSTOMERS ---
-- Data pelanggan privat: hanya admin yang dapat melihat list customer secara langsung.
-- Publik membuat/mencari customer secara aman melalui RPC create_booking / get_booking_status.
DROP POLICY IF EXISTS "Admins have full access to customers" ON public.customers;
CREATE POLICY "Admins have full access to customers"
  ON public.customers FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --- BOOKINGS ---
-- Admin dapat melihat dan mengelola semua booking
DROP POLICY IF EXISTS "Admins have full access to bookings" ON public.bookings;
CREATE POLICY "Admins have full access to bookings"
  ON public.bookings FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --- BOOKING_SERVICES ---
DROP POLICY IF EXISTS "Admins have full access to booking_services" ON public.booking_services;
CREATE POLICY "Admins have full access to booking_services"
  ON public.booking_services FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ====================================================================
-- 9. ATOMIC BOOKING FUNCTION (RPC): create_booking
-- Menangani validasi jam operasional, kuota per jam, anti-duplicate queue
-- dengan advisory lock, pembuatan/pencarian customer, dan perhitungan harga.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.create_booking(
  p_branch_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_booking_date DATE,
  p_booking_time TIME,
  p_service_ids UUID[],
  p_booking_type TEXT DEFAULT 'online',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch RECORD;
  v_customer_id UUID;
  v_booking_id UUID;
  v_next_queue INTEGER;
  v_total_price NUMERIC(12,2) := 0.00;
  v_existing_slot_count INTEGER;
  v_clean_phone TEXT;
  v_branch_prefix TEXT;
  v_booking_code TEXT;
  v_service_count INTEGER;
  v_result JSONB;
BEGIN
  -- 1. Validasi Input Dasar
  IF p_customer_name IS NULL OR trim(p_customer_name) = '' THEN
    RAISE EXCEPTION 'Nama pelanggan wajib diisi.';
  END IF;

  v_clean_phone := regexp_replace(p_customer_phone, '\D', '', 'g');
  IF length(v_clean_phone) < 9 OR length(v_clean_phone) > 16 THEN
    RAISE EXCEPTION 'Nomor telepon/WhatsApp tidak valid.';
  END IF;

  IF p_booking_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Tanggal booking tidak boleh di masa lampau.';
  END IF;

  IF p_service_ids IS NULL OR array_length(p_service_ids, 1) = 0 THEN
    RAISE EXCEPTION 'Pilih minimal satu layanan pangkas rambut.';
  END IF;

  -- 2. Validasi Cabang
  SELECT * INTO v_branch FROM public.branches WHERE id = p_branch_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cabang barbershop tidak ditemukan.';
  END IF;

  IF NOT v_branch.is_open THEN
    RAISE EXCEPTION 'Cabang % saat ini sedang tidak beroperasi (tutup).', v_branch.name;
  END IF;

  -- 3. Validasi Jam Operasional
  IF p_booking_time < v_branch.opening_time OR p_booking_time > v_branch.closing_time THEN
    RAISE EXCEPTION 'Jam % di luar jam operasional cabang % (% sampai %).',
      p_booking_time, v_branch.name, v_branch.opening_time, v_branch.closing_time;
  END IF;

  -- 4. Validasi Layanan & Hitung Total Harga dari Database
  SELECT COUNT(*), COALESCE(SUM(price), 0.00)
  INTO v_service_count, v_total_price
  FROM public.services
  WHERE id = ANY(p_service_ids) AND is_active = true;

  IF v_service_count <> array_length(p_service_ids, 1) THEN
    RAISE EXCEPTION 'Salah satu atau lebih layanan yang dipilih tidak aktif atau tidak ditemukan.';
  END IF;

  -- 5. Advisory Lock Atomik per (branch_id + booking_date)
  -- Mencegah race condition ketika dua orang submit bersamaan
  PERFORM pg_advisory_xact_lock(hashtext(p_branch_id::text || p_booking_date::text));

  -- 6. Validasi Kuota per Jam
  SELECT COUNT(*) INTO v_existing_slot_count
  FROM public.bookings
  WHERE branch_id = p_branch_id
    AND booking_date = p_booking_date
    AND date_trunc('hour', booking_time) = date_trunc('hour', p_booking_time)
    AND status <> 'cancelled';

  IF v_existing_slot_count >= v_branch.max_queue_per_hour THEN
    RAISE EXCEPTION 'Kuota antrean pada jam % sudah penuh (% antrean). Silakan pilih jam lain.',
      to_char(p_booking_time, 'HH24:MI'), v_branch.max_queue_per_hour;
  END IF;

  -- 7. Hitung Nomor Antrean Atomik
  SELECT COALESCE(MAX(queue_number), 0) + 1
  INTO v_next_queue
  FROM public.bookings
  WHERE branch_id = p_branch_id AND booking_date = p_booking_date;

  -- 8. Cari atau Buat Pelanggan (Customer)
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE phone = v_clean_phone
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (name, phone)
    VALUES (trim(p_customer_name), v_clean_phone)
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers
    SET name = trim(p_customer_name), updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  -- 9. Buat Booking Code Unik (Contoh: NC-20260927-G001)
  IF v_branch.name ILIKE '%grojokan%' THEN
    v_branch_prefix := 'G';
  ELSIF v_branch.name ILIKE '%tugurejo%' THEN
    v_branch_prefix := 'T';
  ELSE
    v_branch_prefix := 'N';
  END IF;

  v_booking_code := 'NC-' || to_char(p_booking_date, 'YYYYMMDD') || '-' || v_branch_prefix || lpad(v_next_queue::text, 3, '0');

  -- 10. Insert Booking
  INSERT INTO public.bookings (
    booking_code,
    customer_id,
    branch_id,
    booking_date,
    booking_time,
    queue_number,
    status,
    booking_type,
    total_price,
    notes
  ) VALUES (
    v_booking_code,
    v_customer_id,
    p_branch_id,
    p_booking_date,
    p_booking_time,
    v_next_queue,
    'waiting',
    COALESCE(p_booking_type, 'online'),
    v_total_price,
    p_notes
  ) RETURNING id INTO v_booking_id;

  -- 11. Insert Booking Services (Snapshot harga saat ini)
  INSERT INTO public.booking_services (booking_id, service_id, price)
  SELECT v_booking_id, s.id, s.price
  FROM public.services s
  WHERE s.id = ANY(p_service_ids);

  -- 12. Kembalikan data lengkap untuk respons frontend
  SELECT jsonb_build_object(
    'id', b.id,
    'booking_code', b.booking_code,
    'queue_number', b.queue_number,
    'formatted_queue', v_branch_prefix || '-' || lpad(b.queue_number::text, 3, '0'),
    'branch_id', b.branch_id,
    'branch_name', v_branch.name,
    'booking_date', b.booking_date,
    'booking_time', to_char(b.booking_time, 'HH24:MI'),
    'status', b.status,
    'booking_type', b.booking_type,
    'total_price', b.total_price,
    'customer_name', trim(p_customer_name),
    'customer_phone', v_clean_phone,
    'notes', b.notes,
    'created_at', b.created_at
  ) INTO v_result
  FROM public.bookings b
  WHERE b.id = v_booking_id;

  RETURN v_result;
END;
$$;

-- ====================================================================
-- 10. PUBLIC QUERY RPC: get_booking_status
-- Memungkinkan publik mencari tiket reservasi miliknya via booking_code atau phone
-- tanpa mengekspos daftar seluruh pelanggan.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_booking_status(p_search_query TEXT)
RETURNS TABLE (
  id UUID,
  booking_code TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  branch_name TEXT,
  booking_date DATE,
  booking_time TEXT,
  queue_number INTEGER,
  formatted_queue TEXT,
  status TEXT,
  booking_type TEXT,
  total_price NUMERIC,
  notes TEXT,
  services JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_search TEXT;
BEGIN
  v_clean_search := trim(p_search_query);
  IF length(v_clean_search) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.booking_code,
    c.name AS customer_name,
    c.phone AS customer_phone,
    br.name AS branch_name,
    b.booking_date,
    to_char(b.booking_time, 'HH24:MI') AS booking_time,
    b.queue_number,
    (CASE WHEN br.name ILIKE '%grojokan%' THEN 'G' ELSE 'T' END) || '-' || lpad(b.queue_number::text, 3, '0') AS formatted_queue,
    b.status,
    b.booking_type,
    b.total_price,
    b.notes,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object('id', s.id, 'name', s.name, 'price', bs.price)
        )
        FROM public.booking_services bs
        JOIN public.services s ON s.id = bs.service_id
        WHERE bs.booking_id = b.id
      ),
      '[]'::jsonb
    ) AS services
  FROM public.bookings b
  JOIN public.customers c ON c.id = b.customer_id
  JOIN public.branches br ON br.id = b.branch_id
  WHERE b.booking_code ILIKE ('%' || v_clean_search || '%')
     OR c.phone ILIKE ('%' || regexp_replace(v_clean_search, '\D', '', 'g') || '%')
  ORDER BY b.booking_date DESC, b.booking_time DESC
  LIMIT 10;
END;
$$;

-- ====================================================================
-- 11. ADMIN VIEW RPC: get_admin_bookings
-- Mengambil semua booking dengan filter lengkap untuk Admin Panel.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_admin_bookings(
  p_branch_id UUID DEFAULT NULL,
  p_booking_date DATE DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_booking_type TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  booking_code TEXT,
  customer_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  branch_id UUID,
  branch_name TEXT,
  booking_date DATE,
  booking_time TEXT,
  queue_number INTEGER,
  formatted_queue TEXT,
  status TEXT,
  booking_type TEXT,
  total_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ,
  services JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Pastikan hanya admin yang bisa memanggil query ini
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat mengakses data ini.';
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.booking_code,
    c.id AS customer_id,
    c.name AS customer_name,
    c.phone AS customer_phone,
    br.id AS branch_id,
    br.name AS branch_name,
    b.booking_date,
    to_char(b.booking_time, 'HH24:MI') AS booking_time,
    b.queue_number,
    (CASE WHEN br.name ILIKE '%grojokan%' THEN 'G' ELSE 'T' END) || '-' || lpad(b.queue_number::text, 3, '0') AS formatted_queue,
    b.status,
    b.booking_type,
    b.total_price,
    b.notes,
    b.created_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object('id', s.id, 'name', s.name, 'price', bs.price)
        )
        FROM public.booking_services bs
        JOIN public.services s ON s.id = bs.service_id
        WHERE bs.booking_id = b.id
      ),
      '[]'::jsonb
    ) AS services
  FROM public.bookings b
  JOIN public.customers c ON c.id = b.customer_id
  JOIN public.branches br ON br.id = b.branch_id
  WHERE (p_branch_id IS NULL OR b.branch_id = p_branch_id)
    AND (p_booking_date IS NULL OR b.booking_date = p_booking_date)
    AND (p_status IS NULL OR b.status = p_status)
    AND (p_booking_type IS NULL OR b.booking_type = p_booking_type)
    AND (
      p_search IS NULL OR
      b.booking_code ILIKE ('%' || p_search || '%') OR
      c.name ILIKE ('%' || p_search || '%') OR
      c.phone ILIKE ('%' || p_search || '%')
    )
  ORDER BY b.booking_date DESC, b.booking_time ASC, b.queue_number ASC;
END;
$$;

-- ====================================================================
-- 12. SEED DATA AWAL (2 Cabang & 5 Layanan)
-- Menggunakan UUID deterministik agar relasi konsisten
-- ====================================================================

-- 2 Cabang Resmi: Grojokan & Tugurejo
INSERT INTO public.branches (
  id,
  name,
  address,
  phone,
  whatsapp,
  opening_time,
  closing_time,
  max_queue_per_hour,
  is_open,
  google_maps_url
) VALUES
  (
    'b1000000-0000-0000-0000-000000000001'::uuid,
    'Grojokan',
    'Grojokan, Kediri, Jawa Timur',
    '081234567890',
    '6281234567890',
    '08:00:00',
    '17:00:00',
    4,
    true,
    'https://maps.app.goo.gl/gF4Q2mw2BbniD77r7'
  ),
  (
    'b2000000-0000-0000-0000-000000000002'::uuid,
    'Tugurejo',
    'Tugurejo, Kediri, Jawa Timur',
    '081234567890',
    '6281234567890',
    '18:30:00',
    '22:00:00',
    4,
    true,
    'https://maps.app.goo.gl/J7bj2fZEDMULgbsq5'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  opening_time = EXCLUDED.opening_time,
  closing_time = EXCLUDED.closing_time,
  google_maps_url = EXCLUDED.google_maps_url,
  is_open = EXCLUDED.is_open;

-- 5 Layanan Resmi Necis Barbershop
INSERT INTO public.services (
  id,
  name,
  description,
  price,
  is_active
) VALUES
  (
    's1000000-0000-0000-0000-000000000001'::uuid,
    'Potong Rambut',
    'Pangkas rambut pria rapi dan presisi oleh Mas Anang. Bebas pilih model apa saja (fade, crop, buzz cut, mullet, dll.) atau bawa foto referensi sendiri.',
    8000.00,
    true
  ),
  (
    's2000000-0000-0000-0000-000000000002'::uuid,
    'Cuci Rambut',
    'Keramas pembersihan rambut setelah dicukur agar segar dan bersih bebas sisa rambut.',
    0.00,
    true
  ),
  (
    's3000000-0000-0000-0000-000000000003'::uuid,
    'Pijat Relaksasi Pundak',
    'Pijat rileks pundak dan leher ringan untuk kenyamanan ekstra setelah potong rambut.',
    0.00,
    true
  ),
  (
    's4000000-0000-0000-0000-000000000004'::uuid,
    'Cukur Kumis/Jenggot',
    'Perapihan kumis dan jenggot dengan razor presisi dan higienis.',
    0.00,
    true
  ),
  (
    's5000000-0000-0000-0000-000000000005'::uuid,
    'Styling Pomade',
    'Penataan rambut dengan pomade atau hair powder profesional agar tampak rapi dan maskulin.',
    0.00,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  is_active = EXCLUDED.is_active;
