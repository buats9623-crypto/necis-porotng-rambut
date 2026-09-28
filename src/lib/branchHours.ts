/**
 * Utilities for Date, Time, and Live Automatic Branch Status in Asia/Jakarta (WIB)
 * Project: Necis Barbershop · Mas Anang
 */

export interface BranchLiveStatus {
  isOpen: boolean;
  statusText: 'Buka Sekarang' | 'Tutup Saat Ini' | 'Libur';
  badgeClass: string;
  dotClass: string;
  keterangan: string;
}

/**
 * Returns today's date in YYYY-MM-DD format based on Asia/Jakarta (WIB) timezone
 */
export const getTodayWIB = (): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Returns current hours, minutes, and formatted string "HH:mm" in Asia/Jakarta (WIB)
 */
export const getWIBTime = (): { hour: number; minute: number; timeStr: string } => {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(new Date());
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return { hour, minute, timeStr };
  } catch {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return { hour, minute, timeStr };
  }
};

/**
 * Calculates whether a branch is currently open or closed automatically based on current WIB time.
 * No manual admin intervention needed each day.
 */
export const getBranchLiveStatus = (
  jamBuka: string, // e.g. "08:00"
  jamTutup: string, // e.g. "17:00"
  isLiburManual?: boolean
): BranchLiveStatus => {
  if (isLiburManual) {
    return {
      isOpen: false,
      statusText: 'Libur',
      badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-800',
      dotClass: 'bg-rose-500',
      keterangan: 'Tutup Sementara / Libur',
    };
  }

  const { timeStr } = getWIBTime();
  const isOpen = timeStr >= jamBuka && timeStr < jamTutup;

  if (isOpen) {
    return {
      isOpen: true,
      statusText: 'Buka Sekarang',
      badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80',
      dotClass: 'bg-emerald-400 animate-pulse',
      keterangan: `Sedang Melayani (${jamBuka} – ${jamTutup} WIB)`,
    };
  }

  return {
    isOpen: false,
    statusText: 'Tutup Saat Ini',
    badgeClass: 'bg-[#181a22] text-[#8e92a0] border-[#2c303d]',
    dotClass: 'bg-zinc-600',
    keterangan: `Di luar jam operasional (${jamBuka} – ${jamTutup} WIB)`,
  };
};

/**
 * Formats YYYY-MM-DD into Indonesian human-readable date, e.g. "Minggu, 27 September 2026"
 */
export const formatDateIndo = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
};
