import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbBooking, DbBookingStatus, DbBranch, DbService } from '../types';
import { INITIAL_BRANCHES, INITIAL_SERVICES } from '../data/initialData';

export interface CreateBookingPayload {
  branch_id: string;
  customer_name: string;
  customer_phone: string;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:mm
  service_ids: string[];
  booking_type?: 'online' | 'walk_in';
  notes?: string;
}

export interface AdminBookingFilters {
  branch_id?: string;
  booking_date?: string;
  status?: string;
  booking_type?: string;
  search?: string;
}

/**
 * Mengambil daftar cabang dari database Supabase
 */
export async function getBranches(): Promise<DbBranch[]> {
  if (!isSupabaseConfigured) {
    return INITIAL_BRANCHES;
  }

  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('Gagal memuat branches dari Supabase, menggunakan default:', error?.message);
      return INITIAL_BRANCHES;
    }

    return data.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      phone: b.phone,
      whatsapp: b.whatsapp,
      opening_time: b.opening_time,
      closing_time: b.closing_time,
      max_queue_per_hour: b.max_queue_per_hour,
      is_open: b.is_open,
      google_maps_url: b.google_maps_url,
      created_at: b.created_at,
      updated_at: b.updated_at,
    }));
  } catch (err) {
    console.error('Error fetching branches:', err);
    return INITIAL_BRANCHES;
  }
}

/**
 * Mengambil daftar layanan dari database Supabase
 */
export async function getServices(): Promise<DbService[]> {
  if (!isSupabaseConfigured) {
    return INITIAL_SERVICES;
  }

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('price', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn('Gagal memuat services dari Supabase, menggunakan default:', error?.message);
      return INITIAL_SERVICES;
    }

    return data.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: Number(s.price),
      is_active: s.is_active,
      created_at: s.created_at,
      updated_at: s.updated_at,
    }));
  } catch (err) {
    console.error('Error fetching services:', err);
    return INITIAL_SERVICES;
  }
}

/**
 * Memanggil PostgreSQL Atomic RPC create_booking di Supabase
 */
export async function submitBookingToSupabase(payload: CreateBookingPayload): Promise<DbBooking> {
  if (!isSupabaseConfigured) {
    throw new Error('Konfigurasi Supabase belum terpasang di .env.');
  }

  // Panggil RPC create_booking
  const { data, error } = await supabase.rpc('create_booking', {
    p_branch_id: payload.branch_id,
    p_customer_name: payload.customer_name,
    p_customer_phone: payload.customer_phone,
    p_booking_date: payload.booking_date,
    p_booking_time: payload.booking_time,
    p_service_ids: payload.service_ids,
    p_booking_type: payload.booking_type || 'online',
    p_notes: payload.notes || null,
  });

  if (error) {
    console.error('Supabase RPC create_booking error:', error);
    // Terjemahkan pesan kesalahan SQL ke bahasa Indonesia yang ramah
    const msg = error.message || '';
    if (msg.includes('Kuota antrean pada jam')) {
      throw new Error(msg);
    }
    if (msg.includes('di luar jam operasional')) {
      throw new Error(msg);
    }
    if (msg.includes('sedang tidak beroperasi')) {
      throw new Error(msg);
    }
    if (msg.includes('Nomor telepon/WhatsApp tidak valid')) {
      throw new Error('Nomor WhatsApp tidak valid (minimal 10 digit).');
    }
    if (msg.includes('Pilih minimal satu layanan')) {
      throw new Error('Silakan pilih minimal satu layanan potong rambut.');
    }
    throw new Error(msg || 'Gagal memproses booking ke sistem database. Silakan coba beberapa saat lagi.');
  }

  if (!data) {
    throw new Error('Tidak ada data respons yang diterima dari server database.');
  }

  return {
    id: data.id,
    booking_code: data.booking_code,
    customer_id: data.customer_id || '',
    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    branch_id: data.branch_id,
    branch_name: data.branch_name,
    booking_date: data.booking_date,
    booking_time: data.booking_time,
    queue_number: data.queue_number,
    formatted_queue: data.formatted_queue,
    status: data.status,
    booking_type: data.booking_type,
    total_price: Number(data.total_price),
    notes: data.notes,
    created_at: data.created_at,
  };
}

/**
 * Mencari status booking pelanggan melalui RPC get_booking_status
 */
export async function searchBookingStatus(searchQuery: string): Promise<DbBooking[]> {
  if (!isSupabaseConfigured || !searchQuery.trim()) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('get_booking_status', {
      p_search_query: searchQuery.trim(),
    });

    if (error) {
      console.error('Error in searchBookingStatus RPC:', error);
      return [];
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((b) => ({
      id: b.id,
      booking_code: b.booking_code,
      customer_id: '',
      customer_name: b.customer_name,
      customer_phone: b.customer_phone,
      branch_id: '',
      branch_name: b.branch_name,
      booking_date: b.booking_date,
      booking_time: b.booking_time,
      queue_number: b.queue_number,
      formatted_queue: b.formatted_queue,
      status: b.status,
      booking_type: b.booking_type,
      total_price: Number(b.total_price),
      notes: b.notes,
      created_at: b.created_at || new Date().toISOString(),
      services: b.services,
    }));
  } catch (err) {
    console.error('Exception searching booking status:', err);
    return [];
  }
}

