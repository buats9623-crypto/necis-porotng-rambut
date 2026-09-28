-- ====================================================================
-- SUPABASE SITE IMAGES TABLE SETUP + PANDUAN LOKASI TAMPILAN WEB
-- Project: Necis Barbershop · Mas Anang
-- ====================================================================

-- 1. Buat tabel site_images dengan kolom panduan posisi web
CREATE TABLE IF NOT EXISTS public.site_images (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  keterangan_letak TEXT NOT NULL,
  apa_yang_berubah_di_web TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tambahkan kolom keterangan jika tabel sudah terlanjur dibuat sebelumnya
ALTER TABLE public.site_images ADD COLUMN IF NOT EXISTS keterangan_letak TEXT;
ALTER TABLE public.site_images ADD COLUMN IF NOT EXISTS apa_yang_berubah_di_web TEXT;

-- 2. Dokumentasi / Komentar pada tabel dan kolom (tampil di Supabase Table Editor)
COMMENT ON TABLE public.site_images IS 'Daftar foto dan gambar yang tampil di halaman depan website Necis Barbershop.';
COMMENT ON COLUMN public.site_images.id IS 'Kode unik foto: hero, barber-anang, model-1 s/d model-8';
COMMENT ON COLUMN public.site_images.image_url IS 'URL atau link gambar (JPG/PNG/WebP/Unsplash/Cloudinary) yang akan ditampilkan kepada pengunjung';
COMMENT ON COLUMN public.site_images.keterangan_letak IS 'Penjelasan letak persis foto ini berada di halaman depan website';
COMMENT ON COLUMN public.site_images.apa_yang_berubah_di_web IS 'Penjelasan efek langsung pada website jika kolom image_url pada baris ini Anda ubah';

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan RLS:
-- Semua orang (publik/pengunjung) dapat melihat dan membaca gambar
DROP POLICY IF EXISTS "Public can view site images" ON public.site_images;
CREATE POLICY "Public can view site images"
  ON public.site_images
  FOR SELECT
  TO public
  USING (true);

-- Hanya admin authenticated yang memiliki hak untuk mengubah/mengunggah gambar
DROP POLICY IF EXISTS "Admin can manage site images" ON public.site_images;
CREATE POLICY "Admin can manage site images"
  ON public.site_images
  FOR ALL
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

-- 5. Data Awal Bawaan (Seed Data) Lengkap dengan Keterangan Posisi Web
INSERT INTO public.site_images (id, title, category, image_url, keterangan_letak, apa_yang_berubah_di_web)
VALUES
  (
    'hero',
    'Foto Utama Beranda (Hero Showcase)',
    'hero',
    '/src/assets/images/crop_french_textured_1790487938550.jpg',
    'Halaman paling atas (Hero Banner) sebelah kanan teks "Potong Rambut Rp 8.000 Saja".',
    'Mengganti foto pameran utama yang pertama kali dilihat oleh pengunjung saat baru membuka website.'
  ),
  (
    'barber-anang',
    'Foto Profil Mas Anang (Capster Tunggal)',
    'barber',
    '/src/assets/images/haircut_fade_classic_1790486981801.jpg',
    'Bagian profil "Mengenal Mas Anang (Capster Tunggal & Pemilik Gerai)".',
    'Mengganti foto potret Mas Anang saat memegang gunting/cukur di gerai pangkas rambut.'
  ),
  (
    'model-1',
    'Model 1: Textured Crop / French Crop',
    'hairstyle',
    '/src/assets/images/crop_french_textured_1790487938550.jpg',
    'Galeri Model Rambut (Kotak nomor 1 dari 8 model).',
    'Mengganti foto contoh potongan Textured Crop yang bisa dipilih pelanggan saat reservasi.'
  ),
  (
    'model-2',
    'Model 2: Modern Buzz Cut',
    'hairstyle',
    '/src/assets/images/buzz_cut_modern_1790487953382.jpg',
    'Galeri Model Rambut (Kotak nomor 2 dari 8 model).',
    'Mengganti foto contoh potongan cepak rapi Modern Buzz Cut.'
  ),
  (
    'model-3',
    'Model 3: Crew Cut Klasik',
    'hairstyle',
    '/src/assets/images/buzz_cut_modern_1790487953382.jpg',
    'Galeri Model Rambut (Kotak nomor 3 dari 8 model).',
    'Mengganti foto contoh gaya rambut Crew Cut (gaya klasik rapi).'
  ),
  (
    'model-4',
    'Model 4: Potongan Medium & Bervolume',
    'hairstyle',
    '/src/assets/images/haircut_pompadour_beard_1790486994398.jpg',
    'Galeri Model Rambut (Kotak nomor 4 dari 8 model).',
    'Mengganti foto contoh gaya rambut panjang medium / belah samping bervolume.'
  ),
  (
    'model-5',
    'Model 5: Low Taper Fade',
    'hairstyle',
    '/src/assets/images/haircut_fade_classic_1790486981801.jpg',
    'Galeri Model Rambut (Kotak nomor 5 dari 8 model).',
    'Mengganti foto contoh potongan gradasi halus Low Taper Fade.'
  ),
  (
    'model-6',
    'Model 6: Modern Mullet & Wolf Cut',
    'hairstyle',
    '/src/assets/images/mullet_wolf_cut_1790487970832.jpg',
    'Galeri Model Rambut (Kotak nomor 6 dari 8 model).',
    'Mengganti foto contoh tren potongan Modern Mullet dan Wolf Cut.'
  ),
  (
    'model-7',
    'Model 7: Textured Quiff',
    'hairstyle',
    '/src/assets/images/quiff_warrior_cut_1790487984778.jpg',
    'Galeri Model Rambut (Kotak nomor 7 dari 8 model).',
    'Mengganti foto contoh jambul terangkat bervolume Textured Quiff.'
  ),
  (
    'model-8',
    'Model 8: Warrior Cut',
    'hairstyle',
    '/src/assets/images/warrior_messy_crop_1790488419680.jpg',
    'Galeri Model Rambut (Kotak nomor 8 dari 8 model).',
    'Mengganti foto contoh gaya rambut maskulin Warrior Cut.'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  keterangan_letak = EXCLUDED.keterangan_letak,
  apa_yang_berubah_di_web = EXCLUDED.apa_yang_berubah_di_web;
