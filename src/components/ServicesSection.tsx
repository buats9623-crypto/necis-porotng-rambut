import React from 'react';

interface ServicesSectionProps {
  onOpenBooking: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onOpenBooking }) => {
  return (
    <section id="layanan" className="py-20 border-b border-[#22242c] bg-[#101217]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <p className="text-xs uppercase tracking-widest text-[#c59a45] font-semibold">
            Tarif & Layanan
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f3f2ee] mt-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Satu Layanan Praktis & Terjangkau
          </h2>
          <p className="text-sm text-[#9ea2ad] mt-3 leading-relaxed">
            Necis Barbershop fokus memberikan potongan rambut terbaik tanpa kerumitan paket. Semua model rambut dilayani dengan standar ketelitian tinggi oleh Mas Anang.
          </p>
        </div>

        {/* Single Highlighted Service Card */}
        <div className="max-w-3xl bg-[#14161c] border border-[#c59a45]/40 rounded p-6 sm:p-8 relative overflow-hidden shadow-xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242732] pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-[#f0eee9]">
                  Potong Rambut
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#c59a45]/15 text-[#c59a45] border border-[#c59a45]/30 rounded">
                  Layanan Utama
                </span>
              </div>
              <p className="text-xs text-[#8e92a0] mt-1.5">
                Ditangani langsung oleh Mas Anang · Estimasi waktu pengerjaan ± 20–30 menit
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-3xl sm:text-4xl font-mono font-bold text-[#c59a45] tabular-nums">
                Rp 8.000
              </span>
              <span className="block text-[11px] text-[#787c8b]">
                (Bayar langsung di tempat setelah selesai)
              </span>
            </div>
          </div>

          {/* Included Features & Model Freedom */}
          <div className="py-6 space-y-4 text-xs text-[#a1a5b3]">
            <p className="text-sm text-[#e8e6e3] font-medium">
              Yang Anda Dapatkan dengan Tarif Rp 8.000:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[#c59a45] font-bold">✓</span>
                <span>Bebas pilih model apa saja (Crop, Fade, Mullet, Buzz Cut, Quiff, dll.)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#c59a45] font-bold">✓</span>
                <span>Bisa bawa & tunjukkan foto referensi model rambut dari HP sendiri</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#c59a45] font-bold">✓</span>
                <span>Potongan presisi & pembersihan sisa rambut rapi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#c59a45] font-bold">✓</span>
                <span>Konsultasi gratis kecocokan bentuk wajah dengan gaya rambut</span>
              </div>
            </div>
          </div>

          {/* Important Age Rule Notice */}
          <div className="p-3.5 bg-[#1b1515] border border-amber-900/60 rounded text-xs text-amber-200 flex items-start gap-2.5 mb-6">
            <span className="text-base leading-none">⚠️</span>
            <div>
              <strong className="text-amber-100 block">Ketentuan Khusus Usia:</strong>
              <span>Tempat cukur ini tidak melayani anak di bawah umur 5 tahun.</span>
            </div>
          </div>

          {/* Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <span className="text-xs text-[#787c8b]">
              Pilih waktu kunjungan untuk menghindari antrean lama di gerai.
            </span>
            <button
              onClick={onOpenBooking}
              className="w-full sm:w-auto px-7 py-3 text-xs font-bold tracking-wider text-black bg-[#c59a45] hover:bg-[#d8ab52] transition-colors rounded cursor-pointer whitespace-nowrap"
            >
              Reservasi Potong Rambut Sekarang (Rp 8.000) →
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
