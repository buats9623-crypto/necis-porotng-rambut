import React, { useState, useRef } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_HERO_IMAGE, INITIAL_BARBERS } from '../../data/initialData';

export const ImageManagerTab: React.FC = () => {
  const {
    heroImage,
    barbers,
    hairstyleModels,
    updateHeroImage,
    updateBarberPhoto,
    updateHairstyleModelImage,
    resetImagesToDefault,
  } = useBarbershop();

  const [activeSubTab, setActiveSubTab] = useState<'hero' | 'barber' | 'models' | 'guide'>('hero');
  const [successToast, setSuccessToast] = useState<string>('');

  // Hero form state
  const [heroInputUrl, setHeroInputUrl] = useState('');
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  // Barber form state
  const capsterAnang = barbers[0];
  const [barberInputUrl, setBarberInputUrl] = useState('');
  const [barberPreview, setBarberPreview] = useState<string | null>(null);
  const [isSavingBarber, setIsSavingBarber] = useState(false);
  const barberFileInputRef = useRef<HTMLInputElement>(null);

  // Selected Hairstyle Model Modal / Editor
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [modelInputUrl, setModelInputUrl] = useState('');
  const [modelPreview, setModelPreview] = useState<string | null>(null);
  const [isSavingModel, setIsSavingModel] = useState(false);
  const modelFileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4500);
  };

  const handleProcessFile = (file: File, callback: (url: string) => void) => {
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file format gambar (JPG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar (maksimal 5 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        callback(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Hero handlers
  const handleApplyHero = async (urlToApply: string) => {
    if (!urlToApply.trim()) return;
    setIsSavingHero(true);
    try {
      await updateHeroImage(urlToApply);
      setHeroPreview(null);
      setHeroInputUrl('');
      showNotification('✓ Foto Utama Beranda berhasil diganti dan live untuk pengunjung!');
    } catch {
      alert('Gagal menyimpan foto.');
    } finally {
      setIsSavingHero(false);
    }
  };

  // Barber handlers
  const handleApplyBarber = async (urlToApply: string) => {
    if (!urlToApply.trim()) return;
    setIsSavingBarber(true);
    try {
      await updateBarberPhoto('barber-anang', urlToApply);
      setBarberPreview(null);
      setBarberInputUrl('');
      showNotification('✓ Foto Profil Mas Anang berhasil diganti dan live untuk pengunjung!');
    } catch {
      alert('Gagal menyimpan foto.');
    } finally {
      setIsSavingBarber(false);
    }
  };

  // Model handler
  const handleOpenEditModel = (modelId: string) => {
    const target = hairstyleModels.find((m) => m.id === modelId);
    if (!target) return;
    setEditingModelId(modelId);
    setModelPreview(null);
    setModelInputUrl('');
  };

  const handleApplyModel = async () => {
    if (!editingModelId) return;
    const finalUrl = modelPreview || modelInputUrl.trim();
    if (!finalUrl) {
      alert('Silakan pilih file foto atau masukkan link URL gambar.');
      return;
    }

    setIsSavingModel(true);
    try {
      await updateHairstyleModelImage(editingModelId, finalUrl);
      const target = hairstyleModels.find((m) => m.id === editingModelId);
      setEditingModelId(null);
      setModelPreview(null);
      setModelInputUrl('');
      showNotification(`✓ Foto model "${target?.nama_model || ''}" berhasil diperbarui!`);
    } catch {
      alert('Gagal menyimpan foto model.');
    } finally {
      setIsSavingModel(false);
    }
  };

  const handleResetAll = async () => {
    if (confirm('Yakin ingin mengembalikan seluruh foto (Hero, Mas Anang, dan 8 Model Rambut) ke gambar bawaan asli?')) {
      await resetImagesToDefault();
      setHeroPreview(null);
      setBarberPreview(null);
      showNotification('✓ Semua foto telah direset ke gambar bawaan default.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded text-xs flex items-center justify-between shadow-lg sticky top-0 z-30 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">🎉</span>
            <span className="font-medium">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast('')}
            className="text-emerald-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#232630]">
        <div>
          <h3 className="text-lg font-bold text-[#f0eee9] flex items-center gap-2">
            <span>📸</span>
            <span>Kelola Gambar & Foto Tampilan Awal</span>
          </h3>
          <p className="text-xs text-[#9ea2ad] mt-1 leading-relaxed">
            Ganti foto yang tampil di beranda utama website. Setiap perubahan foto langsung tersimpan dan otomatis dilihat oleh semua pengunjung website.
          </p>
        </div>

        <button
          onClick={handleResetAll}
          className="text-xs text-rose-400 hover:text-rose-300 border border-rose-900/50 hover:bg-rose-950/30 px-3 py-1.5 rounded transition-colors self-start sm:self-auto cursor-pointer"
        >
          Reset Semua ke Default
        </button>
      </div>

      {/* Sub-Tabs: Hero, Mas Anang, Katalog Model */}
      <div className="flex items-center gap-2 border-b border-[#262832] pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('hero')}
          className={`px-4 py-2 text-xs font-semibold rounded-t cursor-pointer transition-colors whitespace-nowrap ${
            activeSubTab === 'hero'
              ? 'bg-[#181a22] text-[#c59a45] border-t-2 border-[#c59a45]'
              : 'text-[#8e92a0] hover:text-[#e8e6e3]'
          }`}
        >
          1. Foto Utama Beranda (Hero)
        </button>
        <button
          onClick={() => setActiveSubTab('barber')}
          className={`px-4 py-2 text-xs font-semibold rounded-t cursor-pointer transition-colors whitespace-nowrap ${
            activeSubTab === 'barber'
              ? 'bg-[#181a22] text-[#c59a45] border-t-2 border-[#c59a45]'
              : 'text-[#8e92a0] hover:text-[#e8e6e3]'
          }`}
        >
          2. Foto Profil Mas Anang
        </button>
        <button
          onClick={() => setActiveSubTab('models')}
          className={`px-4 py-2 text-xs font-semibold rounded-t cursor-pointer transition-colors whitespace-nowrap ${
            activeSubTab === 'models'
              ? 'bg-[#181a22] text-[#c59a45] border-t-2 border-[#c59a45]'
              : 'text-[#8e92a0] hover:text-[#e8e6e3]'
          }`}
        >
          3. Katalog 8 Model Rambut ({hairstyleModels.length})
        </button>
        <button
          onClick={() => setActiveSubTab('guide')}
          className={`px-4 py-2 text-xs font-semibold rounded-t cursor-pointer transition-colors whitespace-nowrap ${
            activeSubTab === 'guide'
              ? 'bg-[#181a22] text-[#c59a45] border-t-2 border-[#c59a45]'
              : 'text-[#8e92a0] hover:text-[#e8e6e3]'
          }`}
        >
          4. 📋 Petunjuk Supabase (Kamus Lokasi Web)
        </button>
      </div>

      {/* SUB-TAB 1: HERO IMAGE */}
      {activeSubTab === 'hero' && (
        <div className="space-y-4">
          {/* Supabase Location Explanatory Banner */}
          <div className="p-3.5 bg-[#171b24] border border-[#2b3142] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#232836] border border-[#3b435b] text-[#c59a45] font-mono font-bold rounded text-[11px]">
                  ID Supabase: &apos;hero&apos;
                </span>
                <span className="text-[#8e92a0]">|</span>
                <span className="font-semibold text-[#f0eee9]">Letak di Website:</span>
                <span className="text-[#c59a45]">Hero Banner (Paling Atas Beranda)</span>
              </div>
              <p className="text-[11px] text-[#9ea2ad]">
                💡 <strong>Jika Anda ganti baris ini di Supabase:</strong> Foto besar di sebelah kanan teks &quot;Potong Rambut Rp 8.000 Saja&quot; akan langsung berganti untuk semua pengunjung.
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab('guide')}
              className="text-[11px] text-[#c59a45] hover:underline whitespace-nowrap self-start sm:self-center"
            >
              Lihat semua keterangan tabel ↗
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#14161c] border border-[#232630] rounded-lg p-5 sm:p-6">
          {/* Current / Preview Visual */}
          <div className="md:col-span-5 space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#c59a45] block">
              {heroPreview ? 'Preview Foto Baru' : 'Foto Yang Sedang Aktif di Beranda'}
            </span>
            <div className="relative border border-[#2d303d] rounded overflow-hidden aspect-[4/3] bg-[#0c0d11]">
              <img
                src={heroPreview || heroImage}
                alt="Hero Showcase Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 text-[10px] font-mono text-[#c59a45] rounded">
                {heroPreview ? 'PREVIEW' : 'LIVE'}
              </div>
            </div>
            <p className="text-[11px] text-[#7e8291]">
              * Foto ini tampil di sisi kanan bagian paling atas beranda (Hero Banner).
            </p>
          </div>

          {/* Action Form */}
          <div className="md:col-span-7 space-y-5">
            <div>
              <h4 className="text-sm font-bold text-[#f0eee9]">Ganti Foto Utama Beranda</h4>
              <p className="text-xs text-[#9ea2ad] mt-1">
                Pilih file foto dari galeri HP / laptop Anda, atau masukkan tautan link URL gambar.
              </p>
            </div>

            {/* Option A: Upload File */}
            <div className="p-4 bg-[#0d0e13] border border-[#232632] rounded space-y-3">
              <span className="text-xs font-semibold text-[#e8e6e3] block">
                Opsi 1: Upload File Langsung (HP / Laptop)
              </span>
              <input
                type="file"
                ref={heroFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleProcessFile(file, (dataUrl) => {
                      setHeroPreview(dataUrl);
                      setHeroInputUrl('');
                    });
                  }
                }}
              />
              <button
                type="button"
                onClick={() => heroFileInputRef.current?.click()}
                className="px-4 py-2 text-xs font-semibold text-black bg-[#c59a45] hover:bg-[#d8ab52] rounded transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>📁</span>
                <span>Pilih Foto dari Perangkat</span>
              </button>
              <p className="text-[11px] text-[#7e8291]">
                Mendukung file JPG, PNG, WEBP. Disarankan orientasi landscape (4:3).
              </p>
            </div>

            {/* Option B: Direct URL */}
            <div className="p-4 bg-[#0d0e13] border border-[#232632] rounded space-y-3">
              <span className="text-xs font-semibold text-[#e8e6e3] block">
                Opsi 2: Masukkan Link / URL Gambar Online
              </span>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... atau URL gambar"
                  value={heroInputUrl}
                  onChange={(e) => {
                    setHeroInputUrl(e.target.value);
                    if (e.target.value.trim().startsWith('http')) {
                      setHeroPreview(e.target.value.trim());
                    }
                  }}
                  className="flex-1 bg-[#14161c] border border-[#2d303d] rounded p-2 text-xs text-[#e8e6e3] focus:border-[#c59a45] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (heroInputUrl.trim()) {
                      setHeroPreview(heroInputUrl.trim());
                    }
                  }}
                  className="px-3 py-2 text-xs text-[#e8e6e3] bg-[#1a1c24] hover:bg-[#252834] border border-[#323644] rounded cursor-pointer"
                >
                  Pratinjau
                </button>
              </div>
            </div>

            {/* Save Buttons */}
            {heroPreview && (
              <div className="p-3 bg-[#181d19] border border-emerald-800 rounded flex items-center justify-between">
                <span className="text-xs text-emerald-300">
                  Pratinjau siap. Klik simpan untuk menerapkan ke beranda.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHeroPreview(null);
                      setHeroInputUrl('');
                    }}
                    className="px-3 py-1.5 text-xs text-[#8e92a0] hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSavingHero}
                    onClick={() => handleApplyHero(heroPreview)}
                    className="px-4 py-1.5 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded cursor-pointer disabled:opacity-50"
                  >
                    {isSavingHero ? 'Menyimpan...' : 'Simpan & Publikasikan'}
                  </button>
                </div>
              </div>
            )}

            {/* Quick Reset to Default for Hero */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleApplyHero(INITIAL_HERO_IMAGE)}
                className="text-xs text-[#8e92a0] hover:text-[#c59a45] underline cursor-pointer"
              >
                Kembalikan Foto Hero ke Gambar Awal Bawaan Pabrik
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* SUB-TAB 2: BARBER (MAS ANANG) IMAGE */}
      {activeSubTab === 'barber' && (
        <div className="space-y-4">
          {/* Supabase Location Explanatory Banner */}
          <div className="p-3.5 bg-[#171b24] border border-[#2b3142] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#232836] border border-[#3b435b] text-[#c59a45] font-mono font-bold rounded text-[11px]">
                  ID Supabase: &apos;barber-anang&apos;
                </span>
                <span className="text-[#8e92a0]">|</span>
                <span className="font-semibold text-[#f0eee9]">Letak di Website:</span>
                <span className="text-[#c59a45]">Section Profil Mas Anang</span>
              </div>
              <p className="text-[11px] text-[#9ea2ad]">
                💡 <strong>Jika Anda ganti baris ini di Supabase:</strong> Foto potret Mas Anang saat mencukur di bagian profil &quot;Mengenal Mas Anang (Capster Tunggal)&quot; akan otomatis diperbarui.
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab('guide')}
              className="text-[11px] text-[#c59a45] hover:underline whitespace-nowrap self-start sm:self-center"
            >
              Lihat kamus lengkap ↗
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#14161c] border border-[#232630] rounded-lg p-5 sm:p-6">
          {/* Current / Preview Visual */}
          <div className="md:col-span-5 space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#c59a45] block">
              {barberPreview ? 'Preview Foto Mas Anang Baru' : 'Foto Mas Anang Aktif di Beranda'}
            </span>
            <div className="relative border border-[#2d303d] rounded overflow-hidden aspect-[3/4] bg-[#0c0d11] max-w-sm mx-auto">
              <img
                src={barberPreview || capsterAnang?.foto_url || INITIAL_BARBERS[0].foto_url}
                alt="Mas Anang - Capster Tunggal"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 text-[10px] font-mono text-[#c59a45] rounded">
                {barberPreview ? 'PREVIEW' : 'LIVE'}
              </div>
            </div>
            <p className="text-[11px] text-[#7e8291] text-center">
              * Tampil di section &quot;Mengenal Mas Anang (Capster Tunggal)&quot;.
            </p>
          </div>

          {/* Action Form */}
          <div className="md:col-span-7 space-y-5">
            <div>
              <h4 className="text-sm font-bold text-[#f0eee9]">Ganti Foto Profil Mas Anang</h4>
              <p className="text-xs text-[#9ea2ad] mt-1">
                Gunakan foto asli Mas Anang saat sedang memegang gunting / di tempat cukur agar semakin meyakinkan calon pelanggan.
              </p>
            </div>

            {/* Option A: Upload File */}
            <div className="p-4 bg-[#0d0e13] border border-[#232632] rounded space-y-3">
              <span className="text-xs font-semibold text-[#e8e6e3] block">
                Opsi 1: Upload Foto Mas Anang dari HP / Komputer
              </span>
              <input
                type="file"
                ref={barberFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleProcessFile(file, (dataUrl) => {
                      setBarberPreview(dataUrl);
                      setBarberInputUrl('');
                    });
                  }
                }}
              />
              <button
                type="button"
                onClick={() => barberFileInputRef.current?.click()}
                className="px-4 py-2 text-xs font-semibold text-black bg-[#c59a45] hover:bg-[#d8ab52] rounded transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>📁</span>
                <span>Pilih Foto Mas Anang</span>
              </button>
            </div>

            {/* Option B: Direct URL */}
            <div className="p-4 bg-[#0d0e13] border border-[#232632] rounded space-y-3">
              <span className="text-xs font-semibold text-[#e8e6e3] block">
                Opsi 2: Masukkan Link / URL Foto Online
              </span>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://... URL gambar"
                  value={barberInputUrl}
                  onChange={(e) => {
                    setBarberInputUrl(e.target.value);
                    if (e.target.value.trim().startsWith('http')) {
                      setBarberPreview(e.target.value.trim());
                    }
                  }}
                  className="flex-1 bg-[#14161c] border border-[#2d303d] rounded p-2 text-xs text-[#e8e6e3] focus:border-[#c59a45] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (barberInputUrl.trim()) {
                      setBarberPreview(barberInputUrl.trim());
                    }
                  }}
                  className="px-3 py-2 text-xs text-[#e8e6e3] bg-[#1a1c24] hover:bg-[#252834] border border-[#323644] rounded cursor-pointer"
                >
                  Pratinjau
                </button>
              </div>
            </div>

            {/* Save Buttons */}
            {barberPreview && (
              <div className="p-3 bg-[#181d19] border border-emerald-800 rounded flex items-center justify-between">
                <span className="text-xs text-emerald-300">
                  Pratinjau foto siap. Klik simpan untuk publikasikan.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBarberPreview(null);
                      setBarberInputUrl('');
                    }}
                    className="px-3 py-1.5 text-xs text-[#8e92a0] hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSavingBarber}
                    onClick={() => handleApplyBarber(barberPreview)}
                    className="px-4 py-1.5 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded cursor-pointer disabled:opacity-50"
                  >
                    {isSavingBarber ? 'Menyimpan...' : 'Simpan Foto Mas Anang'}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleApplyBarber(INITIAL_BARBERS[0].foto_url)}
                className="text-xs text-[#8e92a0] hover:text-[#c59a45] underline cursor-pointer"
              >
                Kembalikan Foto Mas Anang ke Bawaan Awal
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* SUB-TAB 3: 8 HAIRSTYLE MODELS CATALOG */}
      {activeSubTab === 'models' && (
        <div className="space-y-4">
          {/* Supabase Location Explanatory Banner */}
          <div className="p-3.5 bg-[#171b24] border border-[#2b3142] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#232836] border border-[#3b435b] text-[#c59a45] font-mono font-bold rounded text-[11px]">
                  ID Supabase: &apos;model-1&apos; s/d &apos;model-8&apos;
                </span>
                <span className="text-[#8e92a0]">|</span>
                <span className="font-semibold text-[#f0eee9]">Letak di Website:</span>
                <span className="text-[#c59a45]">Galeri 8 Model Rambut</span>
              </div>
              <p className="text-[11px] text-[#9ea2ad]">
                💡 <strong>Jika Anda ganti baris model-1 s/d model-8 di Supabase:</strong> Foto kartu model rambut pada galeri beranda dan pilihan foto saat tamu melakukan reservasi akan langsung berubah sesuai URL yang Anda pasang.
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab('guide')}
              className="text-[11px] text-[#c59a45] hover:underline whitespace-nowrap self-start sm:self-center"
            >
              Lihat kamus lengkap ↗
            </button>
          </div>

          <div className="bg-[#14161c] border border-[#232630] rounded-lg p-4">
            <h4 className="text-sm font-bold text-[#f0eee9]">Daftar 8 Foto Katalog Model Rambut</h4>
            <p className="text-xs text-[#9ea2ad] mt-1">
              Klik tombol &quot;Ganti Foto Model&quot; pada salah satu model di bawah untuk mengunggah foto baru.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {hairstyleModels.map((model, idx) => (
              <div
                key={model.id}
                className="bg-[#12141a] border border-[#262835] rounded overflow-hidden flex flex-col justify-between group hover:border-[#c59a45]/50 transition-colors"
              >
                <div>
                  <div className="relative aspect-[4/3] bg-[#0c0d11] overflow-hidden">
                    <img
                      src={model.gambar_url}
                      alt={model.nama_model}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 text-[10px] font-mono text-[#c59a45] rounded">
                      Model {idx + 1}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/85 px-1.5 py-0.5 text-[9px] font-mono text-zinc-300 rounded border border-zinc-700">
                      ID: {model.id}
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <span className="text-[10px] text-[#c59a45] uppercase tracking-wider font-semibold">
                      {model.kategori}
                    </span>
                    <h5 className="text-xs font-bold text-[#f0eee9] line-clamp-1">{model.nama_model}</h5>
                    <p className="text-[11px] text-[#8e92a0] line-clamp-2 leading-relaxed">
                      {model.deskripsi}
                    </p>
                  </div>
                </div>

                <div className="p-3 pt-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModel(model.id)}
                    className="w-full py-2 text-xs font-semibold text-[#e8e6e3] hover:text-white bg-[#1a1c24] hover:bg-[#282b37] border border-[#2e313e] rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>📷</span>
                    <span>Ganti Foto Model</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: PANDUAN KOLOM & LOKASI SUPABASE */}
      {activeSubTab === 'guide' && (
        <div className="space-y-5">
          <div className="bg-[#14161c] border border-[#232630] rounded-lg p-5 space-y-2">
            <h4 className="text-sm font-bold text-[#f0eee9] flex items-center gap-2">
              <span>📋</span>
              <span>Kamus Lokasi &amp; Dampak Perubahan di Supabase</span>
            </h4>
            <p className="text-xs text-[#9ea2ad] leading-relaxed">
              Tabel di bawah menjelaskan arti setiap baris data di tabel <code className="text-[#c59a45] bg-[#0c0d11] px-1.5 py-0.5 rounded border border-[#272a36]">site_images</code> pada database Supabase. Jika Anda mengedit kolom <code className="text-[#c59a45] bg-[#0c0d11] px-1.5 py-0.5 rounded border border-[#272a36]">image_url</code> pada salah satu ID di bawah melalui Supabase Dashboard, pengunjung website akan langsung melihat perubahan pada bagian yang tertera.
            </p>
          </div>

          <div className="border border-[#232630] rounded-lg overflow-hidden bg-[#12141a]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0e1015] border-b border-[#232630] text-[#c59a45] font-mono text-[11px] uppercase tracking-wider">
                    <th className="p-3.5">ID di Supabase</th>
                    <th className="p-3.5">Nama Bagian Foto</th>
                    <th className="p-3.5">Letak Persis di Web</th>
                    <th className="p-3.5">Jika Diganti, Ini yang Berubah di Web</th>
                    <th className="p-3.5 text-center">Foto Saat Ini</th>
                    <th className="p-3.5 text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2029] text-[#e8e6e3]">
                  {/* Row 1: Hero */}
                  <tr className="hover:bg-[#161822] transition-colors">
                    <td className="p-3.5 font-mono text-[#c59a45] font-bold whitespace-nowrap">
                      &apos;hero&apos;
                    </td>
                    <td className="p-3.5 font-semibold text-white whitespace-nowrap">
                      Foto Utama Beranda
                    </td>
                    <td className="p-3.5 text-[#9ea2ad]">
                      Halaman paling atas (Hero Banner), sisi kanan teks <em>&quot;Potong Rambut Rp 8.000 Saja&quot;</em>.
                    </td>
                    <td className="p-3.5 text-emerald-300">
                      Foto pameran utama yang pertama kali dilihat oleh pengunjung saat baru membuka website.
                    </td>
                    <td className="p-3.5 text-center">
                      <img src={heroImage} alt="Hero" className="w-12 h-9 object-cover rounded mx-auto border border-[#2d303d]" />
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => setActiveSubTab('hero')}
                        className="px-2.5 py-1 text-[11px] bg-[#1d202b] hover:bg-[#282d3d] border border-[#3b4154] text-[#c59a45] rounded font-semibold transition-colors cursor-pointer"
                      >
                        Ganti Foto ↗
                      </button>
                    </td>
                  </tr>

                  {/* Row 2: Barber */}
                  <tr className="hover:bg-[#161822] transition-colors">
                    <td className="p-3.5 font-mono text-[#c59a45] font-bold whitespace-nowrap">
                      &apos;barber-anang&apos;
                    </td>
                    <td className="p-3.5 font-semibold text-white whitespace-nowrap">
                      Foto Profil Mas Anang
                    </td>
                    <td className="p-3.5 text-[#9ea2ad]">
                      Bagian profil <em>&quot;Mengenal Mas Anang (Capster Tunggal &amp; Pemilik Gerai)&quot;</em>.
                    </td>
                    <td className="p-3.5 text-emerald-300">
                      Foto potret Mas Anang saat memegang gunting/cukur di gerai pangkas rambut.
                    </td>
                    <td className="p-3.5 text-center">
                      <img src={capsterAnang?.foto_url || INITIAL_BARBERS[0].foto_url} alt="Mas Anang" className="w-9 h-12 object-cover rounded mx-auto border border-[#2d303d]" />
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => setActiveSubTab('barber')}
                        className="px-2.5 py-1 text-[11px] bg-[#1d202b] hover:bg-[#282d3d] border border-[#3b4154] text-[#c59a45] rounded font-semibold transition-colors cursor-pointer"
                      >
                        Ganti Foto ↗
                      </button>
                    </td>
                  </tr>

                  {/* Rows 3-10: Models */}
                  {hairstyleModels.map((model, idx) => (
                    <tr key={model.id} className="hover:bg-[#161822] transition-colors">
                      <td className="p-3.5 font-mono text-[#c59a45] font-bold whitespace-nowrap">
                        &apos;{model.id}&apos;
                      </td>
                      <td className="p-3.5 font-semibold text-white whitespace-nowrap">
                        Model {idx + 1}: {model.nama_model}
                      </td>
                      <td className="p-3.5 text-[#9ea2ad]">
                        Galeri Contoh Potongan Rambut, kotak kartu ke-{idx + 1}.
                      </td>
                      <td className="p-3.5 text-emerald-300">
                        Foto contoh gaya rambut {model.nama_model} yang dilihat pelanggan pada galeri dan pilihan saat booking reservasi.
                      </td>
                      <td className="p-3.5 text-center">
                        <img src={model.gambar_url} alt={model.nama_model} className="w-12 h-9 object-cover rounded mx-auto border border-[#2d303d]" />
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditModel(model.id)}
                          className="px-2.5 py-1 text-[11px] bg-[#1d202b] hover:bg-[#282d3d] border border-[#3b4154] text-[#c59a45] rounded font-semibold transition-colors cursor-pointer"
                        >
                          Ganti Foto ↗
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GANTI FOTO MODEL */}
      {editingModelId && (() => {
        const targetModel = hairstyleModels.find((m) => m.id === editingModelId);
        if (!targetModel) return null;

        return (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
            <div className="bg-[#14161c] border border-[#2b2e3a] rounded-lg p-5 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#262832] pb-3">
                <div>
                  <h4 className="text-sm font-bold text-[#f0eee9]">
                    Ganti Foto: {targetModel.nama_model}
                  </h4>
                  <span className="text-[11px] text-[#c59a45] uppercase tracking-wider font-mono">
                    Kategori: {targetModel.kategori}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingModelId(null)}
                  className="text-[#8e92a0] hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              {/* Preview comparison */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-[#8e92a0] block mb-1">Foto Saat Ini</span>
                  <div className="aspect-[4/3] rounded overflow-hidden border border-[#282a35] bg-black">
                    <img
                      src={targetModel.gambar_url}
                      alt={targetModel.nama_model}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#c59a45] block mb-1 font-semibold">
                    {modelPreview ? 'Foto Baru Terpilih' : 'Belum Ada Foto Baru'}
                  </span>
                  <div className="aspect-[4/3] rounded overflow-hidden border border-[#c59a45]/40 bg-[#0e1015] flex items-center justify-center">
                    {modelPreview ? (
                      <img
                        src={modelPreview}
                        alt="Preview Foto Baru"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[11px] text-[#555866]">Pilih file / URL</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload or Link */}
              <div className="space-y-3 pt-2">
                <input
                  type="file"
                  ref={modelFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleProcessFile(file, (dataUrl) => {
                        setModelPreview(dataUrl);
                        setModelInputUrl('');
                      });
                    }
                  }}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => modelFileInputRef.current?.click()}
                    className="flex-1 py-2 text-xs font-semibold text-black bg-[#c59a45] hover:bg-[#d8ab52] rounded cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>📁</span>
                    <span>Upload Foto dari HP / Laptop</span>
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#262832]"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-[#14161c] px-2 text-[#7e8291]">atau pakai link gambar</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://... Link gambar"
                    value={modelInputUrl}
                    onChange={(e) => {
                      setModelInputUrl(e.target.value);
                      if (e.target.value.trim().startsWith('http')) {
                        setModelPreview(e.target.value.trim());
                      }
                    }}
                    className="flex-1 bg-[#0a0c10] border border-[#2b2e3a] rounded p-2 text-xs text-[#e8e6e3] focus:border-[#c59a45] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (modelInputUrl.trim()) {
                        setModelPreview(modelInputUrl.trim());
                      }
                    }}
                    className="px-3 py-1.5 text-xs text-[#e8e6e3] bg-[#1f222c] hover:bg-[#282b38] rounded cursor-pointer"
                  >
                    Tinjau
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262832]">
                <button
                  type="button"
                  onClick={() => setEditingModelId(null)}
                  className="px-3 py-1.5 text-xs text-[#8e92a0] hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSavingModel || (!modelPreview && !modelInputUrl.trim())}
                  onClick={handleApplyModel}
                  className="px-4 py-1.5 text-xs font-bold text-black bg-[#c59a45] hover:bg-[#d8ab52] disabled:opacity-50 disabled:cursor-not-allowed rounded cursor-pointer transition-colors"
                >
                  {isSavingModel ? 'Menyimpan...' : 'Terapkan Foto Model'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
