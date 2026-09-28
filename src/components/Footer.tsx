import React from 'react';

interface FooterProps {
  onOpenBooking: () => void;
  onOpenCheckStatus: () => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenBooking,
  onOpenCheckStatus,
}) => {
  return (
    <footer className="bg-[#0a0b0e] border-t border-[#1e2027] text-[#8e92a0] py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#181a21]">
          
          {/* Column 1: Brand & Policy */}
          <div className="md:col-span-5 space-y-4">
            <h3
              className="text-lg font-bold tracking-wider text-[#e8e6e3]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              NECIS BARBERSHOP
            </h3>
            <p className="text-xs leading-relaxed text-[#9ea2ad] max-w-sm">
              Layanan pangkas rambut pria presisi oleh <strong>Mas Anang</strong> dengan tarif merakyat Rp 8.000. Bebas pilih aneka model potongan rambut atau bawa contoh foto referensi sendiri.
            </p>
            <div className="p-3 bg-[#171212] border border-amber-950 rounded text-[11px] text-amber-300 max-w-sm">
              ⚠️ <strong>Ketentuan Gerai:</strong> Tidak melayani anak di bawah umur 5 tahun.
            </div>
          </div>

          {/* Column 2: 2 Cabang Links */}
          <div className="md:col-span-4 space-y-3 text-xs">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#c59a45]">
              Lokasi 2 Cabang Gerai
            </h4>
            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-[#12141a] border border-[#20222a] rounded">
                <span className="font-semibold text-[#f0eee9] block">
                  Cabang Grojokan (G) · Pagi – Sore
                </span>
                <span className="font-mono text-emerald-400 block text-[11px]">
                  08.00 – 17.00 WIB
                </span>
                <a
                  href="https://maps.app.goo.gl/gF4Q2mw2BbniD77r7"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[11px] text-[#c59a45] underline mt-1 inline-block"
                >
                  Buka Rute Google Maps Grojokan ↗
                </a>
              </div>

              <div className="p-2.5 bg-[#12141a] border border-[#20222a] rounded">
                <span className="font-semibold text-[#f0eee9] block">
                  Cabang Tugurejo (T) · Sesi Malam
                </span>
                <span className="font-mono text-amber-400 block text-[11px]">
                  18.30 – 22.00 WIB
                </span>
                <a
                  href="https://maps.app.goo.gl/J7bj2fZEDMULgbsq5"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[11px] text-[#c59a45] underline mt-1 inline-block"
                >
                  Buka Rute Google Maps Tugurejo ↗
                </a>
              </div>
            </div>
          </div>

          {/* Column 3: Actions */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#c59a45]">
              Aksi Cepat
            </h4>
            <div className="space-y-2.5">
              <button
                onClick={onOpenBooking}
                className="w-full py-2.5 px-4 text-xs font-semibold text-black bg-[#c59a45] hover:bg-[#d8ab52] rounded transition-colors text-center cursor-pointer"
              >
                Booking Potong Rambut (8k)
              </button>
              <button
                onClick={onOpenCheckStatus}
                className="w-full py-2 px-4 text-xs font-medium text-[#9ea2ad] hover:text-[#e8e6e3] border border-[#272a34] rounded transition-colors text-center cursor-pointer"
              >
                Cek Tiket Booking Anda
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#626673] gap-4">
          <p>© {new Date().getFullYear()} Necis Barbershop Kediri. Capster: Mas Anang.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Tarif Flat Rp 8.000</span>
            <span aria-hidden="true">·</span>
            <span>2 Cabang Aktif</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
