import React, { useState, useEffect } from 'react';
import { useBarbershop } from '../context/BarbershopContext';
import { BookingRecord, getStatusLabel } from '../types';
import { HAIRSTYLE_MODELS } from '../data/initialData';
import { getTodayWIB, getBranchLiveStatus } from '../lib/branchHours';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBranchId?: string;
  preselectedModel?: string;
  isCustomPhotoSelected?: boolean;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  preselectedBranchId,
  preselectedModel,
  isCustomPhotoSelected,
}) => {
  const {
    branches,
    createBooking,
    getAvailableSlots,
    generateWhatsAppUrl,
  } = useBarbershop();

  const todayStr = getTodayWIB();

  const [selectedBranchId, setSelectedBranchId] = useState<string>('grojokan');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('Textured Crop / French Crop');
  const [isBawaFotoSendiri, setIsBawaFotoSendiri] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [ageConfirmed, setAgeConfirmed] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (preselectedBranchId) {
        let norm = preselectedBranchId;
        if (norm === 'cabang-2') norm = 'grojokan';
        if (norm === 'cabang-1') norm = 'tugurejo';
        setSelectedBranchId(norm);
      } else {
        setSelectedBranchId('grojokan');
      }

      if (isCustomPhotoSelected) {
        setIsBawaFotoSendiri(true);
        setSelectedModel('Bawa Foto Referensi Sendiri');
      } else if (preselectedModel) {
        setSelectedModel(preselectedModel);
        setIsBawaFotoSendiri(false);
      } else {
        setSelectedModel('Textured Crop / French Crop');
        setIsBawaFotoSendiri(false);
      }

      setSelectedDate(todayStr);
      setSelectedTimeSlot('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerNotes('');
      setAgeConfirmed(false);
      setErrorMsg('');
      setConfirmedBooking(null);
    }
  }, [isOpen, preselectedBranchId, preselectedModel, isCustomPhotoSelected, todayStr]);

  if (!isOpen) return null;

  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];
  const availableSlots = getAvailableSlots(selectedDate, selectedBranchId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedTimeSlot) {
      setErrorMsg('Silakan pilih salah satu slot jam kedatangan.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMsg('Nama pemesan wajib diisi.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 9 || cleanPhone.length > 15) {
      setErrorMsg('Nomor WhatsApp tidak valid (contoh: 081234567890).');
      return;
    }

    if (!ageConfirmed) {
      setErrorMsg('Anda wajib mengonfirmasi bahwa pelanggan berusia minimal 5 tahun (kebijakan gerai).');
      return;
    }

    setIsSubmitting(true);
    try {
      const booking = await createBooking({
        cabang_id: selectedBranchId,
        nama_pelanggan: customerName,
        no_whatsapp: customerPhone,
        tanggal_booking: selectedDate,
        jam_mulai: selectedTimeSlot,
        model_rambut_pilihan: isBawaFotoSendiri ? 'Bawa Foto Referensi Sendiri' : selectedModel,
        bawa_foto_sendiri: isBawaFotoSendiri,
        catatan_pelanggan: customerNotes,
        is_walkin: false,
      });

      setConfirmedBooking(booking);
    } catch {
      setErrorMsg('Terjadi kendala saat menyimpan reservasi. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="bg-[#14161c] border border-[#2b2e3a] rounded max-w-2xl w-full my-8 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#232630] flex items-center justify-between bg-[#111318]">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#c59a45] font-semibold block">
              Necis Barbershop · Capster Mas Anang
            </span>
            <h2
              className="text-xl sm:text-2xl font-bold text-[#f0eee9]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {confirmedBooking ? 'Reservasi Berhasil Dibuat' : 'Atur Jadwal Potong Rambut (Rp 8k)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8e92a0] hover:text-white p-2 rounded cursor-pointer"
            aria-label="Tutup form"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        {confirmedBooking ? (
          /* SUCCESS SCREEN */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="p-5 bg-[#191b22] border border-[#c59a45]/60 rounded-lg text-center space-y-2">
              <span className="text-xs uppercase tracking-widest text-[#c59a45] font-semibold">
                Nomor Antrean Resmi Anda
              </span>
              <p className="text-4xl font-mono font-bold text-[#f3f2ee] tracking-wider">
                {confirmedBooking.queue_number || confirmedBooking.booking_code}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="text-[#8e92a0]">Status Antrean:</span>
                <span className="text-amber-400 font-semibold px-2 py-0.5 bg-amber-950/40 border border-amber-800 rounded">
                  {getStatusLabel(confirmedBooking.status || confirmedBooking.status_booking || 'waiting')}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#a3a7b5] border-y border-[#232630] py-4">
              <div className="flex justify-between">
                <span>Nama Pelanggan:</span>
                <span className="font-medium text-[#f0eee9]">{confirmedBooking.customer_name || confirmedBooking.nama_pelanggan}</span>
              </div>
              <div className="flex justify-between">
                <span>Nomor WhatsApp:</span>
                <span className="font-mono text-[#f0eee9]">{confirmedBooking.customer_phone || confirmedBooking.no_whatsapp}</span>
              </div>
              <div className="flex justify-between">
                <span>Lokasi Cabang:</span>
                <span className="font-medium text-[#c59a45]">{confirmedBooking.nama_cabang}</span>
              </div>
              <div className="flex justify-between">
                <span>Capster Tunggal:</span>
                <span className="font-medium text-[#f0eee9]">Mas Anang (Capster &amp; Pemilik Gerai)</span>
              </div>
              <div className="flex justify-between">
                <span>Jadwal Potong:</span>
                <span className="font-medium text-[#f0eee9]">
                  {confirmedBooking.booking_date || confirmedBooking.tanggal_booking} · Pukul {confirmedBooking.booking_time || confirmedBooking.jam_mulai} WIB
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pilihan Model:</span>
                <span className="font-medium text-[#f0eee9]">
                  {confirmedBooking.has_custom_photo || confirmedBooking.bawa_foto_sendiri
                    ? '📸 Bawa Foto Referensi Sendiri (Ditunjukkan di gerai)'
                    : (confirmedBooking.hairstyle_model || confirmedBooking.model_rambut_pilihan)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-[#22242d] text-[#e8e6e3]">
                <span>Tarif Biaya (Bayar di Tempat):</span>
                <span className="text-emerald-400 font-mono tabular-nums text-base">
                  Rp 8.000
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-[#1b1414] border border-amber-900/60 rounded text-xs text-amber-200">
              <strong>Pengingat Penting:</strong> Tempat cukur ini tidak melayani anak di bawah umur 5 tahun. Harap hadir 5 menit sebelum jam jadwal Anda.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={generateWhatsAppUrl(confirmedBooking)}
                target="_blank"
                rel="noreferrer noopener"
                className="flex-1 py-3 px-4 text-xs font-bold text-black bg-[#25D366] hover:bg-[#22bf5c] rounded text-center transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Kirim &amp; Konfirmasi ke WhatsApp Mas Anang →</span>
              </a>
              <button
                onClick={onClose}
                className="py-3 px-5 text-xs font-medium text-[#9ea2ad] hover:text-white border border-[#2d3039] rounded cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          /* RESERVATION FORM */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            
            {errorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 text-xs text-rose-300 rounded">
                {errorMsg}
              </div>
            )}

            {/* Step 1: Pilih Cabang */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#c59a45] mb-2">
                1. Pilih Lokasi Cabang &amp; Sesi Waktu
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {branches.map((br) => {
                  const isSelected = selectedBranchId === br.id;
                  const live = getBranchLiveStatus(br.jam_buka, br.jam_tutup);
                  return (
                    <div
                      key={br.id}
                      onClick={() => {
                        setSelectedBranchId(br.id);
                        setSelectedTimeSlot(''); // reset slot when branch changes
                      }}
                      className={`p-3.5 rounded-lg border text-left cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-[#c59a45] bg-[#1d1f27]'
                          : 'border-[#22242e] bg-[#14161b] hover:border-[#333744]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[#f0eee9]">
                          {br.nama_cabang}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border flex items-center gap-1 ${live.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${live.dotClass}`}></span>
                          <span>{live.statusText}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-[#c59a45] font-semibold">{br.label_waktu}</p>
                      <p className="text-[11px] text-[#8e92a0] mt-0.5">{br.keterangan}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#7d8190] mt-1.5">
                Capster tunggal yang melayani di kedua cabang adalah <strong>Mas Anang</strong>.
              </p>
            </div>

            {/* Step 2: Layanan & Tarif (Single 8k) */}
            <div className="p-3.5 bg-[#0f1116] border border-[#232630] rounded flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#f0eee9] block">
                  Layanan: Potong Rambut
                </span>
                <span className="text-[11px] text-[#8e92a0]">
                  Capster: Mas Anang · Estimasi 20–30 menit
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-mono font-bold text-emerald-400">
                  Rp 8.000
                </span>
                <span className="block text-[10px] text-[#717582]">Bayar di kasir</span>
              </div>
            </div>

            {/* Step 3: Pilih Model Rambut atau Foto Sendiri */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#c59a45]">
                  2. Model Potongan Rambut
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[#e8e6e3]">
                  <input
                    type="checkbox"
                    checked={isBawaFotoSendiri}
                    onChange={(e) => {
                      setIsBawaFotoSendiri(e.target.checked);
                      if (e.target.checked) {
                        setSelectedModel('Bawa Foto Referensi Sendiri');
                      }
                    }}
                    className="accent-[#c59a45]"
                  />
                  <span className="text-[#c59a45] font-semibold">Tunjukkan Foto dari HP Saya</span>
                </label>
              </div>

              {!isBawaFotoSendiri ? (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#0f1115] border border-[#262832] rounded p-2.5 text-xs text-[#e8e6e3] focus:border-[#c59a45] focus:outline-none"
                >
                  {HAIRSTYLE_MODELS.map((m) => (
                    <option key={m.id} value={m.nama_model}>
                      {m.nama_model} ({m.kategori})
                    </option>
                  ))}
                  <option value="Bawa Foto Referensi Sendiri">📸 Bawa Foto Referensi Sendiri (Tunjukkan di Gerai)</option>
                </select>
              ) : (
                <div className="p-3 bg-[#171922] border border-[#c59a45]/40 rounded text-xs text-[#a2a6b5] space-y-1">
                  <p className="font-semibold text-[#f0eee9]">
                    📸 Mode Foto Referensi Sendiri Dipilih
                  </p>
                  <p className="text-[11px]">
                    Anda cukup menyimpan contoh gambar model rambut yang diinginkan di galeri HP Anda dan menunjukkannya kepada Mas Anang saat tiba di gerai.
                  </p>
                </div>
              )}
            </div>

            {/* Step 4: Pilih Tanggal & Slot Jam */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#c59a45] mb-2">
                  3. Tanggal Kunjungan
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTimeSlot('');
                  }}
                  className="w-full bg-[#0f1115] border border-[#262832] rounded p-2.5 text-xs text-[#e8e6e3] focus:border-[#c59a45] focus:outline-none font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#c59a45]">
                    4. Jam Operasional
                  </label>
                  <span className="text-[10px] font-mono text-[#8a8e9e]">
                    {currentBranch.jam_operasional}
                  </span>
                </div>

                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-1.5 border border-[#232630] rounded bg-[#0f1115]">
                    {availableSlots.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`py-1.5 px-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer text-center ${
                          selectedTimeSlot === slot
                            ? 'bg-[#c59a45] text-black font-bold'
                            : 'bg-[#181a20] text-[#9ea2ad] hover:text-white hover:bg-[#252833]'
                        }`}
                      >
                        {slot} WIB
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-xs text-amber-400 bg-amber-950/30 border border-amber-900/60 rounded">
                    Tidak ada slot kosong yang tersedia pada tanggal ini.
                  </div>
                )}
              </div>
            </div>

            {/* Step 5: Data Kontak Pemesan */}
            <div className="space-y-3 pt-2 border-t border-[#22242d]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#c59a45]">
                5. Data Kontak Pemesan
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-[#8c909e] block mb-1">Nama Lengkap *</span>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rian Pratama"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#0f1115] border border-[#262832] rounded p-2.5 text-xs text-[#e8e6e3] focus:border-[#c59a45] focus:outline-none"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-[#8c909e] block mb-1">Nomor WhatsApp Aktif *</span>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 08123456789"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#0f1115] border border-[#262832] rounded p-2.5 text-xs text-[#e8e6e3] focus:border-[#c59a45] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[#8c909e] block mb-1">Catatan Tambahan (Opsional)</span>
                <input
                  type="text"
                  placeholder="Contoh: Bagian samping dibuat taper tipis"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full bg-[#0f1115] border border-[#262832] rounded p-2.5 text-xs text-[#e8e6e3] focus:border-[#c59a45] focus:outline-none"
                />
              </div>

              {/* CRUCIAL AGE RULE CONFIRMATION */}
              <div className="p-3 bg-[#1d1414] border border-amber-900 rounded">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    required
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="mt-0.5 accent-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-amber-200">
                    <strong className="text-amber-100 block mb-0.5">Konfirmasi Kebijakan Usia:</strong>
                    Saya mengonfirmasi bahwa pelanggan yang akan dicukur berusia <strong>minimal 5 tahun ke atas</strong> (tempat cukur ini tidak melayani anak di bawah umur 5 tahun).
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#232630]">
              <div className="text-xs text-[#7e8291]">
                Total: <strong className="text-emerald-400 font-mono text-sm">Rp 8.000</strong> (Bayar di tempat)
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-[#9ea2ad] hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold tracking-wider text-black bg-[#c59a45] hover:bg-[#d8ab52] transition-colors rounded cursor-pointer"
                >
                  Kirim Reservasi (Rp 8k)
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
