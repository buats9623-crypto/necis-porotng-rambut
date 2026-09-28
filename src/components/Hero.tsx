import React from 'react';
import { useBarbershop } from '../context/BarbershopContext';
import { getBranchLiveStatus } from '../lib/branchHours';

interface HeroProps {
  onOpenBooking: () => void;
  onOpenCheckStatus: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking, onOpenCheckStatus }) => {
  const { shopConfig, heroImage } = useBarbershop();

  const grojokanLive = getBranchLiveStatus('08:00', '17:00');
  const tugurejoLive = getBranchLiveStatus('18:30', '22:00');

  return (
    <section className="relative border-b border-[#22242c] overflow-hidden bg-[#0e0f12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Proposition, 2 Branches & Age Notice */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Unboxed editorial badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-[#9ea2ad]">
              <span className="text-[#c59a45] font-semibold">Necis Barbershop Kediri</span>
              <span aria-hidden="true">·</span>
              <span>Capster Tunggal: Mas Anang</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-mono font-bold">Tarif Rp 8.000</span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#f3f2ee] leading-[1.12]"
              style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
            >
              Potong Rambut <span className="text-[#c59a45]">Rp 8.000</span> Saja
            </h1>

            <p className="text-base sm:text-lg text-[#a2a6b2] leading-relaxed max-w-2xl">
              Dikerjakan langsung dan teliti oleh <strong className="text-[#f0eee9]">Mas Anang</strong>. Bebas pilih aneka model kekinian (Crop, Fade, Buzz Cut, Mullet, dll.) atau cukup tunjukkan foto referensi model rambut dari ponsel Anda.
            </p>

            {/* Syarat Umur & 2 Cabang Banner */}
            <div className="space-y-3 pt-1 pb-2">
              {/* Syarat Khusus Usia */}
              <div className="p-3 bg-[#1d1616] border border-amber-900/60 rounded text-xs text-amber-200 flex items-start gap-2.5">
                <span className="text-base leading-none">⚠️</span>
                <div>
                  <strong className="text-amber-100 block">Kebijakan Gerai:</strong>
                  <span>Tempat cukur ini tidak melayani anak di bawah umur 5 tahun.</span>
                </div>
              </div>

              {/* 2 Cabang Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 bg-[#14161c] border border-[#262832] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#c59a45]">
                      Cabang Grojokan (G)
                    </span>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${grojokanLive.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${grojokanLive.dotClass}`}></span>
                      <span>{grojokanLive.statusText}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#f0eee9] font-mono">08.00 – 17.00 WIB (Pagi – Sore)</p>
                  <p className="text-[11px] text-[#8e92a0]">Sesi potong rambut pagi hingga sore.</p>
                  <a
                    href="https://maps.app.goo.gl/gF4Q2mw2BbniD77r7"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[11px] text-[#9ea2ad] hover:text-[#c59a45] underline inline-block"
                  >
                    Buka Google Maps Grojokan →
                  </a>
                </div>

                <div className="p-3.5 bg-[#14161c] border border-[#262832] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#c59a45]">
                      Cabang Tugurejo (T)
                    </span>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${tugurejoLive.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tugurejoLive.dotClass}`}></span>
                      <span>{tugurejoLive.statusText}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#f0eee9] font-mono">18.30 – 22.00 WIB (Malam)</p>
                  <p className="text-[11px] text-[#8e92a0]">Sesi potong rambut malam hari.</p>
                  <a
                    href="https://maps.app.goo.gl/J7bj2fZEDMULgbsq5"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[11px] text-[#9ea2ad] hover:text-[#c59a45] underline inline-block"
                  >
                    Buka Google Maps Tugurejo →
                  </a>
                </div>
              </div>
            </div>

            {/* Decision Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={onOpenBooking}
                className="px-7 py-3.5 text-sm font-bold tracking-wider text-black bg-[#c59a45] hover:bg-[#d8ab52] transition-colors rounded text-center cursor-pointer whitespace-nowrap shadow-lg shadow-[#c59a45]/10"
              >
                Reservasi Jadwal (Rp 8.000)
              </button>
              
              <button
                onClick={onOpenCheckStatus}
                className="px-5 py-3.5 text-sm font-medium text-[#e8e6e3] hover:text-white border border-[#2d3039] hover:border-[#424652] transition-colors rounded text-center cursor-pointer whitespace-nowrap"
              >
                Cek Kode Booking
              </button>

              <a
                href={`https://wa.me/${shopConfig.telepon_whatsapp}?text=${encodeURIComponent('Halo Mas Anang (Necis Barbershop), saya ingin tanya antrean potong rambut.')}`}
                target="_blank"
                rel="noreferrer noopener"
                className="px-3 py-3.5 text-xs text-[#9ea2ad] hover:text-[#c59a45] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Chat Mas Anang di WA</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          {/* Right Column: Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative border border-[#262832] rounded overflow-hidden shadow-2xl bg-[#14161b]">
              <img
                src={heroImage}
                alt="Hasil potongan rambut rapi presisi di Necis Barbershop oleh Mas Anang"
                className="w-full aspect-[4/3] object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="p-4 border-t border-[#262832] bg-[#12141a] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#f0eee9]">Necis Barbershop</span>
                  <span className="text-sm font-mono font-bold text-[#c59a45] tabular-nums">
                    Rp 8.000 / Potong
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#8e92a0]">
                  <span>Capster: Mas Anang</span>
                  <span className="text-amber-400">Bisa request sesuai foto HP</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
