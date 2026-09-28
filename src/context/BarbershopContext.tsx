import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BarberProfile,
  BookingRecord,
  BookingStatus,
  BranchConfig,
  HairstyleModelItem,
  OperatingDay,
  ServiceItem,
  ShopConfig,
  normalizeBookingStatus,
} from '../types';
import {
  HAIRSTYLE_MODELS,
  INITIAL_BARBERS,
  INITIAL_BOOKINGS,
  INITIAL_BRANCHES,
  INITIAL_HERO_IMAGE,
  INITIAL_OPERATING_HOURS,
  INITIAL_SERVICES,
  INITIAL_SHOP_CONFIG,
} from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getTodayWIB } from '../lib/branchHours';

export interface NewBookingInput {
  cabang_id: string; // 'grojokan' | 'tugurejo'
  nama_pelanggan: string;
  no_whatsapp: string;
  service_ids?: string[];
  tanggal_booking: string;
  jam_mulai: string;
  model_rambut_pilihan?: string;
  bawa_foto_sendiri?: boolean;
  catatan_pelanggan?: string;
  is_walkin?: boolean;
}

interface BarbershopContextType {
  shopConfig: ShopConfig;
  branches: BranchConfig[];
  services: ServiceItem[];
  barbers: BarberProfile[];
  operatingHours: OperatingDay[];
  bookings: BookingRecord[];
  heroImage: string;
  hairstyleModels: HairstyleModelItem[];
  createBooking: (input: NewBookingInput) => Promise<BookingRecord>;
  updateBookingStatus: (id: string, status: BookingStatus, alasan_batal?: string) => Promise<boolean>;
  rescheduleBooking: (id: string, tanggal_booking: string, jam_mulai: string, cabang_id?: string, alasan?: string) => Promise<boolean>;
  getAvailableSlots: (tanggal: string, cabangId: string) => string[];
  getBookingByCodeOrPhone: (query: string) => BookingRecord[];
  generateWhatsAppUrl: (booking: BookingRecord) => string;
  generateAdminContactUrl: (booking: BookingRecord, type: 'confirm' | 'reminder' | 'cancel') => string;
  // Admin Management actions
  updateService: (service: ServiceItem) => void;
  updateBarber: (barber: BarberProfile) => void;
  updateOperatingHours: (hours: OperatingDay[]) => void;
  resetToDefault: () => void;
  // Missing table detection
  isTableMissingInSupabase: boolean;
  dismissMissingTableWarning: () => void;
  // Image management
  updateHeroImage: (url: string) => Promise<void>;
  updateBarberPhoto: (barberId: string, url: string) => Promise<void>;
  updateHairstyleModelImage: (modelId: string, url: string) => Promise<void>;
  resetImagesToDefault: () => Promise<void>;
}

const BarbershopContext = createContext<BarbershopContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SERVICES: 'necis_services_v2',
  BARBERS: 'necis_barbers_v2',
  HOURS: 'necis_hours_v2',
  BOOKINGS: 'necis_bookings_v3',
  HERO_IMAGE: 'necis_hero_img_v2',
  HAIRSTYLES: 'necis_hairstyles_v2',
};

