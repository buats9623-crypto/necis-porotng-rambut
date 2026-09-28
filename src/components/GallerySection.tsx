import React, { useState } from 'react';
import { useBarbershop } from '../context/BarbershopContext';
import { HairstyleModelItem } from '../types';

interface GallerySectionProps {
  onSelectModelToBook: (modelName: string) => void;
  onOpenBookingWithCustomPhoto: () => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  onSelectModelToBook,
  onOpenBookingWithCustomPhoto,
}) => {
  const { hairstyleModels } = useBarbershop();
  const [activeModel, setActiveModel] = useState<HairstyleModelItem | null>(null);

  return (
    <section id="model-rambut" className="py-20 border-b border-[#22242c] bg-[#101217]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs uppercase tracking-widest text-[#c59a45] font-semibold">
            Katalog Referensi Gaya Rambut
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f3f2ee] mt-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Contoh Model Potongan Rambut Necis
          </h2>
          <p className="text-sm text-[#9ea2ad] mt-3 leading-relaxed">
            Berikut adalah deretan model potongan rambut populer yang siap dieksekusi oleh Mas Anang. Semua model memiliki tarif sama yaitu <strong>Rp 8.000</strong>. Anda juga bisa membawa foto referensi sendiri di luar daftar ini!
          </p>
        </div>

        {/* 8 Requested Hairstyle Models Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {hairstyleModels.map((item, index) => (
            <div
              key={item.id}
              className="group bg-[#14161c] border border-[#232630] rounded overflow-hidden hover:border-[#c59a45]/60 transition-colors flex flex-col justify-between"
            >
              <div>
                <div
                  className="relative aspect-[4/3] bg-[#1a1c23] overflow-hidden cursor-pointer"
                  onClick={() => setActiveModel(item)}
                >
                  <img
                    src={item.gambar_url}
                    alt={item.nama_model}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 left-2 bg-[#0e0f12]/85 backdrop-blur-sm px-2 py-0.5 text-[10px] text-[#c59a45] font-mono rounded">
                    Model {index + 1}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-[#c59a45] font-semibold">
                      {item.kategori}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">Rp 8k</span>
                  </div>

                  <h3
                    onClick={() => setActiveModel(item)}
                    className="text-sm font-bold text-[#f0eee9] group-hover:text-[#c59a45] transition-colors leading-snug cursor-pointer"
                  >
                    {item.nama_model}
                  </h3>

                  <p className="text-xs text-[#8c909e] line-clamp-2">
                    {item.deskripsi}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 mt-2">
                <button
                  onClick={() => onSelectModelToBook(item.nama_model)}
                  className="w-full py-2 text-xs font-semibold text-[#e8e6e3] hover:text-black bg-[#1e2129] hover:bg-[#c59a45] transition-colors rounded cursor-pointer"
                >
                  Pilih Model Ini →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* SPECIAL PROMINENT CARD: "Bawa Foto Referensi Sendiri" (As requested by user!) */}
        <div className="mt-10 p-6 sm:p-8 bg-[#151720] border-2 border-dashed border-[#c59a45]/50 rounded flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-lg font-bold text-[#f0eee9]">
              Ingin Model Lain di Luar Daftar Ini?
            </h3>
            <p className="text-xs sm:text-sm text-[#a5a9b8] leading-relaxed">
              Punya foto potongan rambut artis, influencer, atau foto dari Instagram / Pinterest di HP Anda? Cukup bawa dan tunjukkan gambarnya kepada <strong>Mas Anang</strong> saat tiba di gerai Necis Barbershop. Tarif tetap flat <strong>Rp 8.000</strong>!
            </p>
          </div>

          <button
            onClick={onOpenBookingWithCustomPhoto}
            className="w-full md:w-auto px-6 py-3.5 text-xs font-bold tracking-wider text-black bg-[#c59a45] hover:bg-[#d8ab52] transition-colors rounded whitespace-nowrap cursor-pointer shadow-lg shadow-[#c59a45]/15"
          >
            Booking & Tunjukkan Foto Sendiri →
          </button>
        </div>

      </div>

      {/* Model Detail Lightbox Modal */}
      {activeModel && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveModel(null)}
        >
          <div
            className="bg-[#14161c] border border-[#2b2e3a] rounded max-w-lg w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3] bg-black">
              <img
                src={activeModel.gambar_url}
                alt={activeModel.nama_model}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setActiveModel(null)}
                className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white p-2 rounded-full cursor-pointer text-xs"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#c59a45] font-semibold">
                  Kategori: {activeModel.kategori} · Tarif Rp 8.000
                </span>
                <h3 className="text-xl font-bold text-[#f0eee9] mt-1">
                  {activeModel.nama_model}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-[#9ea2ad] leading-relaxed">
                {activeModel.deskripsi}
              </p>

              <div className="p-3 bg-[#0f1116] border border-[#232630] rounded text-xs text-[#a3a7b5]">
                <strong className="text-[#f0eee9] block mb-0.5">Karakteristik Gaya:</strong>
                <span>{activeModel.karakteristik}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#232630]">
                <button
                  onClick={() => setActiveModel(null)}
                  className="px-4 py-2 text-xs text-[#9ea2ad] hover:text-white"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    const name = activeModel.nama_model;
                    setActiveModel(null);
                    onSelectModelToBook(name);
                  }}
                  className="px-5 py-2 text-xs font-bold text-black bg-[#c59a45] hover:bg-[#d8ab52] rounded"
                >
                  Pilih Model Ini (Rp 8k)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
