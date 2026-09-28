import React from 'react';
import { useBarbershop } from '../context/BarbershopContext';

interface BarbersSectionProps {
  onOpenBooking: () => void;
}

export const BarbersSection: React.FC<BarbersSectionProps> = ({ onOpenBooking }) => {
  const { barbers } = useBarbershop();
  const capsterAnang = barbers[0];

  return (
    <section id="capster" className="py-20 border-b border-[#22242c] bg-[#0e0f12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <p className="text-xs uppercase tracking-widest text-[#c59a45] font-semibold">
            Capster Tunggal
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f3f2ee] mt-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Mengenal Mas Anang
          </h2>
          <p className="text-sm text-[#9ea2ad] mt-3 leading-relaxed">
            Necis Barbershop ditangani secara personal oleh satu orang capster berpengalaman, memastikan kualitas hasil pangkas rambut selalu konsisten, teliti, dan rapi sesuai keinginan Anda.
          </p>
        </div>

        {/* Sole Barber Profile Showcase */}
        <div className="max-w-4xl bg-[#14161c] border border-[#232630] rounded overflow-hidden flex flex-col md:flex-row items-stretch">
          
          {/* Barber Portrait */}
          <div className="md:w-5/12 relative aspect-[4/3] md:aspect-auto bg-[#1a1c23]">
            <img
              src={capsterAnang?.foto_url || '/src/assets/images/haircut_fade_classic_1790486981801.jpg'}
              alt="Mas Anang - Capster Tunggal Necis Barbershop"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-3 left-3 bg-[#0e0f12]/90 backdrop-blur-sm border border-[#2b2e38] px-2.5 py-1 text-[11px] text-[#c59a45] font-medium rounded">
              Capster & Pemilik Gerai
            </div>
          </div>

          {/* Barber Details */}
          <div className="md:w-7/12 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-[#232630] pb-3">
                <div>
                  <h3 className="text-2xl font-bold text-[#f0eee9]">
                    Mas Anang
                  </h3>
                  <span className="text-xs text-[#c59a45] font-medium block mt-0.5">
                    Spesialis Semua Model Cukur Pria & Foto Referensi
                  </span>
                </div>
                <span className="text-xs font-mono text-[#9ea2ad] text-right ml-auto shrink-0 translate-x-1 sm:translate-x-1.5">
                  7+ Tahun Pengalaman
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#a2a6b4] leading-relaxed">
                "Bagi saya, pangkas rambut bukan sekadar memendekkan rambut, melainkan mencocokkan karakter dan rasa percaya diri pelanggan. Mau model fade tipis, crop bertekstur, buzz cut militer, mullet, atau punya contoh foto sendiri di HP? Jangan ragu tunjukkan ke saya saat duduk di kursi cukur."
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-[#9ea2ad]">
                <div className="p-2.5 bg-[#0f1116] border border-[#20222a] rounded">
                  <span className="text-[#f0eee9] font-medium block">Keahlian Teknik:</span>
                  <span className="text-[11px] text-[#868a98]">Clipper fade, scissor over comb, razor edge-up, texturing.</span>
                </div>
                <div className="p-2.5 bg-[#0f1116] border border-[#20222a] rounded">
                  <span className="text-[#f0eee9] font-medium block">Ketelitian & Kerapian:</span>
                  <span className="text-[11px] text-[#868a98]">Setiap helai dicek simetris, rapi, dan nyaman dipakai sehari-hari.</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#20222a] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#717584]">
                Melayani di Cabang 1 & Cabang 2 sesuai jadwal
              </span>
              <button
                onClick={onOpenBooking}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-black bg-[#c59a45] hover:bg-[#d8ab52] rounded transition-colors cursor-pointer"
              >
                Pilih Jadwal Bersama Mas Anang →
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
