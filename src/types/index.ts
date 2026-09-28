export type BookingStatus = 'waiting' | 'serving' | 'completed' | 'cancelled';

export interface BranchConfig {
  id: string; // 'grojokan' | 'tugurejo'
  nomor_cabang: 1 | 2;
  nama_cabang: string; // 'Cabang Grojokan' | 'Cabang Tugurejo'
  kode_antrean: 'G' | 'T';
  label_waktu: string;
  jam_operasional: string;
  jam_buka: string; // "08:00" | "18:30"
  jam_tutup: string; // "17:00" | "22:00"
  maps_url: string;
  alamat_singkat: string;
  keterangan: string;
  is_libur_override?: boolean;
}

export interface ServiceItem {
  id: string;
  nama_layanan: string;
  kategori: 'haircut' | 'grooming' | 'treatment' | 'package';
  deskripsi: string;
  durasi_menit: number;
  harga: number;
  is_active: boolean;
  is_popular?: boolean;
}

export interface BarberProfile {
  id: string;
  nama_barber: string;
  foto_url: string;
  spesialisasi: string;
  pengalaman_tahun: number;
  deskripsi_singkat: string;
  is_active: boolean;
}

export interface OperatingDay {
  id: string;
  hari_dalam_minggu: string;
  jam_buka: string;
  jam_tutup: string;
  is_libur: boolean;
}

export interface BookingRecord {
  id: string;
  booking_code: string; // e.g. "G-001" or "T-001"
  queue_number: string; // e.g. "G-001" or "T-001"
  branch_id: string; // 'grojokan' | 'tugurejo'
  nama_cabang: string; // 'Cabang Grojokan' | 'Cabang Tugurejo'
  customer_name: string;
  customer_phone: string;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:mm
  status: BookingStatus;
  booking_type: 'online' | 'walk-in';
  total_price: number; // 8000
  total_duration: number; // 25
  barber_id: string; // 'barber-anang'
  hairstyle_model?: string;
  has_custom_photo?: boolean;
  notes?: string;
  cancel_reason?: string;
  created_at: string;
  updated_at?: string;

  // Aliases for backward-compatibility with existing components
  kode_booking?: string;
  nama_pelanggan?: string;
  no_whatsapp?: string;
  tanggal_booking?: string;
  jam_mulai?: string;
  status_booking?: BookingStatus | string;
  cabang_id?: string;
  total_harga?: number;
  total_durasi?: number;
  catatan_pelanggan?: string;
  alasan_batal?: string;
  model_rambut_pilihan?: string;
  bawa_foto_sendiri?: boolean;
  is_walkin?: boolean;
  service_ids?: string[];
}

export interface HairstyleModelItem {
  id: string;
  nama_model: string;
  kategori: string;
  gambar_url: string;
  deskripsi: string;
  karakteristik: string;
}

export interface ShopConfig {
  nama_toko: string;
  slogan: string;
  kota: string;
  telepon_whatsapp: string;
  syarat_umur: string;
  cabang: BranchConfig[];
}

export const normalizeBookingStatus = (rawStatus: string | undefined): BookingStatus => {
  if (!rawStatus) return 'waiting';
  const s = rawStatus.toLowerCase().trim();
  if (s === 'serving' || s === 'sedang dicukur' || s === 'sedang_dicukur') return 'serving';
  if (s === 'completed' || s === 'selesai') return 'completed';
  if (s === 'cancelled' || s === 'batal' || s === 'dibatalkan') return 'cancelled';
  return 'waiting'; // default for 'waiting', 'menunggu', 'menunggu konfirmasi', 'dikonfirmasi'
};

export const getStatusLabel = (status: BookingStatus | string): string => {
  const norm = normalizeBookingStatus(status);
  switch (norm) {
    case 'waiting':
      return 'Menunggu';
    case 'serving':
      return 'Sedang Dicukur';
    case 'completed':
      return 'Selesai';
    case 'cancelled':
      return 'Dibatalkan';
  }
};

export const getStatusBadgeClass = (status: BookingStatus | string): string => {
  const norm = normalizeBookingStatus(status);
  switch (norm) {
    case 'waiting':
      return 'text-amber-400 bg-amber-950/40 border border-amber-800/80';
    case 'serving':
      return 'text-sky-300 bg-sky-950/60 border border-sky-600 shadow-[0_0_12px_rgba(56,189,248,0.25)]';
    case 'completed':
      return 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/80';
    case 'cancelled':
      return 'text-rose-400 bg-rose-950/40 border border-rose-900/80';
  }
};
