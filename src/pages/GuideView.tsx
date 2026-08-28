import React, { useRef, useState, useEffect } from 'react';
import { 
  FileText, Download, Printer, Copy, Check, ChevronRight, 
  Sparkles, BookOpen, Globe, Settings, ShieldCheck, HelpCircle, 
  Layers, ArrowLeft, ExternalLink, MessageSquare, CreditCard,
  CheckCircle2, AlertTriangle, Lightbulb, Compass, Share2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function GuideView() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('bagian-1');

  // Handle direct print
  const handlePrint = () => {
    window.print();
  };

  // Handle html2pdf export
  const handleDownloadPdf = async () => {
    if (!contentRef.current) return;
    setIsGeneratingPdf(true);

    try {
      // Dynamic import html2pdf.js
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const element = contentRef.current;
      const opt = {
        margin: [12, 12, 15, 12], // top, left, bottom, right in mm
        filename: 'Panduan_Mengelola_Website_Travel_Tripbone.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          letterRendering: true,
          windowWidth: 1200
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await (html2pdf as any)().set(opt).from(element).save();
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback to browser print if html2pdf encounters an issue
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle Copy Raw Text
  const handleCopyMarkdown = async () => {
    try {
      const res = await fetch('/PANDUAN_MENGELOLA_WEBSITE.md');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy markdown text:', e);
    }
  };

  // Handle Download Raw .md file
  const handleDownloadMd = () => {
    const link = document.createElement('a');
    link.href = '/PANDUAN_MENGELOLA_WEBSITE.md';
    link.download = 'PANDUAN_MENGELOLA_WEBSITE.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans print:bg-white print:text-black">
      {/* Top Navigation Bar - Hidden on print */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-lg no-print">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link 
              to="/admin" 
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali ke Admin</span>
            </Link>
            <div className="h-5 w-px bg-slate-700 hidden sm:block" />
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-sky-400" />
              <h1 className="text-sm md:text-base font-bold text-white tracking-tight">
                Panduan Pengelolaan Website Travel
              </h1>
              <span className="bg-sky-500/20 text-sky-300 text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border border-sky-500/30">
                PDF Ready
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700"
              title="Salin Teks Panduan"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden md:inline">{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <button
              onClick={handleDownloadMd}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700"
              title="Download File .MD"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">File .MD</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Cetak / Print PDF</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md hover:shadow-sky-500/20 transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Download PDF Direct'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Floating Quick Navigation Sidebar (Hidden on Print) */}
        <aside className="lg:w-64 shrink-0 no-print">
          <div className="sticky top-20 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm border-b pb-3 border-slate-100">
              <Compass className="w-4 h-4 text-sky-600" />
              <span>Navigasi Cepat</span>
            </div>

            <nav className="space-y-1 text-xs font-medium">
              <button
                onClick={() => scrollToSection('bagian-1')}
                className="w-full text-left px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-between group transition"
              >
                <span>Bagian I: Instalasi & Setup</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>
              <div className="pl-3 space-y-1 text-[11px] text-slate-500 border-l border-slate-200 my-1">
                <a href="#11-pendaftaran" className="block py-1 hover:text-sky-600 transition">1.1 Pendaftaran & Paket</a>
                <a href="#12-informasi-dasar" className="block py-1 hover:text-sky-600 transition">1.2 Profil & Info Usaha</a>
                <a href="#13-custom-domain" className="block py-1 hover:text-sky-600 transition">1.3 Custom Domain & Cloudflare</a>
                <a href="#14-branding-seo" className="block py-1 hover:text-sky-600 transition">1.4 Branding & Meta SEO</a>
                <a href="#15-setup-integrasi" className="block py-1 hover:text-sky-600 transition">1.5 WhatsApp, Email & Payment</a>
              </div>

              <button
                onClick={() => scrollToSection('bagian-2')}
                className="w-full text-left px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-between group transition"
              >
                <span>Bagian II: Katalog Tour</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>
              <div className="pl-3 space-y-1 text-[11px] text-slate-500 border-l border-slate-200 my-1">
                <a href="#21-ai-generator" className="block py-1 hover:text-sky-600 transition">2.1 Membuat Tour dengan AI</a>
                <a href="#22-cloning-tour" className="block py-1 hover:text-sky-600 transition">2.2 Duplikasi / Cloning Tour</a>
                <a href="#23-komponen-kualitas" className="block py-1 hover:text-sky-600 transition">2.3 Komponen Tour Berkualitas</a>
              </div>

              <button
                onClick={() => scrollToSection('bagian-3')}
                className="w-full text-left px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-between group transition"
              >
                <span>Bagian III: Mengelola Booking</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
              </button>
              <div className="pl-3 space-y-1 text-[11px] text-slate-500 border-l border-slate-200 my-1">
                <a href="#31-booking-flow" className="block py-1 hover:text-sky-600 transition">3.1 Alur Pemesanan (Flow)</a>
                <a href="#32-status-booking" className="block py-1 hover:text-sky-600 transition">3.2 Memproses Status Booking</a>
                <a href="#33-invoice-evoucher" className="block py-1 hover:text-sky-600 transition">3.3 Invoice & E-Voucher</a>
                <a href="#34-kalender-kuota" className="block py-1 hover:text-sky-600 transition">3.4 Kalender & Kuota Tanggal</a>
              </div>
            </nav>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={handlePrint}
                className="w-full py-2.5 px-3 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition border border-sky-200/60"
              >
                <Printer className="w-4 h-4 text-sky-600" />
                <span>Cetak Lembar PDF</span>
              </button>
            </div>
          </div>
        </aside>

        {/* PDF Document Printable Paper Canvas */}
        <main className="flex-1">
          <div 
            ref={contentRef}
            id="pdf-document-paper"
            className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200 text-slate-800 leading-relaxed print:p-0 print:shadow-none print:border-none print:rounded-none space-y-10"
            style={{ width: '100%', minHeight: '1000px' }}
          >
            {/* COVER / HEADER BANNER */}
            <div className="border-b-2 border-slate-900 pb-8 space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl tracking-wider shadow-md">
                    TB
                  </div>
                  <div>
                    <span className="text-xs font-bold text-sky-600 tracking-wider uppercase block">
                      TRIPBONE SAAS PLATFORM
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Travel & Tour Operator System
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-slate-100 text-slate-700 text-[11px] font-mono font-bold px-3 py-1 rounded-full border border-slate-200">
                    Edisi Panduan Official v2.5
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                  📘 Panduan Lengkap Mengelola Website Travel & Tour Operator
                </h1>
                <p className="text-sm font-semibold text-slate-600 mt-2">
                  Solusi Manajemen Operasional, Pembuatan Tour AI, Domain, & Sistem Booking Otomatis
                </p>
              </div>

              <div className="bg-sky-50 border-l-4 border-sky-600 p-4 rounded-r-xl text-xs text-sky-900 leading-relaxed font-medium">
                Selamat datang di Panduan Pengelolaan Website Travel & Tour Operator. Dokumen ini dirancang sebagai panduan operasional langkah demi langkah untuk membantu Anda mengkonfigurasi, mengelola konten tour, dan menangani pemesanan (booking) secara efektif dan profesional.
              </div>
            </div>

            {/* DAFTAR ISI (TABLE OF CONTENTS BOX) */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-3 print:bg-slate-50/50">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-200 pb-2">
                <BookOpen className="w-4 h-4 text-sky-600" />
                <span>📑 DAFTAR ISI PANDUAN</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block text-sky-700">BAGIAN I: INSTALASI & SETUP</span>
                  <ul className="space-y-1 text-slate-600 pl-2 border-l border-slate-300">
                    <li>1.1 Pendaftaran & Paket</li>
                    <li>1.2 Informasi Dasar & Profil</li>
                    <li>1.3 Custom Domain & Cloudflare</li>
                    <li>1.4 Branding & Meta SEO</li>
                    <li>1.5 Kontak, WhatsApp, Email, Payment</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block text-sky-700">BAGIAN II: KATALOG TOUR</span>
                  <ul className="space-y-1 text-slate-600 pl-2 border-l border-slate-300">
                    <li>2.1 Tambah Tour dengan AI</li>
                    <li>2.2 Cloning / Duplikasi Tour</li>
                    <li>2.3 Komponen Tour Berkualitas</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block text-sky-700">BAGIAN III: MENGELOLA BOOKING</span>
                  <ul className="space-y-1 text-slate-600 pl-2 border-l border-slate-300">
                    <li>3.1 Alur Pemesanan (Flow)</li>
                    <li>3.2 Memproses Status Booking</li>
                    <li>3.3 Invoice & E-Voucher</li>
                    <li>3.4 Kalender & Kuota Tanggal</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* =========================================
                BAGIAN I: INSTALASI & KONFIGURASI AWAL
               ========================================= */}
            <section id="bagian-1" className="space-y-8 page-break-before">
              <div className="border-b-2 border-sky-600 pb-2 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm">
                    I
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                    🚀 BAGIAN I: INSTALASI & KONFIGURASI AWAL
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">Konfigurasi Sistem</span>
              </div>

              {/* 1.1 */}
              <div id="11-pendaftaran" className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-l-4 border-slate-900 pl-3">
                  <span>1.1 Pendaftaran, Pemilihan Paket, dan Pembayaran</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Untuk memulai pembuatan website tour operator Anda di platform Tripbone SaaS:
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-700 font-medium">
                  <li>
                    <strong>Akses Portal Tripbone SaaS</strong>: Buka alamat portal utama di <code className="bg-slate-100 text-sky-700 px-1.5 py-0.5 rounded border border-slate-200">https://tripbone.com</code> (atau domain resmi yang ditentukan).
                  </li>
                  <li>
                    <strong>Klik Tombol "Mulai Sekarang" / "Buat Website Tour"</strong>: Anda akan diarahkan langsung ke formulir pendaftaran tenant/workspace baru.
                  </li>
                  <li>
                    <strong>Isi Formulir Pendaftaran Workspace</strong>:
                    <ul className="list-disc pl-5 mt-1 text-slate-600 space-y-1">
                      <li><strong>Nama Usaha / Brand</strong>: Masukkan nama agen travel Anda (contoh: <em>Smart Bali Tours</em>).</li>
                      <li><strong>URL Subdomain (Slug)</strong>: Pilih kata kunci URL unik (contoh: <code className="text-sky-600 font-mono">smartbalitours</code>). Website awal Anda akan aktif di <code className="text-sky-600 font-mono">smartbalitours.tripbone.com</code>.</li>
                      <li><strong>Email Admin & Password</strong>: Masukkan alamat email aktif untuk akses login Dashboard Admin.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Pilih Paket Berlangganan</strong>:
                    <ul className="list-disc pl-5 mt-1 text-slate-600 space-y-1">
                      <li><strong>Starter</strong>: Sangat cocok untuk agen travel pemula / skala kecil (hingga 10 paket tour).</li>
                      <li><strong>Pro / Business</strong>: Direkomendasikan untuk tour operator profesional (unlimited tour, custom domain, AI Content Generator, Payment Gateway, & analisis bisnis).</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Proses Pembayaran & Aktivasi Instant</strong>:
                    Selesaikan pembayaran menggunakan QRIS / Transfer Bank / Kartu Kredit. Setelah terverifikasi, sistem mengaktifkan workspace dan membuka akses penuh ke Dashboard Admin (<code className="text-slate-800 bg-slate-100 px-1 rounded">/admin</code>).
                  </li>
                </ol>
              </div>

              {/* 1.2 */}
              <div id="12-informasi-dasar" className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-l-4 border-slate-900 pl-3">
                  <span>1.2 Pengisian Informasi Dasar & Profil Usaha</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Setel profil identitas agen travel Anda pada saat pertama kali login:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <p className="font-semibold text-slate-900">Langkah Navigasi: Dashboard Admin ➔ Settings ➔ General Settings</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    <li><strong>Nama Perusahaan (Company Name)</strong>: Nama legal/komersial agen wisata Anda.</li>
                    <li><strong>Alamat Kantor & Lokasi</strong>: Alamat fisik kantor operasional yang ditampilkan di bagian footer website.</li>
                    <li><strong>Hotline Customer Service</strong>: Nomor telepon kantor / layanan darurat wisatawan.</li>
                    <li><strong>Mata Uang Utama (Currency)</strong>: Pilih IDR (Rp) untuk wisatawan lokal atau USD ($) untuk wisatawan mancanegara.</li>
                    <li><strong>Bahasa Utama Website</strong>: Bahasa Indonesia, English, atau Multi-bahasa.</li>
                  </ul>
                </div>
              </div>

              {/* 1.3 */}
              <div id="13-custom-domain" className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-l-4 border-slate-900 pl-3">
                  <span>1.3 Pengaturan Custom Domain</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Website Anda dapat diakses menggunakan domain pribadi profesional (contoh: <code className="bg-slate-100 text-sky-700 px-1.5 py-0.5 rounded font-mono">www.smartbalitours.com</code>).
                </p>

                {/* Sub: Pembelian Domain */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    📍 Dimana & Bagaimana Membeli Domain
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block mb-1">Registrar Lokal Indonesia:</span>
                      <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                        <li>Niagahoster (<code className="text-sky-600">niagahoster.co.id</code>)</li>
                        <li>Rumahweb (<code className="text-sky-600">rumahweb.com</code>)</li>
                        <li>Dewaweb (<code className="text-sky-600">dewaweb.com</code>)</li>
                      </ul>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-900 block mb-1">Registrar Internasional:</span>
                      <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                        <li>Namecheap (<code className="text-sky-600">namecheap.com</code>)</li>
                        <li>Cloudflare Registrar (<code className="text-sky-600">cloudflare.com</code>)</li>
                        <li>GoDaddy (<code className="text-sky-600">godaddy.com</code>)</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-xl text-xs text-amber-900 font-medium">
                    💡 <strong>Tips Memilih Domain:</strong> Gunakan akhiran <strong>.com</strong> jika Anda menargetkan wisatawan internasional. Gunakan akhiran <strong>.co.id / .id</strong> untuk memperkuat kepercayaan pasar wisatawan domestik Indonesia.
                  </div>
                </div>

                {/* Sub: Cloudflare Setting */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    ⚡ Langkah Setting DNS di Cloudflare
                  </h4>
                  <p className="text-xs text-slate-600">
                    Penggunaan Cloudflare direkomendasikan untuk proteksi HTTPS SSL gratis, akselerasi kecepatan, dan kestabilan jaringan DNS.
                  </p>

                  <div className="space-y-3 text-xs">
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1">
                      <span className="font-bold text-slate-900 block text-sky-700">Langkah 1: Sambungkan Domain ke Cloudflare</span>
                      <p className="text-slate-600">1. Daftar akun di Cloudflare.com ➔ Klik "Add a Site" ➔ Masukkan <code className="font-mono">smartbalitours.com</code>.</p>
                      <p className="text-slate-600">2. Pilih paket Free Plan ➔ Salin 2 alamat Nameserver Cloudflare (contoh: <code className="font-mono">ns1.cloudflare.com</code> & <code className="font-mono">ns2.cloudflare.com</code>).</p>
                      <p className="text-slate-600">3. Masuk ke panel tempat beli domain Anda ➔ Ganti Nameserver bawaan dengan Nameserver Cloudflare tersebut.</p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                      <span className="font-bold text-slate-900 block text-sky-700">Langkah 2: Tambahkan Record DNS di Cloudflare</span>
                      <p className="text-slate-600">Buka menu <strong>DNS ➔ Records</strong> pada Cloudflare, lalu masukkan 2 record berikut:</p>
                      
                      {/* DNS Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse bg-white rounded-lg overflow-hidden border border-slate-200">
                          <thead>
                            <tr className="bg-slate-800 text-white text-[11px] uppercase tracking-wider">
                              <th className="p-2">Type</th>
                              <th className="p-2">Name / Host</th>
                              <th className="p-2">Target / Value / IP</th>
                              <th className="p-2">Proxy Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                            <tr>
                              <td className="p-2 font-bold text-blue-600">A</td>
                              <td className="p-2">@</td>
                              <td className="p-2">76.76.21.21 <span className="text-slate-400 text-[10px]">(Server Tripbone)</span></td>
                              <td className="p-2 text-amber-600 font-bold">Proxied (Awan Oranye)</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold text-blue-600">CNAME</td>
                              <td className="p-2">www</td>
                              <td className="p-2">cname.tripbone.com</td>
                              <td className="p-2 text-amber-600 font-bold">Proxied (Awan Oranye)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1">
                      <span className="font-bold text-slate-900 block text-sky-700">Langkah 3: Masukkan Domain di Dashboard Admin</span>
                      <p className="text-slate-600">Buka Dashboard Admin Tripbone ➔ <strong>Settings ➔ General / Domain</strong>. Ketikkan nama domain Anda (<code className="font-mono">smartbalitours.com</code>) lalu klik <strong>"Simpan & Verifikasi Domain"</strong>. Sistem akan otomatis menerbitkan SSL gratis dalam beberapa menit.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1.4 */}
              <div id="14-branding-seo" className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-l-4 border-slate-900 pl-3">
                  <span>1.4 Branding: Judul Website, Meta SEO, Logo, & Favicon</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Atur identitas visual dan kata kunci pencarian agar website Anda berperingkat tinggi di Google:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block border-b pb-1 border-slate-200">🔍 Optimasi SEO Meta</span>
                    <ul className="space-y-1.5 text-slate-700">
                      <li>
                        <strong>Judul Website (Site Title)</strong>:
                        <p className="text-slate-500 italic">Contoh: "Smart Bali Tours - Paket Wisata Bali Terpercaya & Sewa Mobil"</p>
                      </li>
                      <li>
                        <strong>Meta Description</strong>:
                        <p className="text-slate-500 italic">Contoh: "Penyedia paket wisata Bali terlengkap, sewa mobil murah, tour Nusa Penida, dan petualangan ATV Bali dengan pelayanan profesional."</p>
                      </li>
                      <li>
                        <strong>Meta Keywords</strong>:
                        <p className="text-slate-500 font-mono">paket tour bali, sewa mobil bali, wisata nusa penida, tour bali murah</p>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block border-b pb-1 border-slate-200">🖼️ Logo & Asset Visual</span>
                    <ul className="space-y-1.5 text-slate-700">
                      <li>
                        <strong>Logo Utama Header</strong>: Format PNG Transparan (Disarankan: <code className="font-mono text-slate-800">300 x 80 px</code>).
                      </li>
                      <li>
                        <strong>Logo Footer / Dark Mode</strong>: Versi warna terang jika background footer berwarna gelap.
                      </li>
                      <li>
                        <strong>Favicon</strong>: Ikon kecil tab browser. Format PNG/ICO (<code className="font-mono text-slate-800">512 x 512 px</code>).
                      </li>
                      <li>
                        <strong>OG Social Image</strong>: Gambar berukuran <code className="font-mono text-slate-800">1200 x 630 px</code> yang muncul saat link website dibagikan ke WhatsApp / Media Sosial.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 1.5 */}
              <div id="15-setup-integrasi" className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-l-4 border-slate-900 pl-3">
                  <span>1.5 Setup Kontak, WhatsApp, Email, & Payment Gateway</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>1. WhatsApp Direct</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Masukkan nomor admin dengan format internasional tanpa <code className="text-red-600 font-bold">+</code> atau angka nol di depan.
                    </p>
                    <p className="font-mono text-[11px] text-emerald-800 font-bold">✅ Benar: 6281234567890</p>
                    <p className="font-mono text-[11px] text-red-600 line-through">❌ Salah: 081234567890</p>
                  </div>

                  <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-blue-900">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span>2. Email Notifikasi</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Atur alamat email penerima notifikasi pesanan baru (misal: <code className="font-mono">booking@smartbalitours.com</code>).
                    </p>
                  </div>

                  <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-purple-900">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <span>3. Payment Gateway</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      <strong>Midtrans (IDR)</strong>: Masukkan Server Key & Client Key.<br/>
                      <strong>Stripe / PayPal (USD)</strong>: Untuk kartu kredit internasional.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* =========================================
                BAGIAN II: MENGELOLA KATALOG TOUR & KONTEN
               ========================================= */}
            <section id="bagian-2" className="space-y-8 page-break-before">
              <div className="border-b-2 border-emerald-600 pb-2 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    II
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                    🏞️ BAGIAN II: MENGELOLA KATALOG TOUR & KONTEN
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">Katalog Produk</span>
              </div>

              {/* 2.1 */}
              <div id="21-ai-generator" className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-l-4 border-slate-900 pl-3">
                  <span>2.1 Menambahkan Paket Tour Baru Menggunakan AI Generator</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Platform Tripbone dilengkapi fitur AI Content Generator yang secara otomatis menyusun deskripsi menarik, itinerary harian, poin fasilitas, hingga saran harga hanya dari 1 kalimat instruksi.
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 block">Langkah Membuat Tour dengan AI:</span>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-700 font-medium">
                    <li>Buka Dashboard Admin ➔ Pilih menu <strong>Tours</strong> ➔ Klik <strong>"+ Tambah Tour Baru"</strong>.</li>
                    <li>Pilih opsi mode <strong>"Generate dengan AI"</strong>.</li>
                    <li>Ketikkan instruksi singkat (prompt) mengenai destinasi, durasi, dan fasilitas.</li>
                    <li>Klik <strong>"Generate Tour Konten"</strong> ➔ Sistem akan membuat judul SEO, deskripsi, itinerary, fasilitas, dan FAQ secara instant.</li>
                    <li>Periksa kembali data (*review*), upload gambar galeri utama, lalu klik <strong>Publikasikan Tour</strong>.</li>
                  </ol>
                </div>

                {/* PROMPT EXAMPLES BOX */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Contoh Prompt AI yang Sangat Efektif:</span>
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono leading-relaxed text-[11px] border border-slate-800">
                      <span className="text-sky-400 font-bold block mb-1"># Contoh Prompt Paket Tour Harian (Day Tour):</span>
                      "Buatkan paket tour harian 1 hari di Bali dengan nama 'Nusa Penida West & Snorkeling Adventure'. Durasi 10 jam. Aktivitas meliputi Kelingking Beach, Broken Beach, Angel's Billabong, dan Snorkeling di Wall Bay. Sudah termasuk makan siang, tiket fastboat PP, dan mobil ber-AC. Bahasa gaya penulisan menarik, profesional, dan ramah wisatawan asing maupun domestik."
                    </div>

                    <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono leading-relaxed text-[11px] border border-slate-800">
                      <span className="text-emerald-400 font-bold block mb-1"># Contoh Prompt Paket Multi-Hari (3D2N):</span>
                      "Buatkan paket wisata 3 Hari 2 Malam di Lombok dengan nama 'Lombok Exotic Gili Trawangan & Sasak Heritage'. Hari 1: Penjemputan airport + Desa Sukarara & Desa Sade. Hari 2: Full day island hopping Gili Trawangan & Snorkeling. Hari 3: Pusat oleh-oleh & transfer airport. Sertakan saran harga untuk paket privat 2-4 orang."
                    </div>
                  </div>
                </div>
              </div>

              {/* 2.2 */}
              <div id="22-cloning-tour" className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-l-4 border-slate-900 pl-3">
                  <span>2.2 Membuat Tour Baru dengan Cara Cloning / Duplikasi</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Gunakan fitur Cloning jika ingin membuat variasi paket baru yang mirip (misal membedakan paket <em>Standard</em> vs <em>VIP Deluxe</em>) tanpa harus mengisi dari awal.
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-900 block">Langkah Duplikasi:</span>
                  <p className="text-slate-700">1. Buka menu <strong>Tours</strong> di Dashboard Admin.</p>
                  <p className="text-slate-700">2. Cari paket tour yang ingin dijadikan acuan/template.</p>
                  <p className="text-slate-700">3. Klik ikon titik tiga (<code className="font-bold">...</code>) ➔ Opsi <strong>"Clone / Duplikat Tour"</strong>.</p>
                  <p className="text-slate-700">4. Sistem membuat draft baru bernama <code className="bg-slate-200 px-1 rounded">Copy of [Nama Original]</code>. Ubah nama, foto, dan harga sesuai kebutuhan, lalu klik <strong>Simpan</strong>.</p>
                </div>
              </div>

              {/* 2.3 */}
              <div id="23-komponen-kualitas" className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-l-4 border-slate-900 pl-3">
                  <span>2.3 Struktur Komponen Tour yang Berkualitas</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Untuk memaksimalkan angka konfirmasi penjualan (*conversion rate*), pastikan paket tour mengandung informasi lengkap berikut:
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse bg-white rounded-xl overflow-hidden border border-slate-200">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                        <th className="p-3 w-1/4">Komponen Tour</th>
                        <th className="p-3">Deskripsi & Standar Kualitas Best Practice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      <tr>
                        <td className="p-3 font-bold text-slate-900 bg-slate-50">Gambar Utama (Hero Cover)</td>
                        <td className="p-3 text-slate-700">Gunakan foto pemandangan beresolusi tinggi (min <code className="font-mono">1200 x 800 px</code>), terang, dan bebas watermark mengganggu.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900 bg-slate-50">Transparansi Harga</td>
                        <td className="p-3 text-slate-700">Tentukan harga per orang (misal Rp 450.000/pax) atau harga bertingkat kuota peserta (misal 2 pax @ Rp 600.000, 4 pax @ Rp 450.000).</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900 bg-slate-50">Itinerary Rinci</td>
                        <td className="p-3 text-slate-700">Cantumkan estimasi jam dan urutan tempat kunjungan secara jelas agar calon tamu memiliki kepastian rencana.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900 bg-slate-50">Inclusions (Termasuk)</td>
                        <td className="p-3 text-slate-700 font-medium text-emerald-800">Tulis tegas: Driver/Guide Berpengalaman, Mobil ber-AC, BBM, Tiket Masuk Objek Wisata, Makan Siang, Air Mineral.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900 bg-slate-50">Exclusions (Tidak Termasuk)</td>
                        <td className="p-3 text-slate-700 font-medium text-red-800">Tulis jujur: Pengeluaran Pribadi, Tipping Driver, Tiket Pesawat PP.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900 bg-slate-50">Area Penjemputan</td>
                        <td className="p-3 text-slate-700">Tentukan wilayah penjemputan gratis (misal: Area Kuta, Seminyak, Sanur, Ubud Center).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* =========================================
                BAGIAN III: MENGELOLA BOOKING & PESANAN
               ========================================= */}
            <section id="bagian-3" className="space-y-8 page-break-before">
              <div className="border-b-2 border-purple-600 pb-2 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                    III
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                    🛒 BAGIAN III: MENGELOLA BOOKING & PESANAN
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">Operasional Pesanan</span>
              </div>

              {/* 3.1 */}
              <div id="31-booking-flow" className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-l-4 border-slate-900 pl-3">
                  <span>3.1 Alur Pemesanan (Booking Flow)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs mb-1">1</span>
                    <span className="font-bold text-slate-900 block">1. Pilih Tour & Tanggal</span>
                    <p className="text-slate-600 text-[11px]">Tamu memilih tanggal pada kalender interaktif & memasukkan jumlah peserta.</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs mb-1">2</span>
                    <span className="font-bold text-slate-900 block">2. Form Data Tamu</span>
                    <p className="text-slate-600 text-[11px]">Mengisi Nama, Email, WhatsApp, Hotel/Meeting Point, dan permintaan khusus.</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs mb-1">3</span>
                    <span className="font-bold text-slate-900 block">3. Pembayaran</span>
                    <p className="text-slate-600 text-[11px]">Memilih metode Transfer Bank, QRIS, Payment Gateway, atau WhatsApp Direct.</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs mb-1">4</span>
                    <span className="font-bold text-slate-900 block">4. Notifikasi Automatic</span>
                    <p className="text-slate-600 text-[11px]">Notifikasi email & pesan WhatsApp terkirim ke Admin dan Pelanggan.</p>
                  </div>
                </div>
              </div>

              {/* 3.2 */}
              <div id="32-status-booking" className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-l-4 border-slate-900 pl-3">
                  <span>3.2 Langkah-Langkah Memproses & Mengubah Status Booking</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Akses tabel manajemen pesanan pada menu <strong>Dashboard Admin ➔ Bookings</strong>:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block border-b pb-1 border-slate-200">
                      🟡 Indikator Status Booking (Booking Status)
                    </span>
                    <ul className="space-y-1.5 text-slate-700">
                      <li><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] uppercase">Pending</span> : Pesanan baru masuk, menunggu verifikasi transfer / DP.</li>
                      <li><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] uppercase">Confirmed</span> : Pembayaran terverifikasi. Jadwal & armada tour diamankan.</li>
                      <li><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">Completed</span> : Kegiatan tour telah selesai terlaksana dengan sukses.</li>
                      <li><span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px] uppercase">Cancelled</span> : Pesanan dibatalkan (karena cuaca buruk / permintaan tamu).</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block border-b pb-1 border-slate-200">
                      💳 Indikator Status Pembayaran (Payment Status)
                    </span>
                    <ul className="space-y-2 text-slate-700">
                      <li><code className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200 font-bold">Unpaid</code> : Belum ada pembayaran masuk.</li>
                      <li><code className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-bold">Deposit Paid</code> : Uang Muka (DP) sudah diterima. Sisa tagihan dibayar di lokasi.</li>
                      <li><code className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">Paid</code> : Pembayaran lunas 100%.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 3.3 */}
              <div id="33-invoice-evoucher" className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-l-4 border-slate-900 pl-3">
                  <span>3.3 Penerbitan Invoice & E-Voucher Pelanggan</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Saat booking diubah menjadi <strong>Confirmed</strong> atau <strong>Paid</strong>:
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                  <p className="font-semibold text-slate-900">Cara Cetak & Kirim Voucher:</p>
                  <p className="text-slate-700">1. Klik pada baris pesanan tamu di tabel <strong>Bookings</strong>.</p>
                  <p className="text-slate-700">2. Klik tombol <strong>"Cetak Invoice"</strong> atau <strong>"Kirim E-Voucher via WhatsApp/Email"</strong>.</p>
                  <p className="text-slate-700">3. Sistem menerbitkan E-Voucher resmi PDF/Web yang memuat:</p>
                  <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                    <li>Logo Brand & Nama Agen Travel Anda.</li>
                    <li>Kode Booking Unik & QR Code Verifikasi.</li>
                    <li>Detail Tanggal, Rincian Peserta, & Lokasi Penjemputan Hotel.</li>
                    <li>Rincian Status Pembayaran (Lunas / Sisa Pelunasan di Lokasi).</li>
                    <li>Kontak Driver / Customer Service yang bertugas.</li>
                  </ul>
                </div>
              </div>

              {/* 3.4 */}
              <div id="34-kalender-kuota" className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-l-4 border-slate-900 pl-3">
                  <span>3.4 Mengatur Kalender Ketersediaan & Kuota Tanggal</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Cegah risiko kelebihan pemesanan (*overbooking*) pada periode musim liburan ramai (*high season*):
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">🚫 Block Dates (Tutup Tanggal Operasional)</span>
                    <p className="text-slate-600 text-[11px]">
                      Akses menu <strong>Calendar / Availability</strong>. Tandai merah tanggal di mana operasional libur/tutup (misal Hari Raya Nyepi / Pemeliharaan Armada).
                    </p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">📊 Limit Kuota Peserta per Hari</span>
                    <p className="text-slate-600 text-[11px]">
                      Tentukan batas maksimal kuota peserta per hari (misal maksimal 15 pax untuk tour boat). Jika kuota terpenuhi, tanggal tersebut otomatis terkunci di formulir pelanggan.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SUMMARY & OPERATIONAL TIPS FOOTER */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3 print:bg-slate-900 print:text-white page-break-inside-avoid">
              <div className="flex items-center space-x-2 font-bold text-sky-400 text-sm uppercase tracking-wider">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <span>💡 REKOMENDASI OPERASIONAL TERBAIK</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <span><strong>Respon Cepat WhatsApp</strong>: Usahakan membalas pertanyaan calon tamu kurang dari 15 menit untuk meningkatkan konfirmasi booking hingga 3x lipat.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <span><strong>Update Galeri Foto Berkala</strong>: Upload foto-foto terbaru wisatawan yang senang (*happy customers*) untuk membangun kepercayaan calon konsumen baru.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">3.</span>
                  <span><strong>Pantau Peringkat SEO Google</strong>: Periksa performa kata kunci pencarian website Anda secara berkala dan perbarui promo musiman secara rutin.</span>
                </li>
              </ul>
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Dokumen Resmi Operasional Tripbone SaaS</span>
                <span>Dokumen Dicetak: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}
