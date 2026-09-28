import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigateHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateHome }) => {
  const { signInWithEmail, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Silakan masukkan alamat email.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Format email tidak valid.');
      return;
    }

    if (!password) {
      setErrorMessage('Silakan masukkan password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithEmail(cleanEmail, password);
      if (result.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(result.error || 'Email atau password salah.');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat mencoba masuk. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0f12] text-[#e8e6e3] flex flex-col">
      <div className="w-full flex flex-col flex-1">
        {/* Top Header */}
        <div className="w-full bg-[#0e1015]/95 backdrop-blur-md border-b border-[#232630] sticky top-0 z-40 px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="font-mono text-[10px] sm:text-xs px-2.5 py-1 bg-[#1a1c24] border border-[#2d3039] text-[#c59a45] rounded font-semibold tracking-wider uppercase">
              Panel Pengelola
            </span>
            <span className="text-[#323644] hidden sm:inline">|</span>
            <h2
              className="text-sm sm:text-base md:text-lg font-bold text-[#f0eee9] tracking-wide ml-1.5 sm:ml-2.5"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Necis Barbershop <span className="text-[#8e92a0] font-normal text-xs sm:text-sm hidden sm:inline">· Mas Anang</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Kept minimal as per secret route request */}
          </div>
        </div>

        {/* LOGIN SCREEN */}
        <div className="max-w-md mx-auto my-8 sm:my-12 w-full px-4 sm:px-0">
          <div className="p-6 sm:p-8 w-full bg-[#12141a] border border-[#2b2e3a] rounded-lg shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-[#c59a45] uppercase">
                Akses Khusus Gerai
              </span>
              <h3 className="text-xl font-bold text-[#f0eee9]">Login Mas Anang (Admin Gerai)</h3>
              <p className="text-xs text-[#9ea2ad]">
                Pantau antrean reservasi 2 cabang, input tamu walk-in, dan kelola jadwal.
              </p>
            </div>

            {!isConfigured && (
              <div className="p-3 text-xs bg-amber-950/40 border border-amber-800 text-amber-200 rounded space-y-1">
                <p className="font-semibold">⚠️ Setup Supabase Dibutuhkan:</p>
                <p className="text-[11px] leading-relaxed text-amber-300/90">
                  Pastikan variabel <code className="text-[#c59a45]">VITE_SUPABASE_URL</code> dan <code className="text-[#c59a45]">VITE_SUPABASE_ANON_KEY</code> telah diisi pada file <code className="text-[#c59a45]">.env</code> untuk mengaktifkan autentikasi Supabase.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 text-xs bg-rose-950/40 border border-rose-800 text-rose-300 rounded flex items-start gap-2">
                <span className="text-rose-400 mt-0.5">✕</span>
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-[#9ea2ad] mb-1">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@necisbarber.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-[#0a0c10] border border-[#282a35] rounded p-2.5 text-xs text-[#e8e6e3] focus:border-[#c59a45] focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs text-[#9ea2ad] mb-1">Password</label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Masukkan password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-[#0a0c10] border border-[#282a35] rounded p-2.5 text-xs text-[#e8e6e3] focus:border-[#c59a45] focus:outline-none disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 text-xs font-semibold text-black bg-[#c59a45] hover:bg-[#d8ab52] disabled:opacity-60 disabled:cursor-not-allowed rounded transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span>Memproses Login...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>
          </div>

          {/* Copyright below login section */}
          <p className="mt-6 text-center text-[11px] font-light text-[#575a68] tracking-wider select-none">
            ©copyrigth ilhamgod
          </p>
        </div>
      </div>
    </div>
  );
};