/**
 * Mengambil daftar booking untuk Admin Panel via get_admin_bookings RPC
 */
export async function getAdminBookings(filters: AdminBookingFilters = {}): Promise<DbBooking[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('get_admin_bookings', {
      p_branch_id: filters.branch_id && filters.branch_id !== 'all' ? filters.branch_id : null,
      p_booking_date: filters.booking_date || null,
      p_status: filters.status && filters.status !== 'all' ? filters.status : null,
      p_booking_type: filters.booking_type && filters.booking_type !== 'all' ? filters.booking_type : null,
      p_search: filters.search && filters.search.trim() ? filters.search.trim() : null,
    });

    if (error) {
      console.warn('RPC get_admin_bookings error, falling back to direct table query:', error.message);
      // Fallback: direct table query if RPC is not yet created
      let query = supabase
        .from('bookings')
        .select(`
          id,
          booking_code,
          customer_id,
          branch_id,
          booking_date,
          booking_time,
          queue_number,
          status,
          booking_type,
          total_price,
          notes,
          created_at,
          customers ( name, phone ),
          branches ( name ),
          booking_services ( service_id, price, services ( name ) )
        `)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: true });

      if (filters.branch_id && filters.branch_id !== 'all') {
        query = query.eq('branch_id', filters.branch_id);
      }
      if (filters.booking_date) {
        query = query.eq('booking_date', filters.booking_date);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.booking_type && filters.booking_type !== 'all') {
        query = query.eq('booking_type', filters.booking_type);
      }

      const directRes = await query;
      if (directRes.error || !directRes.data) {
        console.error('Direct bookings query failed:', directRes.error);
        return [];
      }

      return directRes.data.map((row: any) => {
        const branchName = row.branches?.name || 'Cabang';
        const prefix = branchName.toLowerCase().includes('grojokan') ? 'G' : 'T';
        return {
          id: row.id,
          booking_code: row.booking_code,
          customer_id: row.customer_id,
          customer_name: row.customers?.name || 'Pelanggan',
          customer_phone: row.customers?.phone || '-',
          branch_id: row.branch_id,
          branch_name: branchName,
          booking_date: row.booking_date,
          booking_time: row.booking_time ? row.booking_time.slice(0, 5) : '00:00',
          queue_number: row.queue_number,
          formatted_queue: `${prefix}-${String(row.queue_number).padStart(3, '0')}`,
          status: row.status,
          booking_type: row.booking_type,
          total_price: Number(row.total_price),
          notes: row.notes,
          created_at: row.created_at,
          services: row.booking_services?.map((bs: any) => ({
            id: bs.service_id,
            name: bs.services?.name || 'Layanan',
            price: Number(bs.price),
          })),
        };
      });
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((b) => ({
      id: b.id,
      booking_code: b.booking_code,
      customer_id: b.customer_id,
      customer_name: b.customer_name,
      customer_phone: b.customer_phone,
      branch_id: b.branch_id,
      branch_name: b.branch_name,
      booking_date: b.booking_date,
      booking_time: b.booking_time,
      queue_number: b.queue_number,
      formatted_queue: b.formatted_queue,
      status: b.status,
      booking_type: b.booking_type,
      total_price: Number(b.total_price),
      notes: b.notes,
      created_at: b.created_at,
      services: b.services,
    }));
  } catch (err) {
    console.error('Exception fetching admin bookings:', err);
    return [];
  }
}

/**
 * Mengubah status booking di database Supabase (waiting -> serving -> completed -> cancelled)
 */
export async function updateBookingStatus(
  bookingId: string,
  newStatus: DbBookingStatus,
  notes?: string
): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }

  const payload: Record<string, any> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (notes) {
    payload.notes = notes;
  }

  const { error } = await supabase
    .from('bookings')
    .update(payload)
    .eq('id', bookingId);

  if (error) {
    console.error('Gagal update status booking:', error);
    throw new Error('Gagal memperbarui status reservasi di database.');
  }
}

/**
 * Mengubah harga layanan oleh Admin
 */
export async function updateServicePrice(serviceId: string, newPrice: number): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }

  const { error } = await supabase
    .from('services')
    .update({ price: newPrice, updated_at: new Date().toISOString() })
    .eq('id', serviceId);

  if (error) {
    console.error('Gagal update tarif layanan:', error);
    throw new Error('Gagal memperbarui tarif layanan di database.');
  }
}