// Helper: Map Supabase DB Row to BookingRecord (with full compatibility aliases)
const mapDbToBookingRecord = (row: any): BookingRecord => {
  const normStatus = normalizeBookingStatus(row.status);
  let branchId = row.branch_id || 'grojokan';
  if (branchId === 'cabang-2') branchId = 'grojokan';
  if (branchId === 'cabang-1') branchId = 'tugurejo';

  const branchName =
    row.nama_cabang || (branchId === 'grojokan' ? 'Cabang Grojokan' : 'Cabang Tugurejo');

  const queueNumber = row.queue_number || row.booking_code || 'G-001';
  const bookingCode = row.booking_code || queueNumber;
  const customerName = row.customer_name || row.nama_pelanggan || 'Pelanggan';
  const customerPhone = row.customer_phone || row.no_whatsapp || '';
  const bookingDate = row.booking_date || row.tanggal_booking || getTodayWIB();
  const bookingTime = row.booking_time || row.jam_mulai || '10:00';
  const bookingType = row.booking_type || (row.is_walkin ? 'walk-in' : 'online');
  const totalPrice = Number(row.total_price || row.total_harga || 8000);
  const totalDuration = Number(row.total_duration || row.total_durasi || 25);
  const notes = row.notes || row.catatan_pelanggan || '';
  const cancelReason = row.cancel_reason || row.alasan_batal || '';
  const hairstyleModel =
    row.hairstyle_model || row.model_rambut_pilihan || 'Textured Crop / French Crop';
  const hasCustomPhoto = !!(row.has_custom_photo || row.bawa_foto_sendiri);

  return {
    id: String(row.id),
    booking_code: bookingCode,
    queue_number: queueNumber,
    branch_id: branchId,
    nama_cabang: branchName,
    customer_name: customerName,
    customer_phone: customerPhone,
    booking_date: bookingDate,
    booking_time: bookingTime,
    status: normStatus,
    booking_type: bookingType,
    total_price: totalPrice,
    total_duration: totalDuration,
    barber_id: row.barber_id || 'barber-anang',
    hairstyle_model: hairstyleModel,
    has_custom_photo: hasCustomPhoto,
    notes,
    cancel_reason: cancelReason,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at,

    // Aliases
    kode_booking: bookingCode,
    nama_pelanggan: customerName,
    no_whatsapp: customerPhone,
    tanggal_booking: bookingDate,
    jam_mulai: bookingTime,
    status_booking: normStatus,
    cabang_id: branchId,
    total_harga: totalPrice,
    total_durasi: totalDuration,
    catatan_pelanggan: notes,
    alasan_batal: cancelReason,
    model_rambut_pilihan: hairstyleModel,
    bawa_foto_sendiri: hasCustomPhoto,
    is_walkin: bookingType === 'walk-in',
    service_ids: ['svc-potong-rambut'],
  };
};

