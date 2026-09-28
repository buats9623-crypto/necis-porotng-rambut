import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBarbershop } from '../context/BarbershopContext';
import {
  BookingRecord,
  BookingStatus,
  ServiceItem,
  BarberProfile,
  normalizeBookingStatus,
  getStatusLabel,
  getStatusBadgeClass,
} from '../types';
import { HAIRSTYLE_MODELS } from '../data/initialData';
import { ImageManagerTab } from './admin/ImageManagerTab';
import { getTodayWIB, getWIBTime, getBranchLiveStatus, formatDateIndo } from '../lib/branchHours';
import { isSupabaseConfigured } from '../lib/supabase';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isStandalonePage?: boolean;
  onNavigateHome?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  isStandalonePage = false,
  onNavigateHome,
}) => {
  const { isAdmin, signOut } = useAuth();
  const {
    branches,
    bookings,
    services,
    barbers,
    updateBookingStatus,
    rescheduleBooking,
    createBooking,
    generateAdminContactUrl,
    updateService,
    updateBarber,
    resetToDefault,
    isTableMissingInSupabase,
    dismissMissingTableWarning,
  } = useBarbershop();

  const todayWIB = getTodayWIB();
  const [showSqlSetupModal, setShowSqlSetupModal] = useState<boolean>(false);
  const [copySqlSuccess, setCopySqlSuccess] = useState<boolean>(false);

  // Active Admin Tab: default to 'active_bookings'
  const [activeTab, setActiveTab] = useState<
    'active_bookings' | 'history' | 'walkin' | 'images' | 'service' | 'branches'
  >('active_bookings');

  // Active Bookings Filters
  const [filterBranch, setFilterBranch] = useState<string>('all'); // 'all' | 'grojokan' | 'tugurejo'
  const [filterDate, setFilterDate] = useState<string>(todayWIB); // Default: Hari Ini (WIB)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // History Bookings Filters
  const [historyBranch, setHistoryBranch] = useState<string>('all');
  const [historyDate, setHistoryDate] = useState<string>(''); // empty = all dates
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  // Operation state & notifications
  const [actionNotice, setActionNotice] = useState<string>('');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  // Live WIB Clock
  const [currentWibTime, setCurrentWibTime] = useState<{ timeStr: string }>(getWIBTime());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentWibTime(getWIBTime());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Cancellation modal state
  const [cancellingBooking, setCancellingBooking] = useState<BookingRecord | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Pelanggan membatalkan kedatangan');

  // Reschedule modal state
  const [rescheduleBookingTarget, setRescheduleBookingTarget] = useState<BookingRecord | null>(null);
  const [newRescheduleBranch, setNewRescheduleBranch] = useState<string>('grojokan');
  const [newRescheduleDate, setNewRescheduleDate] = useState<string>(todayWIB);
  const [newRescheduleTime, setNewRescheduleTime] = useState<string>('10:00');
  const [rescheduleReason, setRescheduleReason] = useState<string>('Penyesuaian jadwal antrean');

  // Walk-in form state
  const [walkinBranch, setWalkinBranch] = useState<string>('grojokan');
  const [walkinName, setWalkinName] = useState<string>('');
  const [walkinPhone, setWalkinPhone] = useState<string>('081200000000');
  const [walkinModel, setWalkinModel] = useState<string>('Textured Crop / French Crop');
  const [walkinTime, setWalkinTime] = useState<string>('10:00');
  const [walkinDate, setWalkinDate] = useState<string>(todayWIB);
  const [isSubmittingWalkin, setIsSubmittingWalkin] = useState<boolean>(false);

  // Single service edit
  const [servicePrice, setServicePrice] = useState<number>(services[0]?.harga || 8000);
  const [serviceDuration, setServiceDuration] = useState<number>(services[0]?.durasi_menit || 25);
  const [serviceSavedNotice, setServiceSavedNotice] = useState<boolean>(false);

  // Capster bio edit
  const [capsterBio, setCapsterBio] = useState<string>(barbers[0]?.deskripsi_singkat || '');
  const [capsterSavedNotice, setCapsterSavedNotice] = useState<boolean>(false);

  // Branch holiday override state
  const [grojokanHoliday, setGrojokanHoliday] = useState<boolean>(false);
  const [tugurejoHoliday, setTugurejoHoliday] = useState<boolean>(false);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 4500);
  };

  const handleLogout = async () => {
    await signOut();
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      onClose();
    }
  };

  // =========================================================================
  // ACTIONS: MULAI CUKUR & SELESAI & BATALKAN
  // =========================================================================
  const handleStartServing = async (booking: BookingRecord) => {
    setIsProcessingId(booking.id);
    const success = await updateBookingStatus(booking.id, 'serving');
    setIsProcessingId(null);
    if (success) {
      showToast(`▶ [${booking.queue_number || booking.booking_code}] ${booking.customer_name || booking.nama_pelanggan} mulai dicukur.`);
    }
  };

  const handleCompleteServing = async (booking: BookingRecord) => {
    setIsProcessingId(booking.id);
    const success = await updateBookingStatus(booking.id, 'completed');
    setIsProcessingId(null);
    if (success) {
      showToast(`✓ [${booking.queue_number || booking.booking_code}] ${booking.customer_name || booking.nama_pelanggan} telah selesai dicukur! Pindah ke Riwayat.`);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setIsProcessingId(cancellingBooking.id);
    const success = await updateBookingStatus(cancellingBooking.id, 'cancelled', cancelReason);
    setIsProcessingId(null);
    if (success) {
      showToast(`✕ [${cancellingBooking.queue_number || cancellingBooking.booking_code}] Antrean telah dibatalkan.`);
      setCancellingBooking(null);
    }
  };

  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName.trim()) {
      alert('Nama tamu walk-in wajib diisi.');
      return;
    }
    setIsSubmittingWalkin(true);
    try {
      const b = await createBooking({
        cabang_id: walkinBranch,
        nama_pelanggan: walkinName + ' (Walk-In)',
        no_whatsapp: walkinPhone,
        tanggal_booking: walkinDate,
        jam_mulai: walkinTime,
        model_rambut_pilihan: walkinModel,
        bawa_foto_sendiri: false,
        catatan_pelanggan: 'Tamu langsung (walk-in gerai)',
        is_walkin: true,
      });

      setWalkinName('');
      showToast(`✓ Tamu walk-in [${b.queue_number}] berhasil masuk ke Antrean Aktif!`);
      setActiveTab('active_bookings');
    } catch {
      alert('Gagal mencatat tamu walk-in.');
    } finally {
      setIsSubmittingWalkin(false);
    }
  };

  // =========================================================================
  // DATA FILTERING
  // 1. ACTIVE BOOKINGS: status IN ('waiting', 'serving')
  //    COMPLETED & CANCELLED DO NOT APPEAR HERE!
  // 2. HISTORY: status IN ('completed', 'cancelled')
  // =========================================================================
  const allActiveBookings = bookings.filter((b) => {
    const s = normalizeBookingStatus(b.status || b.status_booking);
    return s === 'waiting' || s === 'serving';
  });

  const allHistoryBookings = bookings.filter((b) => {
    const s = normalizeBookingStatus(b.status || b.status_booking);
    return s === 'completed' || s === 'cancelled';
  });

  // Filter Active Bookings based on Branch, Date, Search
  const filteredActiveBookings = allActiveBookings.filter((b) => {
    // Branch Filter: 'all' | 'grojokan' | 'tugurejo'
    if (filterBranch !== 'all') {
      const bBranch = b.branch_id || b.cabang_id;
      const normBranch = bBranch === 'tugurejo' || bBranch === 'cabang-1' ? 'tugurejo' : 'grojokan';
      if (normBranch !== filterBranch) return false;
    }

    // Date Filter: default to Today in WIB
    if (filterDate) {
      const bDate = b.booking_date || b.tanggal_booking;
      if (bDate !== filterDate) return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        (b.queue_number && b.queue_number.toLowerCase().includes(q)) ||
        (b.booking_code && b.booking_code.toLowerCase().includes(q)) ||
        (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
        (b.nama_pelanggan && b.nama_pelanggan.toLowerCase().includes(q)) ||
        (b.customer_phone && b.customer_phone.includes(q)) ||
        (b.no_whatsapp && b.no_whatsapp.includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Filter History Bookings based on Branch, Date, Status
  const filteredHistoryBookings = allHistoryBookings.filter((b) => {
    const s = normalizeBookingStatus(b.status || b.status_booking);

    if (historyStatusFilter !== 'all' && s !== historyStatusFilter) return false;

    if (historyBranch !== 'all') {
      const bBranch = b.branch_id || b.cabang_id;
      const normBranch = bBranch === 'tugurejo' || bBranch === 'cabang-1' ? 'tugurejo' : 'grojokan';
      if (normBranch !== historyBranch) return false;
    }

    if (historyDate) {
      const bDate = b.booking_date || b.tanggal_booking;
      if (bDate !== historyDate) return false;
    }

    return true;
  });

  // History Statistics
  const completedCount = allHistoryBookings.filter((b) => normalizeBookingStatus(b.status || b.status_booking) === 'completed').length;
  const cancelledCount = allHistoryBookings.filter((b) => normalizeBookingStatus(b.status || b.status_booking) === 'cancelled').length;
  const totalRevenue = completedCount * 8000;

  // Active status counts for badges
  const waitingCount = allActiveBookings.filter((b) => normalizeBookingStatus(b.status || b.status_booking) === 'waiting').length;
  const servingCount = allActiveBookings.filter((b) => normalizeBookingStatus(b.status || b.status_booking) === 'serving').length;

  return (
    <div
      className={
        isStandalonePage
          ? 'min-h-screen bg-[#0e0f12] text-[#e8e6e3] flex flex-col'
          : 'fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto'
      }
    >
      <div
        className={
          isStandalonePage
            ? 'w-full flex flex-col flex-1'
            : 'bg-[#12141a] border border-[#2b2e3a] rounded max-w-5xl w-full my-4 overflow-hidden shadow-2xl flex flex-col max-h-[94vh]'
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          className={
            isStandalonePage
              ? 'w-full bg-[#0e1015]/95 backdrop-blur-md border-b border-[#232630] sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between'
              : 'p-3.5 sm:p-4 border-b border-[#232630] flex items-center justify-between bg-[#0e1015] rounded-t'
          }
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="font-mono text-[10px] sm:text-xs px-2.5 py-1 bg-[#1a1c24] border border-[#2d3039] text-[#c59a45] rounded font-bold tracking-wider uppercase">
              Dashboard Kepster
            </span>
            <span className="text-[#323644] hidden sm:inline">|</span>
            <h2
              className="text-sm sm:text-base md:text-lg font-bold text-[#f0eee9] tracking-wide"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Necis Barbershop <span className="text-[#8e92a0] font-normal text-xs sm:text-sm hidden sm:inline">· Mas Anang</span>
            </h2>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Realtime & WIB indicator */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-[#14161f] border border-[#232633] rounded text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-[#9ea2ad]">
                {isSupabaseConfigured ? 'Realtime Supabase' : 'Offline Mode'}
              </span>
              <span className="text-[#555866]">·</span>
              <span className="text-[#c59a45] font-semibold">{currentWibTime.timeStr} WIB</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900 border border-rose-800/80 rounded transition-colors cursor-pointer"
            >
              Keluar
            </button>

            {!isStandalonePage && (
              <button
                onClick={onClose}
                className="text-[#8e92a0] hover:text-white p-1 rounded cursor-pointer"
                title="Tutup"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Global Toast Alert */}
        {actionNotice && (
          <div className="bg-emerald-950/90 border-b border-emerald-700/80 px-4 py-2.5 text-xs text-emerald-200 flex items-center justify-between shadow-lg sticky top-0 z-30 animate-in fade-in">
            <div className="flex items-center gap-2 font-medium">
              <span>⚡</span>
              <span>{actionNotice}</span>
            </div>
            <button
              onClick={() => setActionNotice('')}
              className="text-emerald-400 hover:text-white text-xs px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Supabase Missing Table Info Banner */}
        {isTableMissingInSupabase && (
          <div className="bg-amber-950/90 border-b border-amber-600/70 px-4 py-3 text-xs text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md z-30">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <span>⚠️</span>
                <span>Tabel Database Supabase Belum Terpasang (Penyimpanan Lokal Aktif)</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Antrean &amp; perubahan status berjalan lancar di browser ini. Agar tersimpan permanen di cloud dan tersinkronisasi antar-HP secara otomatis, silakan buat tabel <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-white">bookings</code> di Supabase SQL Editor.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowSqlSetupModal(true)}
                className="px-3 py-1.5 bg-[#c59a45] hover:bg-[#d8ab52] text-black font-bold text-xs rounded transition-colors cursor-pointer shadow whitespace-nowrap"
              >
                📋 Salin SQL Tabel Bookings
              </button>
              <button
                type="button"
                onClick={dismissMissingTableWarning}
                className="text-amber-400 hover:text-white text-xs px-1.5 py-1"
                title="Sembunyikan pesan ini"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* MAIN ADMIN DASHBOARD */}
        <div className={isStandalonePage ? 'flex-1 flex flex-col w-full max-w-7xl mx-auto' : 'flex-1 flex flex-col overflow-hidden'}>
          
          {/* Navigation Tabs (Mobile-friendly horizontal scroll) */}
          <div className="flex items-center gap-1 px-3 sm:px-6 pt-2 sm:pt-3 border-b border-[#232630] bg-[#0e1015] overflow-x-auto no-scrollbar">
            {[
              {
                id: 'active_bookings',
                label: `⚡ Antrean Aktif (${allActiveBookings.length})`,
                badge: servingCount > 0 ? `${servingCount} Sedang Cukur` : undefined,
              },
              {
                id: 'history',
                label: `📜 Riwayat Selesai & Batal (${allHistoryBookings.length})`,
              },
              { id: 'walkin', label: '+ Tamu Walk-In' },
              { id: 'images', label: '📸 Kelola Foto' },
              { id: 'service', label: 'Tarif (8k)' },
              { id: 'branches', label: '2 Cabang & Jam' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'border-[#c59a45] text-[#c59a45] bg-[#14161c]'
                    : 'border-transparent text-[#8e92a0] hover:text-[#e8e6e3]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 text-[9px] bg-sky-950 text-sky-300 border border-sky-700 rounded-full animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            
            {/* =============================================================== */}
            {/* TAB 1: ACTIVE BOOKINGS / ANTREAN AKTIF                           */}
            {/* Focus on waiting & serving, instant transition, HP-friendly UI   */}
            {/* =============================================================== */}
            {activeTab === 'active_bookings' && (
              <div className="space-y-4">
                
                {/* Active Filter Bar */}
                <div className="p-3.5 sm:p-4 bg-[#14161f] border border-[#232633] rounded-lg space-y-3">
                  
                  {/* Row 1: Branch Selectors (Semua Cabang | Grojokan | Tugurejo) */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] uppercase tracking-wider text-[#7e8291] font-mono mr-1">
                        Cabang:
                      </span>
                      <button
                        type="button"
                        onClick={() => setFilterBranch('all')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                          filterBranch === 'all'
                            ? 'bg-[#c59a45] text-black font-bold'
                            : 'bg-[#1a1c24] text-[#8e92a0] hover:text-white border border-[#2a2d39]'
                        }`}
                      >
                        Semua Cabang
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterBranch('grojokan')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-1 ${
                          filterBranch === 'grojokan'
                            ? 'bg-[#c59a45] text-black font-bold'
                            : 'bg-[#1a1c24] text-[#8e92a0] hover:text-white border border-[#2a2d39]'
                        }`}
                      >
                        <span className="font-mono text-[10px] px-1 bg-black/30 rounded">G</span>
                        <span>Grojokan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterBranch('tugurejo')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-1 ${
                          filterBranch === 'tugurejo'
                            ? 'bg-[#c59a45] text-black font-bold'
                            : 'bg-[#1a1c24] text-[#8e92a0] hover:text-white border border-[#2a2d39]'
                        }`}
                      >
                        <span className="font-mono text-[10px] px-1 bg-black/30 rounded">T</span>
                        <span>Tugurejo</span>
                      </button>
                    </div>

                    {/* Quick status counter */}
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#8e92a0]">
                      <span className="px-2 py-0.5 bg-amber-950/40 text-amber-300 border border-amber-800/80 rounded">
                        {waitingCount} Menunggu
                      </span>
                      <span className="px-2 py-0.5 bg-sky-950/40 text-sky-300 border border-sky-700/80 rounded">
                        {servingCount} Sedang Cukur
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Date Selector & Search Input */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-[#1f222d]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider text-[#7e8291] font-mono mr-1">
                        Tanggal:
                      </span>
                      <button
                        type="button"
                        onClick={() => setFilterDate(todayWIB)}
                        className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                          filterDate === todayWIB
                            ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-700 font-bold'
                            : 'bg-[#1a1c24] text-[#8e92a0] hover:text-white border border-[#2a2d39]'
                        }`}
                      >
                        Hari Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterDate('')}
                        className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                          filterDate === ''
                            ? 'bg-[#c59a45]/20 text-[#c59a45] border border-[#c59a45] font-bold'
                            : 'bg-[#1a1c24] text-[#8e92a0] hover:text-white border border-[#2a2d39]'
                        }`}
                      >
                        Semua Tanggal
                      </button>
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-[#0c0e12] border border-[#272a35] rounded px-2 py-1 text-xs text-[#e8e6e3] font-mono focus:border-[#c59a45] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Cari nama / antrean / WA..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0c0e12] border border-[#272a35] rounded px-3 py-1.5 text-xs text-[#e8e6e3] focus:border-[#c59a45] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* ACTIVE QUEUE CARDS */}
                {filteredActiveBookings.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center border border-[#232630] bg-[#14161c] rounded-lg space-y-3">
                    <span className="text-3xl block">✂️</span>
                    <h4 className="text-sm font-bold text-[#f0eee9]">Tidak Ada Antrean Aktif</h4>
                    <p className="text-xs text-[#8e92a0] max-w-md mx-auto leading-relaxed">
                      {filterDate === todayWIB
                        ? 'Semua booking hari ini sudah selesai dilayani atau belum ada antrean baru. Tamu yang sudah selesai otomatis tersimpan di tab "Riwayat Selesai".'
                        : 'Tidak ada booking dengan status Menunggu atau Sedang Dicukur untuk filter tanggal/cabang yang dipilih.'}
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        onClick={() => setActiveTab('walkin')}
                        className="px-4 py-2 text-xs font-semibold text-black bg-[#c59a45] hover:bg-[#d8ab52] rounded transition-colors cursor-pointer"
                      >
                        + Catat Tamu Walk-In
                      </button>
                      {filterDate !== todayWIB && (
                        <button
                          onClick={() => setFilterDate(todayWIB)}
                          className="px-4 py-2 text-xs text-[#8e92a0] hover:text-white bg-[#1a1c24] border border-[#2a2d39] rounded transition-colors cursor-pointer"
                        >
                          Tampilkan Hari Ini
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredActiveBookings.map((b) => {
                      const normStat = normalizeBookingStatus(b.status || b.status_booking);
                      const isServing = normStat === 'serving';
                      const isWaiting = normStat === 'waiting';
                      const isProcessing = isProcessingId === b.id;

                      const qCode = b.queue_number || b.booking_code || 'G-001';
                      const customerName = b.customer_name || b.nama_pelanggan || 'Pelanggan';
                      const customerPhone = b.customer_phone || b.no_whatsapp || '';
                      const branchName = b.nama_cabang || (b.branch_id === 'tugurejo' ? 'Cabang Tugurejo' : 'Cabang Grojokan');
                      const bDate = b.booking_date || b.tanggal_booking || todayWIB;
                      const bTime = b.booking_time || b.jam_mulai || '10:00';
                      const hairModel = b.hairstyle_model || b.model_rambut_pilihan || 'Textured Crop';
                      const notes = b.notes || b.catatan_pelanggan || '';

                      return (
                        <div
                          key={b.id}
                          className={`p-4 rounded-lg border transition-all ${
                            isServing
                              ? 'bg-[#111923] border-sky-700/80 shadow-[0_0_20px_rgba(56,189,248,0.08)]'
                              : 'bg-[#14161c] border-[#252835] hover:border-[#35394a]'
                          }`}
                        >
                          {/* Card Header: Queue Number + Status + Branch */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#20232f] pb-3">
                            <div className="flex items-center gap-2.5">
                              {/* Big Queue Badge */}
                              <span className="font-mono text-base sm:text-lg font-bold text-[#c59a45] bg-[#1a1c24] border border-[#3b3426] px-3 py-1 rounded shadow-inner">
                                {qCode}
                              </span>

                              {/* Branch Badge */}
                              <span className="text-xs font-semibold text-[#f0eee9]">
                                {branchName}
                              </span>

                              {b.booking_type === 'walk-in' || b.is_walkin ? (
                                <span className="text-[10px] bg-indigo-950/70 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">
                                  Walk-In
                                </span>
                              ) : null}
                            </div>

                            {/* Status Indicator */}
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded border flex items-center gap-1.5 ${getStatusBadgeClass(normStat)}`}>
                              {isServing && <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>}
                              {isWaiting && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                              <span>{getStatusLabel(normStat)}</span>
                            </span>
                          </div>

                          {/* Card Body: Customer details & Service */}
                          <div className="py-3 grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                            <div className="sm:col-span-7 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm sm:text-base font-bold text-white">
                                  {customerName}
                                </span>
                                {customerPhone && (
                                  <a
                                    href={`https://wa.me/${customerPhone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="text-[11px] font-mono text-[#8b8f9e] hover:text-[#25D366] flex items-center gap-1"
                                    title="Hubungi via WhatsApp"
                                  >
                                    <span>📱</span>
                                    <span>{customerPhone}</span>
                                  </a>
                                )}
                              </div>

                              <div className="text-[#9ea2ad] flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span className="flex items-center gap-1">
                                  <span>🕒</span>
                                  <strong className="text-white">{bTime} WIB</strong>
                                  <span className="text-[#686d7c]">({bDate})</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <span>Tarif:</span>
                                  <strong className="text-emerald-400 font-mono">Rp 8.000</strong>
                                </span>
                              </div>

                              <div className="text-[#8e92a0] pt-0.5">
                                <span>Model: </span>
                                <strong className="text-[#f0eee9]">
                                  {b.has_custom_photo || b.bawa_foto_sendiri
                                    ? '📸 Bawa Foto Referensi Sendiri'
                                    : hairModel}
                                </strong>
                              </div>

                              {notes && (
                                <p className="text-[11px] text-[#a1a5b4] italic bg-[#0c0d12] p-1.5 rounded border border-[#1f222d]">
                                  &quot;{notes}&quot;
                                </p>
                              )}
                            </div>

                            {/* Info Quick Contact */}
                            <div className="sm:col-span-5 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 text-right">
                              <a
                                href={generateAdminContactUrl(b, isServing ? 'reminder' : 'confirm')}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="px-3 py-1.5 text-xs text-[#25D366] hover:text-white bg-[#102014] hover:bg-[#1a3821] border border-emerald-900/60 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <span>💬</span>
                                <span>Chat WA Pelanggan</span>
                              </a>
                              <button
                                onClick={() => {
                                  setRescheduleBookingTarget(b);
                                  setNewRescheduleBranch(b.branch_id || b.cabang_id || 'grojokan');
                                  setNewRescheduleDate(bDate);
                                  setNewRescheduleTime(bTime);
                                }}
                                className="text-[11px] text-[#8e92a0] hover:text-[#c59a45] underline cursor-pointer"
                              >
                                Pindah Jam / Jadwal
                              </button>
                            </div>
                          </div>

                          {/* ACTION BUTTONS (BIG TOUCH TARGET FOR MOBILE / HP) */}
                          <div className="pt-3 border-t border-[#20232f] flex flex-wrap items-center gap-2.5">
                            
                            {/* CASE 1: WAITING -> BUTTON MULAI CUKUR */}
                            {isWaiting && (
                              <>
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => handleStartServing(b)}
                                  className="flex-1 py-3 px-5 text-xs sm:text-sm font-bold text-black bg-[#c59a45] hover:bg-[#d8ab52] active:scale-[0.98] rounded-md transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                  <span>▶</span>
                                  <span>{isProcessing ? 'Memperbarui...' : 'Mulai Cukur'}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => setCancellingBooking(b)}
                                  className="py-3 px-4 text-xs text-rose-300 hover:text-white bg-rose-950/30 hover:bg-rose-900/60 border border-rose-900/80 active:scale-[0.98] rounded-md transition-colors cursor-pointer"
                                >
                                  ✕ Batalkan
                                </button>
                              </>
                            )}

                            {/* CASE 2: SERVING -> BUTTON SELESAI */}
                            {isServing && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleCompleteServing(b)}
                                className="flex-1 py-3.5 px-6 text-sm sm:text-base font-bold text-black bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] rounded-md transition-all cursor-pointer shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                <span>✓</span>
                                <span>{isProcessing ? 'Menyimpan...' : 'Selesai Dilayani (Rp 8.000)'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 2: RIWAYAT BOOKING (SELESAI & BATAL)                        */}
            {/* Kept permanently in Supabase for reports, never deleted          */}
            {/* =============================================================== */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                
                {/* Stats Summary Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-[#14161f] border border-[#232633] rounded-lg">
                    <span className="text-[11px] uppercase tracking-wider text-[#8e92a0] font-mono block">
                      Total Selesai Dicukur
                    </span>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
                      {completedCount} Pelanggan
                    </p>
                    <p className="text-[11px] text-[#717686] mt-0.5">Tersimpan permanen di database</p>
                  </div>

                  <div className="p-4 bg-[#14161f] border border-[#232633] rounded-lg">
                    <span className="text-[11px] uppercase tracking-wider text-[#8e92a0] font-mono block">
                      Total Pendapatan (Rp 8.000)
                    </span>
                    <p className="text-xl sm:text-2xl font-bold text-[#c59a45] mt-1 font-mono">
                      Rp {totalRevenue.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-[#717686] mt-0.5">Dari seluruh pelanggan selesai</p>
                  </div>

                  <div className="p-4 bg-[#14161f] border border-[#232633] rounded-lg">
                    <span className="text-[11px] uppercase tracking-wider text-[#8e92a0] font-mono block">
                      Dibatalkan / Batal
                    </span>
                    <p className="text-xl sm:text-2xl font-bold text-rose-400 mt-1">
                      {cancelledCount} Booking
                    </p>
                    <p className="text-[11px] text-[#717686] mt-0.5">Tidak menghapus antrean lain</p>
                  </div>
                </div>

                {/* History Filter Bar */}
                <div className="p-3.5 bg-[#14161f] border border-[#232633] rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#8e92a0] font-mono text-[11px]">Filter:</span>
                    <select
                      value={historyBranch}
                      onChange={(e) => setHistoryBranch(e.target.value)}
                      className="bg-[#0c0e12] border border-[#272a35] rounded px-2.5 py-1.5 text-xs text-[#e8e6e3] focus:outline-none"
                    >
                      <option value="all">Semua Cabang</option>
                      <option value="grojokan">Cabang Grojokan</option>
                      <option value="tugurejo">Cabang Tugurejo</option>
                    </select>

                    <select
                      value={historyStatusFilter}
                      onChange={(e) => setHistoryStatusFilter(e.target.value as any)}
                      className="bg-[#0c0e12] border border-[#272a35] rounded px-2.5 py-1.5 text-xs text-[#e8e6e3] focus:outline-none"
                    >
                      <option value="all">Semua Status Riwayat</option>
                      <option value="completed">Hanya Selesai</option>
                      <option value="cancelled">Hanya Dibatalkan</option>
                    </select>

                    <input
                      type="date"
                      value={historyDate}
                      onChange={(e) => setHistoryDate(e.target.value)}
                      className="bg-[#0c0e12] border border-[#272a35] rounded px-2 py-1 text-xs text-[#e8e6e3] font-mono focus:outline-none"
                    />
                    {historyDate && (
                      <button
                        onClick={() => setHistoryDate('')}
                        className="text-[11px] text-[#c59a45] hover:underline"
                      >
                        Reset Tgl
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-[#8e92a0]">
                    Menampilkan {filteredHistoryBookings.length} data riwayat
                  </span>
                </div>

                {/* History List */}
                {filteredHistoryBookings.length === 0 ? (
                  <div className="p-8 text-center border border-[#232630] bg-[#14161c] rounded-lg text-xs text-[#8e92a0]">
                    Belum ada data riwayat yang sesuai dengan filter.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredHistoryBookings.map((b) => {
                      const normStat = normalizeBookingStatus(b.status || b.status_booking);
                      const isCompleted = normStat === 'completed';
                      const qCode = b.queue_number || b.booking_code || 'G-001';
                      const customerName = b.customer_name || b.nama_pelanggan || 'Pelanggan';
                      const customerPhone = b.customer_phone || b.no_whatsapp || '';
                      const branchName = b.nama_cabang || (b.branch_id === 'tugurejo' ? 'Cabang Tugurejo' : 'Cabang Grojokan');
                      const bDate = b.booking_date || b.tanggal_booking || todayWIB;
                      const bTime = b.booking_time || b.jam_mulai || '10:00';
                      const hairModel = b.hairstyle_model || b.model_rambut_pilihan || 'Textured Crop';

                      return (
                        <div
                          key={b.id}
                          className="p-3.5 bg-[#12141a] border border-[#222530] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-[#c59a45] bg-[#1a1c24] px-2 py-0.5 rounded border border-[#2c2f3c]">
                                {qCode}
                              </span>
                              <span className="font-bold text-[#f0eee9]">
                                {customerName}
                              </span>
                              {customerPhone && (
                                <span className="font-mono text-[#7e8291] text-[11px]">
                                  ({customerPhone})
                                </span>
                              )}
                              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${getStatusBadgeClass(normStat)}`}>
                                {getStatusLabel(normStat)}
                              </span>
                            </div>

                            <div className="text-[11px] text-[#8e92a0] flex flex-wrap gap-x-4 gap-y-1">
                              <span><strong>Cabang:</strong> {branchName}</span>
                              <span><strong>Jadwal:</strong> {bDate} pukul {bTime} WIB</span>
                              <span><strong>Model:</strong> {hairModel}</span>
                              {isCompleted && (
                                <span className="text-emerald-400 font-mono">
                                  <strong>Tarif:</strong> Rp 8.000 (Lunas)
                                </span>
                              )}
                            </div>

                            {!isCompleted && (b.cancel_reason || b.alasan_batal) && (
                              <p className="text-[11px] text-rose-300/90 italic">
                                Alasan Batal: {b.cancel_reason || b.alasan_batal}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {/* Tombol kembalikan ke aktif jika admin keliru menekan selesai */}
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Kembalikan antrean [${qCode}] ${customerName} ke Antrean Aktif (Menunggu)?`)) {
                                  await updateBookingStatus(b.id, 'waiting');
                                  showToast(`Antrean ${qCode} dikembalikan ke Antrean Aktif.`);
                                }
                              }}
                              className="px-2.5 py-1 text-[11px] text-[#8e92a0] hover:text-[#c59a45] bg-[#1a1c24] border border-[#2c2f3c] rounded cursor-pointer transition-colors"
                            >
                              ↩ Kembalikan ke Aktif
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 3: INPUT TAMU WALK-IN                                       */}
            {/* =============================================================== */}
            {activeTab === 'walkin' && (
              <div className="max-w-xl mx-auto p-5 sm:p-6 bg-[#14161c] border border-[#232630] rounded-lg space-y-5">
                <div>
                  <h3 className="text-base font-bold text-[#f0eee9] flex items-center gap-2">
                    <span>+</span>
                    <span>Input Tamu Walk-In (Langsung di Tempat)</span>
                  </h3>
                  <p className="text-xs text-[#9ea2ad] mt-1 leading-relaxed">
                    Gunakan formulir ini jika ada pelanggan yang datang langsung tanpa booking online. Nomor antrean otomatis dibuat berurutan (G-xxx untuk Grojokan, T-xxx untuk Tugurejo) dan langsung muncul di daftar Antrean Aktif.
                  </p>
                </div>

                <form onSubmit={handleWalkinSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#c59a45] mb-1">
                      Pilih Cabang Gerai
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWalkinBranch('grojokan')}
                        className={`p-3 rounded border text-left text-xs transition-colors cursor-pointer ${
                          walkinBranch === 'grojokan'
                            ? 'bg-[#1e1c15] border-[#c59a45] text-white font-bold'
                            : 'bg-[#101217] border-[#262832] text-[#8e92a0]'
                        }`}
                      >
                        <span className="block font-bold">Cabang Grojokan</span>
                        <span className="text-[11px] text-[#7e8291]">Pagi – Sore (08.00–17.00)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWalkinBranch('tugurejo')}
                        className={`p-3 rounded border text-left text-xs transition-colors cursor-pointer ${
                          walkinBranch === 'tugurejo'
                            ? 'bg-[#1e1c15] border-[#c59a45] text-white font-bold'
                            : 'bg-[#101217] border-[#262832] text-[#8e92a0]'
                        }`}
                      >
                        <span className="block font-bold">Cabang Tugurejo</span>
                        <span className="text-[11px] text-[#7e8291]">Malam (18.30–22.00)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#9ea2ad] mb-1 font-semibold">
                      Nama Tamu Walk-In *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Mas Budi / Pak Joko"
                      value={walkinName}
                      onChange={(e) => setWalkinName(e.target.value)}
                      className="w-full bg-[#0a0c10] border border-[#2b2e3a] rounded p-2.5 text-xs text-[#e8e6e3] focus:border-[#c59a45] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#9ea2ad] mb-1">
                        Tanggal Kedatangan
                      </label>
                      <input
                        type="date"
                        value={walkinDate}
                        onChange={(e) => setWalkinDate(e.target.value)}
                        className="w-full bg-[#0a0c10] border border-[#2b2e3a] rounded p-2 text-xs text-[#e8e6e3] font-mono focus:border-[#c59a45] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#9ea2ad] mb-1">
                        Jam Masuk / Cukur
                      </label>
                      <input
                        type="time"
                        value={walkinTime}
                        onChange={(e) => setWalkinTime(e.target.value)}
                        className="w-full bg-[#0a0c10] border border-[#2b2e3a] rounded p-2 text-xs text-[#e8e6e3] font-mono focus:border-[#c59a45] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#9ea2ad] mb-1">
                      Model Rambut yang Dipilih
                    </label>
                    <select
                      value={walkinModel}
                      onChange={(e) => setWalkinModel(e.target.value)}
                      className="w-full bg-[#0a0c10] border border-[#2b2e3a] rounded p-2.5 text-xs text-[#e8e6e3] focus:border-[#c59a45] focus:outline-none"
                    >
                      <option value="Textured Crop / French Crop">Textured Crop / French Crop</option>
                      <option value="Modern Buzz Cut">Modern Buzz Cut</option>
                      <option value="Crew Cut">Crew Cut Klasik</option>
                      <option value="Low Taper Fade">Low Taper Fade</option>
                      <option value="Modern Mullet & Wolf Cut">Modern Mullet &amp; Wolf Cut</option>
                      <option value="Textured Quiff">Textured Quiff</option>
                      <option value="Warrior Cut">Warrior Cut</option>
                      <option value="Potongan Medium & Bervolume">Potongan Medium &amp; Bervolume</option>
                      <option value="Bawa Contoh Foto Sendiri">Bawa Contoh Foto Sendiri</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingWalkin}
                      className="w-full py-3 px-4 text-xs font-bold text-black bg-[#c59a45] hover:bg-[#d8ab52] active:scale-[0.99] rounded transition-all cursor-pointer shadow-lg disabled:opacity-50"
                    >
                      {isSubmittingWalkin ? 'Mencatat...' : 'Simpan & Masukkan ke Antrean Aktif →'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 4: KELOLA FOTO BERANDA                                      */}
            {/* =============================================================== */}
            {activeTab === 'images' && <ImageManagerTab />}

            {/* =============================================================== */}
            {/* TAB 5: PENGATURAN TARIF (8k)                                    */}
            {/* =============================================================== */}
            {activeTab === 'service' && (
              <div className="max-w-xl mx-auto p-6 bg-[#14161c] border border-[#232630] rounded-lg space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[#f0eee9]">Pengaturan Tarif Layanan Cukur</h3>
                  <p className="text-xs text-[#9ea2ad] mt-1">
                    Saat ini Necis Barbershop menerapkan tarif bersahabat tunggal Rp 8.000 untuk pangkas rambut pria presisi.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-[#9ea2ad] mb-1 font-semibold">Nama Layanan</label>
                    <input
                      type="text"
                      disabled
                      value={services[0]?.nama_layanan || 'Potong Rambut'}
                      className="w-full bg-[#0d0f13] border border-[#262832] rounded p-2 text-xs text-[#8e92a0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#9ea2ad] mb-1 font-semibold">Tarif Harga (Rp)</label>
                    <input
                      type="number"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(Number(e.target.value))}
                      className="w-full bg-[#0a0c10] border border-[#2b2e3a] rounded p-2.5 text-xs text-[#e8e6e3] font-mono focus:border-[#c59a45] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#9ea2ad] mb-1 font-semibold">Estimasi Durasi (Menit)</label>
                    <input
                      type="number"
                      value={serviceDuration}
                      onChange={(e) => setServiceDuration(Number(e.target.value))}
                      className="w-full bg-[#0a0c10] border border-[#2b2e3a] rounded p-2.5 text-xs text-[#e8e6e3] font-mono focus:border-[#c59a45] focus:outline-none"
                    />
                  </div>

                  {serviceSavedNotice && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-xs rounded">
                      ✓ Tarif layanan berhasil diperbarui.
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (services[0]) {
                        updateService({
                          ...services[0],
                          harga: servicePrice,
                          durasi_menit: serviceDuration,
                        });
                        setServiceSavedNotice(true);
                        setTimeout(() => setServiceSavedNotice(false), 3000);
                      }
                    }}
                    className="w-full py-2.5 text-xs font-bold text-black bg-[#c59a45] hover:bg-[#d8ab52] rounded cursor-pointer transition-colors"
                  >
                    Simpan Perubahan Tarif
                  </button>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 6: 2 CABANG & JAM OPERASIONAL (AUTO OPEN/CLOSE IN WIB)       */}
            {/* =============================================================== */}
            {activeTab === 'branches' && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="bg-[#14161c] border border-[#232630] rounded-lg p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-[#f0eee9] flex items-center gap-2">
                        <span>📍</span>
                        <span>2 Cabang Necis Barbershop &amp; Jam Operasional Otomatis</span>
                      </h3>
                      <p className="text-xs text-[#9ea2ad] mt-1 leading-relaxed">
                        Website otomatis menghitung status <strong>&quot;Buka Sekarang&quot;</strong> atau <strong>&quot;Tutup Saat Ini&quot;</strong> secara real-time berdasarkan zona waktu Indonesia (WIB). Anda tidak perlu mengubah status buka/tutup manual setiap hari.
                      </p>
                    </div>

                    <div className="px-3 py-1.5 bg-[#0d0e13] border border-[#262832] rounded font-mono text-xs text-[#c59a45] whitespace-nowrap self-start sm:self-auto">
                      Waktu WIB Sekarang: <strong>{currentWibTime.timeStr}</strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Cabang Grojokan */}
                  {(() => {
                    const statusGrojokan = getBranchLiveStatus('08:00', '17:00', grojokanHoliday);
                    return (
                      <div className="p-5 bg-[#14161c] border border-[#252834] rounded-lg space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-[#c59a45] bg-[#1a1c24] px-2 py-0.5 rounded border border-[#2d3039]">
                              Cabang 1 (G)
                            </span>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded border flex items-center gap-1.5 ${statusGrojokan.badgeClass}`}>
                              <span className={`w-2 h-2 rounded-full ${statusGrojokan.dotClass}`}></span>
                              <span>{statusGrojokan.statusText}</span>
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-white">Cabang Grojokan</h4>
                          <div className="text-xs text-[#9ea2ad] space-y-1">
                            <p><strong>Sesi Waktu:</strong> Pagi – Sore</p>
                            <p><strong>Jam Operasional:</strong> 08.00 – 17.00 WIB</p>
                            <p><strong>Kode Antrean:</strong> <code className="text-[#c59a45] font-mono font-bold">G-001, G-002, ...</code></p>
                            <p className="text-[11px] text-[#717686] pt-1">
                              Status saat ini: {statusGrojokan.keterangan}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#232630] space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              setGrojokanHoliday(!grojokanHoliday);
                              showToast(grojokanHoliday ? 'Cabang Grojokan kembali ke mode operasional otomatis.' : 'Cabang Grojokan diset Tutup Sementara / Libur.');
                            }}
                            className={`w-full py-2 text-xs font-semibold rounded cursor-pointer transition-colors border ${
                              grojokanHoliday
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                                : 'bg-[#1a1c24] text-[#8e92a0] hover:text-white border-[#2b2e3b]'
                            }`}
                          >
                            {grojokanHoliday ? 'Buka Kembali (Batalkan Libur)' : 'Override: Set Tutup Khusus / Libur'}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Cabang Tugurejo */}
                  {(() => {
                    const statusTugurejo = getBranchLiveStatus('18:30', '22:00', tugurejoHoliday);
                    return (
                      <div className="p-5 bg-[#14161c] border border-[#252834] rounded-lg space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-[#c59a45] bg-[#1a1c24] px-2 py-0.5 rounded border border-[#2d3039]">
                              Cabang 2 (T)
                            </span>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded border flex items-center gap-1.5 ${statusTugurejo.badgeClass}`}>
                              <span className={`w-2 h-2 rounded-full ${statusTugurejo.dotClass}`}></span>
                              <span>{statusTugurejo.statusText}</span>
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-white">Cabang Tugurejo</h4>
                          <div className="text-xs text-[#9ea2ad] space-y-1">
                            <p><strong>Sesi Waktu:</strong> Malam</p>
                            <p><strong>Jam Operasional:</strong> 18.30 – 22.00 WIB</p>
                            <p><strong>Kode Antrean:</strong> <code className="text-[#c59a45] font-mono font-bold">T-001, T-002, ...</code></p>
                            <p className="text-[11px] text-[#717686] pt-1">
                              Status saat ini: {statusTugurejo.keterangan}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#232630] space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              setTugurejoHoliday(!tugurejoHoliday);
                              showToast(tugurejoHoliday ? 'Cabang Tugurejo kembali ke mode operasional otomatis.' : 'Cabang Tugurejo diset Tutup Sementara / Libur.');
                            }}
                            className={`w-full py-2 text-xs font-semibold rounded cursor-pointer transition-colors border ${
                              tugurejoHoliday
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                                : 'bg-[#1a1c24] text-[#8e92a0] hover:text-white border-[#2b2e3b]'
                            }`}
                          >
                            {tugurejoHoliday ? 'Buka Kembali (Batalkan Libur)' : 'Override: Set Tutup Khusus / Libur'}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =============================================================== */}
        {/* MODAL BATALKAN ANTREAN                                          */}
        {/* =============================================================== */}
        {cancellingBooking && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#14161c] border border-rose-900/60 rounded-lg p-5 max-w-md w-full space-y-4 shadow-2xl">
              <div className="border-b border-[#232630] pb-2">
                <h4 className="text-sm font-bold text-rose-300">
                  Batalkan Antrean [{cancellingBooking.queue_number || cancellingBooking.booking_code}]
                </h4>
                <p className="text-xs text-[#9ea2ad] mt-0.5">
                  Pelanggan: {cancellingBooking.customer_name || cancellingBooking.nama_pelanggan}
                </p>
              </div>

              <div>
                <label className="block text-xs text-[#9ea2ad] mb-1">Pilih / Masukkan Alasan Pembatalan:</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-[#0c0e12] border border-[#272a35] rounded p-2 text-xs text-[#e8e6e3] mb-2 focus:outline-none"
                >
                  <option value="Pelanggan membatalkan kedatangan">Pelanggan membatalkan kedatangan</option>
                  <option value="Pelanggan tidak hadir setelah dipanggil (No Show)">Pelanggan tidak hadir setelah dipanggil (No Show)</option>
                  <option value="Mas Anang berhalangan hadir mendadak">Mas Anang berhalangan hadir mendadak</option>
                  <option value="Lainnya">Alasan Lainnya...</option>
                </select>
                {cancelReason === 'Lainnya' && (
                  <input
                    type="text"
                    placeholder="Tulis alasan..."
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full bg-[#0c0e12] border border-[#272a35] rounded p-2 text-xs text-[#e8e6e3] focus:outline-none"
                  />
                )}
                <p className="text-[11px] text-[#717686] mt-1.5">
                  * Data yang dibatalkan tetap disimpan di database sebagai riwayat (tidak dihapus).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232630]">
                <button
                  type="button"
                  onClick={() => setCancellingBooking(null)}
                  className="px-3 py-1.5 text-xs text-[#8e92a0] hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-600 rounded cursor-pointer"
                >
                  Konfirmasi Batalkan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* MODAL PINDAH JADWAL / RESCHEDULE                                */}
        {/* =============================================================== */}
        {rescheduleBookingTarget && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#14161c] border border-[#2b2e3a] rounded-lg p-5 max-w-md w-full space-y-4 shadow-2xl">
              <div className="border-b border-[#232630] pb-2">
                <h4 className="text-sm font-bold text-[#f0eee9]">
                  Pindah Jadwal: [{rescheduleBookingTarget.queue_number || rescheduleBookingTarget.booking_code}]
                </h4>
                <p className="text-xs text-[#9ea2ad] mt-0.5">
                  Pelanggan: {rescheduleBookingTarget.customer_name || rescheduleBookingTarget.nama_pelanggan}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#9ea2ad] mb-1">Pilih Cabang</label>
                  <select
                    value={newRescheduleBranch}
                    onChange={(e) => setNewRescheduleBranch(e.target.value)}
                    className="w-full bg-[#0c0e12] border border-[#272a35] rounded p-2 text-xs text-[#e8e6e3] focus:outline-none"
                  >
                    <option value="grojokan">Cabang Grojokan (08.00–17.00)</option>
                    <option value="tugurejo">Cabang Tugurejo (18.30–22.00)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[#9ea2ad] mb-1">Tanggal Baru</label>
                    <input
                      type="date"
                      value={newRescheduleDate}
                      onChange={(e) => setNewRescheduleDate(e.target.value)}
                      className="w-full bg-[#0c0e12] border border-[#272a35] rounded p-2 text-xs text-[#e8e6e3] font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#9ea2ad] mb-1">Jam Baru</label>
                    <input
                      type="time"
                      value={newRescheduleTime}
                      onChange={(e) => setNewRescheduleTime(e.target.value)}
                      className="w-full bg-[#0c0e12] border border-[#272a35] rounded p-2 text-xs text-[#e8e6e3] font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#9ea2ad] mb-1">Catatan Alasan</label>
                  <input
                    type="text"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    className="w-full bg-[#0c0e12] border border-[#272a35] rounded p-2 text-xs text-[#e8e6e3] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232630]">
                <button
                  type="button"
                  onClick={() => setRescheduleBookingTarget(null)}
                  className="px-3 py-1.5 text-xs text-[#8e92a0] hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const success = await rescheduleBooking(
                      rescheduleBookingTarget.id,
                      newRescheduleDate,
                      newRescheduleTime,
                      newRescheduleBranch,
                      rescheduleReason
                    );
                    if (success) {
                      showToast(`✓ Jadwal antrean [${rescheduleBookingTarget.queue_number}] berhasil dipindahkan.`);
                      setRescheduleBookingTarget(null);
                    }
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-black bg-[#c59a45] hover:bg-[#d8ab52] rounded cursor-pointer"
                >
                  Simpan Jadwal Baru
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL SETUP TABEL BOOKINGS SUPABASE */}
        {showSqlSetupModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div
              className="bg-[#14161c] border border-[#2b2e3a] rounded max-w-2xl w-full my-6 overflow-hidden shadow-2xl space-y-4 p-5 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#232630] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <h3 className="text-sm sm:text-base font-bold text-[#f0eee9]">
                    Script SQL Tabel Bookings (Supabase)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSqlSetupModal(false)}
                  className="text-[#8e92a0] hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-[#9ea2ad] space-y-1.5 leading-relaxed">
                <p>
                  Untuk menghubungkan database cloud Supabase dengan website ini, ikuti 3 langkah mudah:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[#e8e6e3] pl-1 font-medium">
                  <li>Buka <strong>Supabase Dashboard</strong> Anda (tab <strong>SQL Editor</strong>).</li>
                  <li>Klik <strong>New Query</strong>, lalu tempelkan (paste) script SQL di bawah ini.</li>
                  <li>Klik tombol hijau <strong>RUN</strong> di Supabase. Selesai!</li>
                </ol>
              </div>

              <div className="relative">
                <pre className="bg-[#0b0c10] border border-[#252834] rounded p-3 text-[11px] font-mono text-[#a3a8b7] overflow-x-auto max-h-60 no-scrollbar select-all">
{`CREATE TABLE IF NOT EXISTS public.bookings (
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

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view bookings" ON public.bookings;
CREATE POLICY "Public can view bookings" ON public.bookings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
CREATE POLICY "Public can insert bookings" ON public.bookings FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public or admin can manage bookings" ON public.bookings;
CREATE POLICY "Public or admin can manage bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

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
END $$;`}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#232630]">
                <span className="text-[11px] text-[#717585]">
                  File sumber: <code className="text-[#c59a45]">/supabase/bookings.sql</code>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sql = `CREATE TABLE IF NOT EXISTS public.bookings (
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

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view bookings" ON public.bookings;
CREATE POLICY "Public can view bookings" ON public.bookings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
CREATE POLICY "Public can insert bookings" ON public.bookings FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public or admin can manage bookings" ON public.bookings;
CREATE POLICY "Public or admin can manage bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

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
END $$;`;
                      navigator.clipboard.writeText(sql);
                      setCopySqlSuccess(true);
                      setTimeout(() => setCopySqlSuccess(false), 3000);
                      showToast('✓ Script SQL berhasil disalin ke clipboard! Tempelkan di Supabase SQL Editor.');
                    }}
                    className="px-4 py-2 text-xs font-bold text-black bg-[#c59a45] hover:bg-[#d8ab52] rounded transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{copySqlSuccess ? '✓ Berhasil Disalin!' : '📋 Salin Seluruh Script SQL'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSqlSetupModal(false)}
                    className="px-3 py-2 text-xs text-[#8e92a0] hover:text-white bg-[#1a1c24] border border-[#2a2d39] rounded"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
