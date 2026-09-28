import React, { useState } from 'react';
import { useBarbershop } from '../context/BarbershopContext';
import { BookingRecord, getStatusLabel, getStatusBadgeClass } from '../types';

interface BookingStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingStatusModal: React.FC<BookingStatusModalProps> = ({ isOpen, onClose }) => {
  const { getBookingByCodeOrPhone, generateWhatsAppUrl } = useBarbershop();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<BookingRecord[] | null>(null);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const found = getBookingByCodeOrPhone(searchQuery);
    setResults(found);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="bg-[#14161c] border border-[#2b2e3a] rounded max-w-xl w-full my-8 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#232630] flex items-center justify-between bg-[#111318]">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#c59a45] font-semibold block">
              Necis Barbershop Kediri
            </span>
            <h2
              className="text-xl font-bold text-[#f0eee9]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Cek Tiket Reservasi Potong Rambut
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8e92a0] hover:text-white p-2 rounded cursor-pointer"
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6">
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-xs text-[#9ea2ad]">
              Masukkan <strong className="text-[#e8e6e3]">Nomor Antrean</strong> (contoh: <span className="font-mono text-[#c59a45]">G-001</span> atau <span className="font-mono text-[#c59a45]">T-001</span>) atau <strong className="text-[#e8e6e3]">Nomor WhatsApp</strong>:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Nomor antrean (G-001) / No WhatsApp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-[#0f1115] border border-[#262832] rounded px-3.5 py-2.5 text-xs text-[#e8e6e3] focus:border-[#c59a45] focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-black bg-[#c59a45] hover:bg-[#d8ab52] rounded cursor-pointer"
              >
                Cari Status
              </button>
            </div>
          </form>

          {/* Search Results */}
          {results !== null && (
            <div className="space-y-4 pt-2">
              {results.length === 0 ? (
                <div className="p-6 text-center border border-[#232630] bg-[#101217] rounded space-y-2">
                  <p className="text-sm font-medium text-[#f0eee9]">Tidak Ada Reservasi Ditemukan</p>
                  <p className="text-xs text-[#828694]">
                    Pastikan nomor antrean atau nomor WhatsApp sudah sesuai dengan yang didaftarkan.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-[#9ea2ad]">
                    Ditemukan <strong className="text-[#e8e6e3]">{results.length}</strong> tiket reservasi:
                  </p>
                  {results.map((booking) => {
                    const normStat = booking.status || booking.status_booking || 'waiting';
                    const qCode = booking.queue_number || booking.booking_code || 'G-001';
                    const cName = booking.customer_name || booking.nama_pelanggan || 'Pelanggan';
                    const cPhone = booking.customer_phone || booking.no_whatsapp || '';
                    const bDate = booking.booking_date || booking.tanggal_booking || '';
                    const bTime = booking.booking_time || booking.jam_mulai || '';
                    const bBranch = booking.nama_cabang || (booking.branch_id === 'tugurejo' ? 'Cabang Tugurejo' : 'Cabang Grojokan');
                    const hairModel = booking.hairstyle_model || booking.model_rambut_pilihan || 'Potong Rambut';

                    return (
                      <div
                        key={booking.id}
                        className="p-5 bg-[#161820] border border-[#272a35] rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-[#232631] pb-3">
                          <div>
                            <span className="text-[10px] text-[#797d8c] block uppercase tracking-wider font-mono">
                              Nomor Antrean
                            </span>
                            <span className="font-mono font-bold text-base text-[#c59a45]">
                              {qCode}
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded border ${getStatusBadgeClass(
                              normStat
                            )}`}
                          >
                            {getStatusLabel(normStat)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-[#9ea2ad]">
                          <div>
                            <span className="text-[10px] text-[#6d717f] block">Pelanggan</span>
                            <span className="font-medium text-[#f0eee9]">{cName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#6d717f] block">WhatsApp</span>
                            <span className="font-mono text-[#f0eee9]">{cPhone}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#6d717f] block">Lokasi Cabang</span>
                            <span className="font-medium text-[#c59a45]">{bBranch}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#6d717f] block">Jadwal Kedatangan</span>
                            <span className="font-medium text-[#f0eee9]">
                              {bDate} · {bTime} WIB
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-[#8a8e9d] pt-1">
                          <span className="text-[10px] text-[#6d717f] block">Model Rambut:</span>
                          <span className="text-[#f0eee9]">
                            {booking.has_custom_photo || booking.bawa_foto_sendiri
                              ? '📸 Bawa Foto Referensi Sendiri (Ditunjukkan di Gerai)'
                              : hairModel}
                          </span>
                        </div>

                        {normStat === 'cancelled' && (booking.cancel_reason || booking.alasan_batal) && (
                          <div className="p-2.5 bg-rose-950/30 border border-rose-900/60 rounded text-xs text-rose-300">
                            <strong>Alasan Pembatalan:</strong> {booking.cancel_reason || booking.alasan_batal}
                          </div>
                        )}

                        <div className="pt-2 border-t border-[#232630] flex items-center justify-between">
                          <span className="text-xs text-emerald-400 font-mono font-bold">
                            Tarif: Rp 8.000 (Bayar di tempat)
                          </span>
                          <a
                            href={generateWhatsAppUrl(booking)}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-xs text-[#c59a45] hover:underline"
                          >
                            Buka Bukti WA ↗
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