export const BarbershopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shopConfig] = useState<ShopConfig>(INITIAL_SHOP_CONFIG);
  const branches = INITIAL_BRANCHES;

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [barbers, setBarbers] = useState<BarberProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BARBERS);
    return saved ? JSON.parse(saved) : INITIAL_BARBERS;
  });

  const [operatingHours, setOperatingHours] = useState<OperatingDay[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HOURS);
    return saved ? JSON.parse(saved) : INITIAL_OPERATING_HOURS;
  });

  const [bookings, setBookings] = useState<BookingRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(mapDbToBookingRecord);
        }
      } catch {
        // Fallback to initial
      }
    }
    return INITIAL_BOOKINGS.map(mapDbToBookingRecord);
  });

  const [heroImage, setHeroImage] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.HERO_IMAGE) || INITIAL_HERO_IMAGE;
  });

  const [hairstyleModels, setHairstyleModels] = useState<HairstyleModelItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HAIRSTYLES);
    return saved ? JSON.parse(saved) : HAIRSTYLE_MODELS;
  });

  const [isTableMissingInSupabase, setIsTableMissingInSupabase] = useState<boolean>(false);
  const dismissMissingTableWarning = () => setIsTableMissingInSupabase(false);

  // 1. SUPABASE INITIAL FETCH + REALTIME SUBSCRIPTION FOR BOOKINGS
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isSubscribed = true;

    // A. Initial fetch from database
    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('booking_date', { ascending: false })
          .order('booking_time', { ascending: true });

        if (error) {
          console.warn('Notice: Supabase bookings query returned:', error.message);
          if (
            error.message?.includes('schema cache') ||
            error.code === 'PGRST205' ||
            error.message?.includes('does not exist')
          ) {
            setIsTableMissingInSupabase(true);
          }
          return;
        }

        if (data && data.length > 0 && isSubscribed) {
          setIsTableMissingInSupabase(false);
          const mapped = data.map(mapDbToBookingRecord);
          setBookings(mapped);
          localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(mapped));
        }
      } catch (err) {
        console.warn('Initial bookings fetch error:', err);
      }
    };

    fetchBookings();

    // B. Realtime subscription: Listen for INSERT, UPDATE, DELETE on bookings table
    const bookingsChannel = supabase
      .channel('necis_bookings_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          if (!isSubscribed) return;

          if (payload.eventType === 'INSERT') {
            const newRecord = mapDbToBookingRecord(payload.new);
            setBookings((prev) => {
              // Anti duplication: do not append if ID or booking_code already exists
              if (prev.some((b) => b.id === newRecord.id || b.booking_code === newRecord.booking_code)) {
                return prev.map((b) => (b.id === newRecord.id ? newRecord : b));
              }
              return [newRecord, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = mapDbToBookingRecord(payload.new);
            setBookings((prev) =>
              prev.map((b) => (b.id === updatedRecord.id ? updatedRecord : b))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setBookings((prev) => prev.filter((b) => b.id !== String(deletedId)));
            }
          }
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(bookingsChannel);
    };
  }, []);

  // 2. Sinkronisasi dengan Supabase site_images
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const fetchSupabaseImages = async () => {
      try {
        const { data, error } = await supabase.from('site_images').select('*');
        if (error || !data || data.length === 0) return;

        data.forEach((item: { id: string; image_url: string }) => {
          if (item.id === 'hero' && item.image_url) {
            setHeroImage(item.image_url);
            localStorage.setItem(STORAGE_KEYS.HERO_IMAGE, item.image_url);
          } else if (item.id === 'barber-anang' && item.image_url) {
            setBarbers((prev) =>
              prev.map((b) => (b.id === 'barber-anang' ? { ...b, foto_url: item.image_url } : b))
            );
          } else if (item.id.startsWith('model-') && item.image_url) {
            setHairstyleModels((prev) =>
              prev.map((m) => (m.id === item.id ? { ...m, gambar_url: item.image_url } : m))
            );
          }
        });
      } catch (err) {
        console.warn('Could not sync site images from Supabase:', err);
      }
    };

    fetchSupabaseImages();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(barbers));
  }, [barbers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOURS, JSON.stringify(operatingHours));
  }, [operatingHours]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HERO_IMAGE, heroImage);
  }, [heroImage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HAIRSTYLES, JSON.stringify(hairstyleModels));
  }, [hairstyleModels]);

  // Image updates
  const updateHeroImage = async (url: string) => {
    setHeroImage(url);
    localStorage.setItem(STORAGE_KEYS.HERO_IMAGE, url);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('site_images').upsert({
          id: 'hero',
          title: 'Foto Utama Beranda (Hero Showcase)',
          category: 'hero',
          image_url: url,
          keterangan_letak: 'Halaman paling atas (Hero Banner) sebelah kanan teks "Potong Rambut Rp 8.000 Saja".',
          apa_yang_berubah_di_web: 'Mengganti foto pameran utama yang pertama kali dilihat oleh pengunjung saat baru membuka website.',
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Error saving hero image to Supabase:', e);
      }
    }
  };

  const updateBarberPhoto = async (barberId: string, url: string) => {
    setBarbers((prev) => prev.map((b) => (b.id === barberId ? { ...b, foto_url: url } : b)));
    if (isSupabaseConfigured) {
      try {
        await supabase.from('site_images').upsert({
          id: barberId,
          title: 'Foto Profil Mas Anang (Capster Tunggal)',
          category: 'barber',
          image_url: url,
          keterangan_letak: 'Bagian profil "Mengenal Mas Anang (Capster Tunggal & Pemilik Gerai)".',
          apa_yang_berubah_di_web: 'Mengganti foto potret Mas Anang saat memegang gunting/cukur di gerai pangkas rambut.',
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Error saving barber photo to Supabase:', e);
      }
    }
  };

  const updateHairstyleModelImage = async (modelId: string, url: string) => {
    const targetModel = hairstyleModels.find((m) => m.id === modelId);
    setHairstyleModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, gambar_url: url } : m))
    );
    if (isSupabaseConfigured) {
      try {
        await supabase.from('site_images').upsert({
          id: modelId,
          title: targetModel ? targetModel.nama_model : 'Model Rambut ' + modelId,
          category: 'hairstyle',
          image_url: url,
          keterangan_letak: `Galeri Model Rambut (${targetModel?.nama_model || modelId}).`,
          apa_yang_berubah_di_web: `Mengganti foto contoh gaya rambut ${targetModel?.nama_model || modelId} yang dilihat pelanggan saat reservasi.`,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Error saving hairstyle model image to Supabase:', e);
      }
    }
  };

  const resetImagesToDefault = async () => {
    setHeroImage(INITIAL_HERO_IMAGE);
    setBarbers(INITIAL_BARBERS);
    setHairstyleModels(HAIRSTYLE_MODELS);
    localStorage.removeItem(STORAGE_KEYS.HERO_IMAGE);
    localStorage.removeItem(STORAGE_KEYS.HAIRSTYLES);
    localStorage.removeItem(STORAGE_KEYS.BARBERS);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('site_images').delete().neq('id', 'keep_all');
      } catch (e) {
        console.warn('Error deleting images from Supabase:', e);
      }
    }
  };

  // 3. GENERATE QUEUE NUMBER (Permanent, Consistent, No-Renumbering)
  // Grojokan: G-001, G-002, G-003...
  // Tugurejo: T-001, T-002, T-003...
  const generateQueueNumber = (branchId: string, bookingDate: string): string => {
    const normBranch =
      branchId === 'tugurejo' || branchId === 'cabang-1' ? 'tugurejo' : 'grojokan';
    const prefix = normBranch === 'grojokan' ? 'G' : 'T';

    // Periksa semua booking pada tanggal & cabang ini (termasuk yang selesai/batal agar nomor tidak bentrok)
    const existing = bookings.filter((b) => {
      const bDate = b.booking_date || b.tanggal_booking;
      const bBranch = b.branch_id || b.cabang_id;
      const bBranchNorm = bBranch === 'tugurejo' || bBranch === 'cabang-1' ? 'tugurejo' : 'grojokan';
      return bDate === bookingDate && bBranchNorm === normBranch;
    });

    let maxIndex = 0;
    existing.forEach((b) => {
      const qCode = b.queue_number || b.booking_code || '';
      const match = qCode.match(/[GgTt]-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxIndex) maxIndex = num;
      }
    });

    const nextIndex = maxIndex + 1;
    return `${prefix}-${String(nextIndex).padStart(3, '0')}`;
  };

  // 4. CREATE BOOKING (Online / Walk-In)
  const createBooking = async (input: NewBookingInput): Promise<BookingRecord> => {
    let normBranchId = input.cabang_id;
    if (normBranchId === 'cabang-2') normBranchId = 'grojokan';
    if (normBranchId === 'cabang-1') normBranchId = 'tugurejo';

    const branch =
      branches.find((b) => b.id === normBranchId) ||
      (normBranchId === 'tugurejo' ? branches[1] : branches[0]);

    const activeService = services[0] || INITIAL_SERVICES[0];
    const total_harga = activeService.harga; // Rp 8.000
    const total_durasi = activeService.durasi_menit; // 25 min

    const queue_number = generateQueueNumber(normBranchId, input.tanggal_booking);
    const booking_code = queue_number; // e.g. "G-001"
    const bookingId = 'book-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const newBooking: BookingRecord = {
      id: bookingId,
      booking_code,
      queue_number,
      branch_id: branch.id,
      nama_cabang: branch.nama_cabang,
      customer_name: input.nama_pelanggan.trim(),
      customer_phone: input.no_whatsapp.trim(),
      booking_date: input.tanggal_booking,
      booking_time: input.jam_mulai,
      status: 'waiting', // Alur awal selalu 'waiting' (Menunggu)
      booking_type: input.is_walkin ? 'walk-in' : 'online',
      total_price: total_harga,
      total_duration: total_durasi,
      barber_id: 'barber-anang',
      hairstyle_model: input.model_rambut_pilihan || 'Textured Crop / French Crop',
      has_custom_photo: !!input.bawa_foto_sendiri,
      notes: input.catatan_pelanggan?.trim() || '',
      created_at: new Date().toISOString(),

      // Aliases
      kode_booking: booking_code,
      nama_pelanggan: input.nama_pelanggan.trim(),
      no_whatsapp: input.no_whatsapp.trim(),
      tanggal_booking: input.tanggal_booking,
      jam_mulai: input.jam_mulai,
      status_booking: 'waiting',
      cabang_id: branch.id,
      total_harga,
      total_durasi,
      catatan_pelanggan: input.catatan_pelanggan?.trim() || '',
      model_rambut_pilihan: input.model_rambut_pilihan || 'Textured Crop / French Crop',
      bawa_foto_sendiri: !!input.bawa_foto_sendiri,
      is_walkin: !!input.is_walkin,
      service_ids: [activeService.id],
    };

    // Update state secara aman (anti duplicate)
    setBookings((prev) => [newBooking, ...prev.filter((b) => b.id !== newBooking.id)]);

    // Simpan ke Supabase jika terhubung
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('bookings').insert({
          id: newBooking.id,
          booking_code: newBooking.booking_code,
          queue_number: newBooking.queue_number,
          branch_id: newBooking.branch_id,
          nama_cabang: newBooking.nama_cabang,
          customer_name: newBooking.customer_name,
          customer_phone: newBooking.customer_phone,
          booking_date: newBooking.booking_date,
          booking_time: newBooking.booking_time,
          status: newBooking.status,
          booking_type: newBooking.booking_type,
          total_price: newBooking.total_price,
          total_duration: newBooking.total_duration,
          barber_id: newBooking.barber_id,
          hairstyle_model: newBooking.hairstyle_model,
          has_custom_photo: newBooking.has_custom_photo,
          notes: newBooking.notes,
          created_at: newBooking.created_at,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          if (
            error.message?.includes('schema cache') ||
            error.code === 'PGRST205' ||
            error.message?.includes('does not exist')
          ) {
            setIsTableMissingInSupabase(true);
          } else {
            console.warn('Supabase booking insert warning:', error.message);
          }
        }
      } catch (err) {
        console.warn('Failed to insert booking to Supabase:', err);
      }
    }

    return newBooking;
  };

  // 5. UPDATE BOOKING STATUS (Mulai Cukur, Selesai, Batalkan)
  // PENTING: Status 'completed' TIDAK DIHAPUS dari database.
  // Hanya kolom status yang di-UPDATE menjadi 'completed'.
  const updateBookingStatus = async (
    id: string,
    status: BookingStatus,
    alasan_batal?: string
  ): Promise<boolean> => {
    const targetBooking = bookings.find((b) => b.id === id);
    if (!targetBooking) return false;

    const previousStatus = targetBooking.status;
    const nowIso = new Date().toISOString();

    // 1. Simpan perubahan ke Supabase
    if (isSupabaseConfigured) {
      try {
        const updatePayload: Record<string, any> = {
          status,
          updated_at: nowIso,
        };
        if (status === 'cancelled') {
          updatePayload.cancel_reason = alasan_batal || 'Dibatalkan oleh pengelola gerai';
        }

        const { error } = await supabase
          .from('bookings')
          .update(updatePayload)
          .eq('id', id);

        if (error) {
          if (
            error.message?.includes('schema cache') ||
            error.code === 'PGRST205' ||
            error.message?.includes('does not exist')
          ) {
            // Tabel belum dibuat di remote Supabase: tandai status ini agar banner panduan tampil di AdminPanel,
            // tetapi JANGAN hentikan alur UI atau munculkan popup alert yang mengganggu.
            setIsTableMissingInSupabase(true);
            console.warn('Supabase table bookings belum ada di remote schema cache. Status disimpan di memori browser lokal.');
          } else {
            console.warn('Database update error notice:', error.message);
          }
        } else {
          setIsTableMissingInSupabase(false);
        }
      } catch (err: any) {
        console.warn('Notice updating booking status in Supabase:', err);
      }
    }

    // 2. Update state lokal dan localStorage (selalu berjalan lancar sehingga UI langsung responsif)
    // ID row tetap sama, tidak ada pembuatan row baru (Anti Duplikasi).
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          return {
            ...b,
            status,
            status_booking: status,
            cancel_reason: status === 'cancelled' ? alasan_batal || 'Dibatalkan' : undefined,
            alasan_batal: status === 'cancelled' ? alasan_batal || 'Dibatalkan' : undefined,
            updated_at: nowIso,
          };
        }
        return b;
      })
    );

    return true;
  };

  // 6. RESCHEDULE BOOKING
  const rescheduleBooking = async (
    id: string,
    tanggal: string,
    jam: string,
    cabang_id?: string,
    alasan?: string
  ): Promise<boolean> => {
    let normBranchId = cabang_id;
    if (normBranchId === 'cabang-2') normBranchId = 'grojokan';
    if (normBranchId === 'cabang-1') normBranchId = 'tugurejo';

    const branch = normBranchId
      ? branches.find((br) => br.id === normBranchId)
      : undefined;

    const nowIso = new Date().toISOString();

    if (isSupabaseConfigured) {
      try {
        const updatePayload: Record<string, any> = {
          booking_date: tanggal,
          booking_time: jam,
          updated_at: nowIso,
        };
        if (branch) {
          updatePayload.branch_id = branch.id;
          updatePayload.nama_cabang = branch.nama_cabang;
        }
        if (alasan) {
          updatePayload.notes = alasan;
        }

        const { error } = await supabase
          .from('bookings')
          .update(updatePayload)
          .eq('id', id);

        if (error) {
          if (
            error.message?.includes('schema cache') ||
            error.code === 'PGRST205' ||
            error.message?.includes('does not exist')
          ) {
            setIsTableMissingInSupabase(true);
          } else {
            console.warn('Reschedule database warning:', error.message);
          }
        } else {
          setIsTableMissingInSupabase(false);
        }
      } catch (err: any) {
        console.warn('Reschedule warning:', err);
      }
    }

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          return {
            ...b,
            booking_date: tanggal,
            booking_time: jam,
            tanggal_booking: tanggal,
            jam_mulai: jam,
            branch_id: branch ? branch.id : b.branch_id,
            cabang_id: branch ? branch.id : b.cabang_id,
            nama_cabang: branch ? branch.nama_cabang : b.nama_cabang,
            notes: b.notes + (alasan ? ` [Pindah Jadwal: ${alasan}]` : ''),
            catatan_pelanggan: (b.notes || '') + (alasan ? ` [Pindah Jadwal: ${alasan}]` : ''),
            updated_at: nowIso,
          };
        }
        return b;
      })
    );

    return true;
  };

  // 7. GET AVAILABLE SLOTS FOR BOOKING
  // Slot dianggap penuh jika terdapat booking pada jam tersebut dengan status BUKAN cancelled
  const getAvailableSlots = (tanggal: string, cabangId: string): string[] => {
    if (!tanggal) return [];

    let normBranchId = cabangId;
    if (normBranchId === 'cabang-2') normBranchId = 'grojokan';
    if (normBranchId === 'cabang-1') normBranchId = 'tugurejo';

    // Grojokan: Pagi - Sore (08.00 - 17.00 WIB)
    const SLOTS_GROJOKAN = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '13:00', '13:30', '14:00', '14:30', '15:00',
      '15:30', '16:00', '16:30',
    ];

    // Tugurejo: Malam (18.30 - 22.00 WIB)
    const SLOTS_TUGUREJO = [
      '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    ];

    const slotsForBranch = normBranchId === 'tugurejo' ? SLOTS_TUGUREJO : SLOTS_GROJOKAN;

    const bookedOnDate = bookings.filter((b) => {
      const bDate = b.booking_date || b.tanggal_booking;
      const bBranch = b.branch_id || b.cabang_id;
      const bBranchNorm = bBranch === 'tugurejo' || bBranch === 'cabang-1' ? 'tugurejo' : 'grojokan';
      return bDate === tanggal && bBranchNorm === normBranchId && b.status !== 'cancelled';
    });

    return slotsForBranch.filter((slot) => {
      const isSlotBooked = bookedOnDate.some(
        (b) => (b.booking_time || b.jam_mulai) === slot
      );
      return !isSlotBooked;
    });
  };

  // 8. LOOKUP BOOKING BY CODE, QUEUE NUMBER, OR PHONE
  const getBookingByCodeOrPhone = (query: string): BookingRecord[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return bookings.filter(
      (b) =>
        (b.queue_number && b.queue_number.toLowerCase().includes(q)) ||
        (b.booking_code && b.booking_code.toLowerCase().includes(q)) ||
        (b.customer_phone && b.customer_phone.toLowerCase().includes(q)) ||
        (b.customer_name && b.customer_name.toLowerCase().includes(q))
    );
  };

  // 9. WHATSAPP CONFIRMATION URL FOR CUSTOMER
  const generateWhatsAppUrl = (booking: BookingRecord): string => {
    let normBranchId = booking.branch_id || booking.cabang_id || 'grojokan';
    if (normBranchId === 'cabang-2') normBranchId = 'grojokan';
    if (normBranchId === 'cabang-1') normBranchId = 'tugurejo';

    const branch =
      branches.find((br) => br.id === normBranchId) ||
      (normBranchId === 'tugurejo' ? branches[1] : branches[0]);

    const modelInfo = booking.has_custom_photo
      ? 'Bawa Foto Referensi Sendiri (Ditunjukkan saat tiba)'
      : booking.hairstyle_model || 'Potong Rambut Presisi';

    const text = `Halo Mas Anang (Necis Barbershop),\nSaya ingin mengonfirmasi reservasi potong rambut via website:\n\n• *Nomor Antrean:* ${booking.queue_number}\n• *Kode Booking:* ${booking.booking_code}\n• *Nama:* ${booking.customer_name}\n• *Nomor WhatsApp:* ${booking.customer_phone}\n• *Cabang:* ${branch.nama_cabang}\n• *Maps Cabang:* ${branch.maps_url}\n• *Jadwal:* ${booking.booking_date} pukul ${booking.booking_time} WIB\n• *Layanan:* Potong Rambut\n• *Model Rambut:* ${modelInfo}\n• *Tarif:* Rp ${booking.total_price.toLocaleString('id-ID')} (Bayar di tempat)\n• *Syarat Usia:* Pelanggan berusia di atas 5 tahun\n${booking.notes ? `• *Catatan:* ${booking.notes}\n` : ''}\nMohon konfirmasinya Mas Anang. Terima kasih!`;

    const encoded = encodeURIComponent(text);
    return `https://wa.me/${shopConfig.telepon_whatsapp}?text=${encoded}`;
  };

  // 10. WHATSAPP CONTACT URL FOR ADMIN (Mas Anang)
  const generateAdminContactUrl = (
    booking: BookingRecord,
    type: 'confirm' | 'reminder' | 'cancel'
  ): string => {
    const rawPhone = booking.customer_phone || booking.no_whatsapp || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    let normBranchId = booking.branch_id || booking.cabang_id || 'grojokan';
    if (normBranchId === 'cabang-2') normBranchId = 'grojokan';
    if (normBranchId === 'cabang-1') normBranchId = 'tugurejo';

    const branch =
      branches.find((br) => br.id === normBranchId) ||
      (normBranchId === 'tugurejo' ? branches[1] : branches[0]);

    let msg = '';
    if (type === 'confirm') {
      msg = `Halo Mas ${booking.customer_name}, reservasi potong rambut Anda di Necis Barbershop (Antrean: *${booking.queue_number}*) untuk tanggal *${booking.booking_date}* jam *${booking.booking_time} WIB* di *${branch.nama_cabang}* bersama Mas Anang telah siap dilayani.\n\nAlamat Maps: ${branch.maps_url}\nTarif: Rp 8.000.\nCatatan: Kami tidak melayani anak di bawah umur 5 tahun. Harap hadir tepat waktu ya Mas, terima kasih!`;
    } else if (type === 'reminder') {
      msg = `Halo Mas ${booking.customer_name}, ini pengingat antrean *${booking.queue_number}* dari Mas Anang (Necis Barbershop) untuk jadwal potong rambut hari ini jam *${booking.booking_time} WIB* di ${branch.nama_cabang}. Sampai bertemu di gerai!`;
    } else {
      msg = `Halo Mas ${booking.customer_name}, mohon maaf antrean potong rambut (${booking.queue_number}) di ${branch.nama_cabang} perlu diatur ulang karena: ${booking.cancel_reason || 'kendala teknis operasional'}. Apakah berkenan pindah jam/hari lain?`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const updateService = (svc: ServiceItem) => {
    setServices((prev) => prev.map((item) => (item.id === svc.id ? svc : item)));
  };

  const updateBarber = (barber: BarberProfile) => {
    setBarbers((prev) => prev.map((item) => (item.id === barber.id ? barber : item)));
  };

  const updateOperatingHours = (hours: OperatingDay[]) => {
    setOperatingHours(hours);
  };

  const resetToDefault = () => {
    setServices(INITIAL_SERVICES);
    setBarbers(INITIAL_BARBERS);
    setOperatingHours(INITIAL_OPERATING_HOURS);
    setBookings(INITIAL_BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.SERVICES);
    localStorage.removeItem(STORAGE_KEYS.BARBERS);
    localStorage.removeItem(STORAGE_KEYS.HOURS);
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
  };

  return (
    <BarbershopContext.Provider
      value={{
        shopConfig,
        branches,
        services,
        barbers,
        operatingHours,
        bookings,
        createBooking,
        updateBookingStatus,
        rescheduleBooking,
        getAvailableSlots,
        getBookingByCodeOrPhone,
        generateWhatsAppUrl,
        generateAdminContactUrl,
        updateService,
        updateBarber,
        updateOperatingHours,
        resetToDefault,
        isTableMissingInSupabase,
        dismissMissingTableWarning,
        heroImage,
        hairstyleModels,
        updateHeroImage,
        updateBarberPhoto,
        updateHairstyleModelImage,
        resetImagesToDefault,
      }}
    >
      {children}
    </BarbershopContext.Provider>
  );
};

export const useBarbershop = (): BarbershopContextType => {
  const context = useContext(BarbershopContext);
  if (!context) {
    throw new Error('useBarbershop must be used within a BarbershopProvider');
  }
  return context;
};
