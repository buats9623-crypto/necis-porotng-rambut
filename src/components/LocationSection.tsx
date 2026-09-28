import React from 'react';
import { useBarbershop } from '../context/BarbershopContext';
import { getBranchLiveStatus } from '../lib/branchHours';

interface LocationSectionProps {
  onOpenBookingForBranch?: (branchId: string) => void;
}

export const LocationSection: React.FC<LocationSectionProps> = ({ onOpenBookingForBranch }) => {
  const { shopConfig, branches } = useBarbershop();

  const grojokanBranch = branches.find((b) => b.id === 'grojokan') || branches[0];
  const tugurejoBranch = branches.find((b) => b.id === 'tugurejo') || branches[1];

  const grojokanLive = getBranchLiveStatus(grojokanBranch?.jam_buka || '08:00', grojokanBranch?.jam_tutup || '17:00');
  const tugurejoLive = getBranchLiveStatus(tugurejoBranch?.jam_buka || '18:30', tugurejoBranch?.jam_tutup || '22:00');

  return (
    <section id="cabang" className="py-20 border-b border-[#22242c] bg-[#0e0f12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs uppercase tracking-widest text-[#c59a45] font-semibold">
            2 Lokasi Gerai &amp; Jam Kerja
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f3f2ee] mt-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Pilihan 2 Cabang: Grojokan &amp; Tugurejo
          </h2>
          <p className="text-sm text-[#9ea2ad] mt-3 leading-relaxed">
            Mas Anang melayani pelanggan di 2 cabang resmi dengan pembagian jam operasional yang berbeda. Status buka/tutup dihitung secara otomatis mengikuti waktu Indonesia (WIB).
          </p>
        </div>

        {/* 2 Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* CABANG GROJOKAN: Pagi - Sore (08.00 - 17.00) */}
          <div className="bg-[#14161c] border-2 border-[#262833] hover:border-[#c59a45]/50 transition-colors rounded p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-[#232630] pb-4">
                <div>
                  <span className="font-mono text-[10px] text-[#c59a45] uppercase tracking-wider block font-bold">
                    Cabang 1 · Kode Antrean G
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-[#f0eee9]">
                    Cabang Grojokan
                  </h3>
                </div>
                <div className="text-right space-y-1">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded border inline-flex items-center gap-1.5 ${grojokanLive.badgeClass}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${grojokanLive.dotClass}`}></span>
                    <span>{grojokanLive.statusText}</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#8e92a0] block">
                    08.00 – 17.00 WIB
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#9ea2ad]">
                <p className="text-xs uppercase tracking-wider text-[#858997]">
                  Jam Buka Operasional:
                </p>
                <p
                  className="text-lg sm:text-xl font-bold text-[#f0eee9] tracking-wide"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Pukul <span className="text-emerald-400 font-semibold">08.00 Pagi</span> – <span className="text-emerald-400 font-semibold">17.00</span>
                  <br />
                  <span className="text-emerald-400 font-semibold">Sore</span> WIB
                </p>
                <p className="text-[#868a98] pt-1">
                  Cocok untuk Anda yang ingin potong rambut di pagi, siang, atau sore hari sebelum petang.
                </p>
              </div>

              <div className="p-3 bg-[#0d0f14] border border-[#20222a] rounded space-y-2 text-xs">
                <span className="text-[#7c808f] block">Tautan Lokasi Navigasi:</span>
                <a
                  href="https://maps.app.goo.gl/gF4Q2mw2BbniD77r7"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs text-[#c59a45] hover:text-[#d8ab52] underline font-mono break-all block"
                >
                  https://maps.app.goo.gl/gF4Q2mw2BbniD77r7 ↗
                </a>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#20222a]">
              <a
                href="https://maps.app.goo.gl/gF4Q2mw2BbniD77r7"
                target="_blank"
                rel="noreferrer noopener"
                className="w-full py-2.5 px-4 text-xs font-semibold text-[#e8e6e3] hover:text-black bg-[#1f222a] hover:bg-[#c59a45] transition-colors rounded text-center block cursor-pointer"
              >
                Buka Peta Google Maps Grojokan ↗
              </a>
              {onOpenBookingForBranch && (
                <button
                  onClick={() => onOpenBookingForBranch('grojokan')}
                  className="w-full py-2.5 px-4 text-xs font-bold text-black bg-[#c59a45] hover:bg-[#d8ab52] rounded transition-colors cursor-pointer"
                >
                  Pilih Antrean di Cabang Grojokan (08.00–17.00)
                </button>
              )}
            </div>
          </div>

          {/* CABANG TUGUREJO: Malam (18.30 - 22.00) */}
          <div className="bg-[#14161c] border-2 border-[#262833] hover:border-[#c59a45]/50 transition-colors rounded p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-[#232630] pb-4">
                <div>
                  <span className="font-mono text-[10px] text-[#c59a45] uppercase tracking-wider block font-bold">
                    Cabang 2 · Kode Antrean T
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-[#f0eee9]">
                    Cabang Tugurejo
                  </h3>
                </div>
                <div className="text-right space-y-1">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded border inline-flex items-center gap-1.5 ${tugurejoLive.badgeClass}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${tugurejoLive.dotClass}`}></span>
                    <span>{tugurejoLive.statusText}</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#8e92a0] block">
                    18.30 – 22.00 WIB
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#9ea2ad]">
                <p className="text-xs uppercase tracking-wider text-[#858997]">
                  Jam Buka Operasional:
                </p>
                <p
                  className="text-lg sm:text-xl font-bold text-[#f0eee9] tracking-wide"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Pukul <span className="text-amber-400 font-semibold">18.30 Malam</span> – <span className="text-amber-400 font-semibold">22.00</span>
                  <br />
                  <span className="text-amber-400 font-semibold">Malam</span> WIB
                </p>
                <p className="text-[#868a98] pt-1">
                  Sangat pas bagi Anda yang baru pulang beraktivitas atau bekerja di malam hari.
                </p>
              </div>

              <div className="p-3 bg-[#0d0f14] border border-[#20222a] rounded space-y-2 text-xs">
                <span className="text-[#7c808f] block">Tautan Lokasi Navigasi:</span>
                <a
                  href="https://maps.app.goo.gl/J7bj2fZEDMULgbsq5"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs text-[#c59a45] hover:text-[#d8ab52] underline font-mono break-all block"
                >
                  https://maps.app.goo.gl/J7bj2fZEDMULgbsq5 ↗
                </a>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#20222a]">
              <a
                href="https://maps.app.goo.gl/J7bj2fZEDMULgbsq5"
                target="_blank"
                rel="noreferrer noopener"
                className="w-full py-2.5 px-4 text-xs font-semibold text-[#e8e6e3] hover:text-black bg-[#1f222a] hover:bg-[#c59a45] transition-colors rounded text-center block cursor-pointer"
              >
                Buka Peta Google Maps Tugurejo ↗
              </a>
              {onOpenBookingForBranch && (
                <button
                  onClick={() => onOpenBookingForBranch('tugurejo')}
                  className="w-full py-2.5 px-4 text-xs font-bold text-black bg-[#c59a45] hover:bg-[#d8ab52] rounded transition-colors cursor-pointer"
                >
                  Pilih Antrean di Cabang Tugurejo (18.30–22.00)
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Syarat Usia Announcement Box */}
        <div className="mt-10 p-5 bg-[#1b1414] border border-amber-900/80 rounded flex items-start gap-4">
          <span className="text-2xl leading-none">⚠️</span>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-200">
              Pemberitahuan Kebijakan Usia Pelanggan:
            </h4>
            <p className="text-xs text-amber-300/90 leading-relaxed">
              <strong>Tempat cukur ini tidak melayani anak di bawah umur 5 tahun.</strong> Mohon memastikan pelanggan yang akan dipotong rambut telah berusia 5 tahun ke atas demi kenyamanan dan keselamatan proses pencukuran.
            </p>
          </div>
        </div>

        {/* WhatsApp Contact Bar */}
        <div className="mt-8 p-6 bg-[#14161c] border border-[#232630] rounded flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-[#f0eee9]">
              Ada Pertanyaan Mengenai Rute atau Antrean?
            </h4>
            <p className="text-xs text-[#8e92a0] mt-0.5">
              Hubungi Mas Anang langsung via WhatsApp untuk panduan arah atau memastikan antrean di gerai.
            </p>
          </div>

          <a
            href={`https://wa.me/${shopConfig.telepon_whatsapp}?text=${encodeURIComponent('Halo Mas Anang, saya ingin bertanya seputar rute lokasi atau antrean Necis Barbershop.')}`}
            target="_blank"
            rel="noreferrer noopener"
            className="px-5 py-2.5 text-xs font-semibold text-black bg-[#25D366] hover:bg-[#20ba59] rounded flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Chat WhatsApp Mas Anang</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>

      </div>
    </section>
  );
};
