import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { BarbershopProvider } from './context/BarbershopContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { BarbersSection } from './components/BarbersSection';
import { GallerySection } from './components/GallerySection';
import { LocationSection } from './components/LocationSection';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { BookingStatusModal } from './components/BookingStatusModal';
import { AdminPanel } from './components/AdminPanel';
import { LoginPage } from './components/LoginPage';

type AppRoute = 'home' | 'login' | 'admin';

const getAppRoute = (): AppRoute => {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (path === '/login' || hash === '#/login' || hash === '#login') return 'login';
  if (path === '/admin' || hash === '#/admin' || hash === '#admin') return 'admin';
  return 'home';
};

export default function App() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getAppRoute);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [preselectedBranch, setPreselectedBranch] = useState<string | undefined>(undefined);
  const [preselectedModel, setPreselectedModel] = useState<string | undefined>(undefined);
  const [isCustomPhoto, setIsCustomPhoto] = useState<boolean>(false);

  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentRoute(getAppRoute());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentRoute(getAppRoute());
    window.scrollTo(0, 0);
  };

  // Redirect ke /admin jika user yang sudah login membuka /login
  useEffect(() => {
    if (currentRoute === 'login' && !authLoading && isAdmin) {
      navigateTo('/admin');
    }
  }, [currentRoute, authLoading, isAdmin]);

  // Protected Route: Redirect ke /login jika user belum login membuka /admin
  useEffect(() => {
    if (currentRoute === 'admin' && !authLoading && !isAdmin) {
      navigateTo('/login');
    }
  }, [currentRoute, authLoading, isAdmin]);

  const handleOpenBooking = (branchId?: string, model?: string, customPhoto?: boolean) => {
    setPreselectedBranch(branchId);
    setPreselectedModel(model);
    setIsCustomPhoto(!!customPhoto);
    setIsBookingOpen(true);
  };

  // 1. ROUTE /login: Halaman Login Supabase
  if (currentRoute === 'login') {
    if (!authLoading && isAdmin) {
      return null;
    }
    return (
      <LoginPage
        onLoginSuccess={() => navigateTo('/admin')}
        onNavigateHome={() => navigateTo('/')}
      />
    );
  }

  // 2. ROUTE /admin: Protected Admin Dashboard
  if (currentRoute === 'admin') {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-[#0e0f12] text-[#e8e6e3] flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#c59a45] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-[#8e92a0] font-mono tracking-wider">
              Memverifikasi sesi admin Supabase...
            </p>
          </div>
        </div>
      );
    }

    if (!isAdmin) {
      return null;
    }

    return (
      <BarbershopProvider>
        <AdminPanel
          isOpen={true}
          isStandalonePage={true}
          onClose={() => navigateTo('/login')}
          onNavigateHome={() => navigateTo('/')}
        />
      </BarbershopProvider>
    );
  }

  // 3. ROUTE /: Halaman Publik Utama
  return (
    <BarbershopProvider>
      <div className="min-h-screen flex flex-col bg-[#0e0f12] text-[#e8e6e3]">
        
        {/* Top Bar Navigation */}
        <Navbar
          onOpenBooking={() => handleOpenBooking()}
          onOpenCheckStatus={() => setIsStatusOpen(true)}
        />

        {/* Main Sections */}
        <main className="flex-1">
          {/* Hero Section */}
          <Hero
            onOpenBooking={() => handleOpenBooking()}
            onOpenCheckStatus={() => setIsStatusOpen(true)}
          />

          {/* Single Service: Potong Rambut Rp 8k */}
          <ServicesSection
            onOpenBooking={() => handleOpenBooking()}
          />

          {/* Sole Capster: Mas Anang */}
          <BarbersSection
            onOpenBooking={() => handleOpenBooking()}
          />

          {/* Hairstyle Lookbook & Custom Photo Referral */}
          <GallerySection
            onSelectModelToBook={(modelName) => handleOpenBooking(undefined, modelName, false)}
            onOpenBookingWithCustomPhoto={() => handleOpenBooking(undefined, undefined, true)}
          />

          {/* 2 Branches & Jam Operasional & Age Rule */}
          <LocationSection
            onOpenBookingForBranch={(branchId) => handleOpenBooking(branchId)}
          />
        </main>

        {/* Footer */}
        <Footer
          onOpenBooking={() => handleOpenBooking()}
          onOpenCheckStatus={() => setIsStatusOpen(true)}
        />

        {/* Booking Modal */}
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          preselectedBranchId={preselectedBranch}
          preselectedModel={preselectedModel}
          isCustomPhotoSelected={isCustomPhoto}
        />

        {/* Status Check Modal */}
        <BookingStatusModal
          isOpen={isStatusOpen}
          onClose={() => setIsStatusOpen(false)}
        />

        {/* Admin Dashboard (if triggered programmatically) */}
        <AdminPanel
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
        />

      </div>
    </BarbershopProvider>
  );
}
