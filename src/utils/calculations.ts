import { CalculationResult } from '../types';

/**
 * Real-time calculation formula:
 * 1. Nilai Brutto = Qty * Harga Satuan (Sesuai Zona BO)
 * 2. Rabat ke Relasi (Nominal) = Nilai Brutto * % Rabat
 * 3. BSR (Nominal) = Nilai Brutto * % BSR
 * 4. Nilai Netto = Nilai Brutto - Rabat ke Relasi - BSR
 * 5. HPP (Nominal) = Nilai Brutto * % HPP
 * 6. Laba Kotor = Nilai Netto - HPP (atau Nilai Brutto - HPP - Rabat - BSR)
 * 7. Nilai Tertimbang = Nilai Brutto * (% Keyakinan / 100)
 */
export function calculateFinancials(
  qty: number,
  hargaSatuan: number,
  persenRabat: number,
  persenBsr: number,
  persenHpp: number,
  persenKeyakinan: number = 100
): CalculationResult {
  const safeQty = Math.max(0, Number(qty) || 0);
  const safeHarga = Math.max(0, Number(hargaSatuan) || 0);
  const safeRabat = Math.max(0, Number(persenRabat) || 0);
  const safeBsr = Math.max(0, Number(persenBsr) || 0);
  const safeHpp = Math.max(0, Number(persenHpp) || 0);
  const safeKeyakinan = Math.min(100, Math.max(0, Number(persenKeyakinan) || 0));

  const nilaiBrutto = safeQty * safeHarga;
  const nilaiRabat = Math.round(nilaiBrutto * (safeRabat / 100));
  const nilaiBsr = Math.round(nilaiBrutto * (safeBsr / 100));
  const nilaiNetto = nilaiBrutto - nilaiRabat - nilaiBsr;
  const nilaiHpp = Math.round(nilaiBrutto * (safeHpp / 100));
  const labaKotor = nilaiNetto - nilaiHpp;
  const nilaiTertimbang = Math.round(nilaiBrutto * (safeKeyakinan / 100));
  const marginPersen = nilaiBrutto > 0 ? (labaKotor / nilaiBrutto) * 100 : 0;

  return {
    nilaiBrutto,
    nilaiRabat,
    nilaiBsr,
    nilaiNetto,
    nilaiHpp,
    labaKotor,
    nilaiTertimbang,
    marginPersen,
  };
}

export function calculateTargetColumns(
  qty: number,
  hargaSatuan: number,
  persenRabat: number,
  persenBsr: number,
  persenHpp: number,
  persenKeyakinan: number = 100
): {
  nilai_brutto: number;
  nilai_rabat: number;
  nilai_bsr: number;
  nilai_netto: number;
  nilai_hpp: number;
  laba_kotor: number;
  nilai_tertimbang_brutto: number;
} {
  const res = calculateFinancials(qty, hargaSatuan, persenRabat, persenBsr, persenHpp, persenKeyakinan);
  return {
    nilai_brutto: res.nilaiBrutto,
    nilai_rabat: res.nilaiRabat,
    nilai_bsr: res.nilaiBsr,
    nilai_netto: res.nilaiNetto,
    nilai_hpp: res.nilaiHpp,
    laba_kotor: res.labaKotor,
    nilai_tertimbang_brutto: res.nilaiTertimbang,
  };
}

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRupiahCompact(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  if (Math.abs(amount) >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(2).replace('.', ',')} M`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} Rb`;
  }
  return formatRupiah(amount);
}

export function formatPercent(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '0%';
  return `${value.toFixed(1).replace('.', ',')}%`;
}

export function formatNumber(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '0';
  return new Intl.NumberFormat('id-ID').format(value);
}

export const ZONA_DESCRIPTIONS: Record<number, string> = {
  1: 'Zona 1 (DKI Jakarta, Jawa Barat, Banten)',
  2: 'Zona 2 (Jawa Tengah, DI Yogyakarta, Jawa Timur)',
  3: 'Zona 3 (Lampung, Sumatera Selatan, Bengkulu)',
  4: 'Zona 4 (Sumatera Barat, Riau, Jambi, Sumut)',
  5: 'Zona 5 (Aceh, Kepulauan Riau, Bangka Belitung)',
  6: 'Zona 6 (Kalimantan Barat, Kalimantan Tengah)',
  7: 'Zona 7 (Kalimantan Selatan, Kalimantan Timur, Kaltara)',
  8: 'Zona 8 (Sulawesi Selatan, Sulawesi Barat)',
  9: 'Zona 9 (Sulawesi Tenggara, Sulawesi Tengah)',
  10: 'Zona 10 (Sulawesi Utara, Gorontalo, Bali, NTB)',
  11: 'Zona 11 (Nusa Tenggara Timur / NTT)',
  12: 'Zona 12 (Maluku, Maluku Utara)',
  13: 'Zona 13 (Papua, Papua Barat, Papua Pegunungan/Tengah/Selatan)',
};

export const ZONA_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.04,
  3: 1.08,
  4: 1.12,
  5: 1.15,
  6: 1.18,
  7: 1.22,
  8: 1.25,
  9: 1.28,
  10: 1.32,
  11: 1.36,
  12: 1.42,
  13: 1.5,
};
