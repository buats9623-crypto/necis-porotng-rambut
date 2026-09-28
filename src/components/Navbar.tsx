import React, { useState } from 'react';

interface NavbarProps {
  onOpenBooking: () => void;
  onOpenCheckStatus: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBooking,
  onOpenCheckStatus,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0e0f12]/95 backdrop-blur-md border-b border-[#22242c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#"
            className="text-xl sm:text-2xl font-bold tracking-wider text-[#e8e6e3] hover:text-[#c59a45] transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            NECIS BARBERSHOP
          </a>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#9ea2ad]">
            <a href="#layanan" className="hover:text-[#e8e6e3] transition-colors">
              Tarif & Layanan
            </a>
            <a href="#capster" className="hover:text-[#e8e6e3] transition-colors">
              Capster Anang
            </a>
            <a href="#model-rambut" className="hover:text-[#e8e6e3] transition-colors">
              Pilihan Model Rambut
            </a>
            <a href="#cabang" className="hover:text-[#e8e6e3] transition-colors">
              2 Cabang & Lokasi
            </a>
          </nav>

          {/* Zone 3: Action buttons group - berdampingan dekat */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenCheckStatus}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-medium text-[#d8d5ce] hover:text-[#c59a45] border border-[#2d3039] hover:border-[#c59a45]/60 transition-colors rounded cursor-pointer whitespace-nowrap"
            >
              Cek Booking
            </button>
            <button
              onClick={onOpenBooking}
              className="px-3.5 py-1.5 sm:px-5 sm:py-2 text-xs font-semibold tracking-wider text-black bg-[#c59a45] hover:bg-[#d8ab52] transition-colors rounded cursor-pointer whitespace-nowrap shadow-sm shadow-[#c59a45]/15"
            >
              Reservasi
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 sm:p-2 text-[#9ea2ad] hover:text-[#e8e6e3] focus:outline-none lg:hidden cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#22242c] py-4 space-y-3">
            <a
              href="#layanan"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-[#9ea2ad] hover:text-[#e8e6e3] py-1"
            >
              Tarif & Layanan
            </a>
            <a
              href="#capster"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-[#9ea2ad] hover:text-[#e8e6e3] py-1"
            >
              Capster Anang
            </a>
            <a
              href="#model-rambut"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-[#9ea2ad] hover:text-[#e8e6e3] py-1"
            >
              Contoh Model Rambut
            </a>
            <a
              href="#cabang"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-[#9ea2ad] hover:text-[#e8e6e3] py-1"
            >
              2 Cabang & Jam Operasional
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCheckStatus();
              }}
              className="block w-full text-left text-sm text-[#9ea2ad] hover:text-[#e8e6e3] py-1 cursor-pointer"
            >
              Cek Status Booking
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
