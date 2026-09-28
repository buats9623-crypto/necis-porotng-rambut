import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  isAdmin: boolean;
  loading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper untuk mengambil data profil user dari tabel 'profiles'
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error querying profiles table:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('Failed to fetch user profile:', err);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Bersihkan sisa fake auth legacy di localStorage jika masih ada
    try {
      localStorage.removeItem('necis_admin_auth_v2');
      localStorage.removeItem('isAdmin');
    } catch {
      // Ignore in strict storage environments
    }

    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured) {
          if (isMounted) setLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Error getting Supabase session:', error.message);
        }

        if (session?.user && isMounted) {
          setUser(session.user);
          setSession(session);
          const profile = await fetchProfile(session.user.id);
          if (profile?.role === 'admin') {
            setRole('admin');
            setIsAdmin(true);
          } else {
            setRole(profile?.role || 'user');
            setIsAdmin(false);
          }
        }
      } catch (err) {
        console.warn('Init auth exception:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Dengarkan perubahan state auth Supabase (login, logout, refresh token)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      if (currentSession?.user) {
        setUser(currentSession.user);
        setSession(currentSession);
        const profile = await fetchProfile(currentSession.user.id);
        if (profile?.role === 'admin') {
          setRole('admin');
          setIsAdmin(true);
        } else {
          setRole(profile?.role || 'user');
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setSession(null);
        setRole(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Konfigurasi Supabase belum dipasang di environment variable (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY).',
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return {
        success: false,
        error: 'Harap masukkan email dan password dengan benar.',
      };
    }

    try {
      // 1. Supabase Authentication dengan Email & Password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error || !data.user) {
        // Tampilkan pesan error yang ramah, jangan tampilkan raw error database
        let userMessage = 'Email atau password salah.';
        if (error?.message?.toLowerCase().includes('rate limit')) {
          userMessage = 'Terlalu banyak percobaan login gagal. Mohon tunggu beberapa saat lagi.';
        } else if (error?.message?.toLowerCase().includes('email not confirmed')) {
          userMessage = 'Email ini belum dikonfirmasi. Harap periksa email Anda.';
        }
        return { success: false, error: userMessage };
      }

      // 2. Ambil profile dari database dan validasi role admin
      const profile = await fetchProfile(data.user.id);

      if (!profile || profile.role !== 'admin') {
        // User berhasil auth di Supabase, tapi role-nya bukan admin
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setRole(null);
        setIsAdmin(false);
        return {
          success: false,
          error: 'Akses ditolak. Akun Anda terdaftar tetapi tidak memiliki izin administrator (role bukan admin).',
        };
      }

      // User valid dan merupakan admin
      setUser(data.user);
      setSession(data.session);
      setRole('admin');
      setIsAdmin(true);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: 'Terjadi gangguan jaringan saat menghubungi Supabase. Silakan coba lagi.',
      };
    }
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setUser(null);
      setSession(null);
      setRole(null);
      setIsAdmin(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isAdmin,
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
