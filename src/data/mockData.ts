import {
  MasterBO,
  MasterSDM,
  MasterRelasi,
  MasterProduk,
  MasterProdukHarga,
  TargetPenjualanDetail,
  UserProfile,
} from '../types';
import { calculateFinancials, calculateTargetColumns, ZONA_MULTIPLIERS } from '../utils/calculations';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-superadmin-01',
    nama: 'Budi Santoso, S.E., M.M.',
    email: 'superadmin@edubranch.id',
    role: 'superadmin',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 'user-bm-sby',
    nama: 'Ahmad Fauzi, S.Pd.',
    email: 'bm.surabaya@edubranch.id',
    role: 'branch_manager',
    assigned_bo_id: 'bo-sby-001',
    assigned_bo_nama: 'Branch Office Surabaya',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 'user-bm-mdn',
    nama: 'Siti Nurhaliza, S.E.',
    email: 'bm.medan@edubranch.id',
    role: 'branch_manager',
    assigned_bo_id: 'bo-mdn-002',
    assigned_bo_nama: 'Branch Office Medan',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: 'user-bm-bpn',
    nama: 'Danang Prasetyo (BO Baru - Tes Gatekeeper)',
    email: 'bm.balikpapan@edubranch.id',
    role: 'branch_manager',
    assigned_bo_id: 'bo-bpn-006',
    assigned_bo_nama: 'Branch Office Balikpapan (Kosong SDM)',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
  },
];

export const INITIAL_BRANCH_OFFICES: MasterBO[] = [
  {
    id: 'bo-sby-001',
    kode_bo: 'BO-SBY',
    nama_bo: 'Branch Office Surabaya',
    zona_id: 2,
    wilayah: 'Jawa Timur',
    alamat: 'Jl. Rungkut Industri No. 45, Surabaya, Jawa Timur',
  },
  {
    id: 'bo-mdn-002',
    kode_bo: 'BO-MDN',
    nama_bo: 'Branch Office Medan',
    zona_id: 4,
    wilayah: 'Sumatera Utara',
    alamat: 'Jl. Gatot Subroto KM 6.5, Medan, Sumatera Utara',
  },
  {
    id: 'bo-mks-003',
    kode_bo: 'BO-MKS',
    nama_bo: 'Branch Office Makassar',
    zona_id: 8,
    wilayah: 'Sulawesi Selatan',
    alamat: 'Jl. Urip Sumoharjo No. 120, Makassar, Sulawesi Selatan',
  },
  {
    id: 'bo-bdg-004',
    kode_bo: 'BO-BDG',
    nama_bo: 'Branch Office Bandung',
    zona_id: 1,
    wilayah: 'Jawa Barat',
    alamat: 'Jl. Soekarno Hatta No. 518, Bandung, Jawa Barat',
  },
  {
    id: 'bo-jpr-005',
    kode_bo: 'BO-JPR',
    nama_bo: 'Branch Office Jayapura',
    zona_id: 13,
    wilayah: 'Papua',
    alamat: 'Jl. Raya Abepura No. 88, Jayapura, Papua',
  },
  {
    id: 'bo-bpn-006',
    kode_bo: 'BO-BPN',
    nama_bo: 'Branch Office Balikpapan (Cabang Baru)',
    zona_id: 7,
    wilayah: 'Kalimantan Timur',
    alamat: 'Jl. MT Haryono No. 15, Balikpapan, Kalimantan Timur',
  },
];

export const INITIAL_SDM: MasterSDM[] = [
  // BO Surabaya (bo-sby-001)
  {
    id: 'sdm-sby-01',
    bo_id: 'bo-sby-001',
    nama: 'Ahmad Fauzi, S.Pd.',
    jabatan: 'BM',
    no_hp: '0812-3456-7890',
    wilayah_kerja: 'Seluruh Wilayah BO Surabaya',
    is_placeholder: false,
    status_aktif: true,
  },
  {
    id: 'sdm-sby-02',
    bo_id: 'bo-sby-001',
    nama: 'Dewi Lestari, S.E.',
    jabatan: 'WBM',
    no_hp: '0813-8822-1144',
    wilayah_kerja: 'Operasional & Keuangan BO Surabaya',
    is_placeholder: false,
    status_aktif: true,
  },
  {
    id: 'sdm-sby-03',
    bo_id: 'bo-sby-001',
    nama: 'Rian Kurniawan',
    jabatan: 'Pimpas',
    no_hp: '0821-4455-9900',
    wilayah_kerja: 'Surabaya Timur & Sidoarjo',
    is_placeholder: false,
    status_aktif: true,
  },
  {
    id: 'sdm-sby-04',
    bo_id: 'bo-sby-001',
    nama: 'Bambang Triatmojo',
    jabatan: 'Sales',
    no_hp: '0812-9988-7711',
    wilayah_kerja: 'Kec. Rungkut, Wonokromo, Sukolilo',
    is_placeholder: false,
    status_aktif: true,
  },
  {
    id: 'sdm-sby-05',
    bo_id: 'bo-sby-001',
    nama: 'Tri Wahyuni',
    jabatan: 'Sales',
    no_hp: '0857-1122-3344',
    wilayah_kerja: 'Kec. Tegalsari, Genteng, Bubutan',
    is_placeholder: false,
    status_aktif: true,
  },
  {
    id: 'sdm-sby-06',
    bo_id: 'bo-sby-001',
    nama: 'SRBaru01 (Sales Rekrutmen Baru - Placeholder)',
    jabatan: 'Sales',
    no_hp: '-',
    wilayah_kerja: 'Kec. Tandes, Benowo, Gresik Selatan',
    is_placeholder: true,
    kode_placeholder: 'SRBaru01',
    status_aktif: true,
  },
  {
    id: 'sdm-sby-07',
    bo_id: 'bo-sby-001',
    nama: 'SRDSTB01 (Sales Distributor Eksklusif - Placeholder)',
    jabatan: 'Sales',
    no_hp: '-',
    wilayah_kerja: 'Kab. Sidoarjo Utara (Mitra K3S)',
    is_placeholder: true,
    kode_placeholder: 'SRDSTB01',
    status_aktif: true,
  },
  {
    id: 'sdm-sby-08',
    bo_id: 'bo-sby-001',
    nama: 'Hendra Saputra',
    jabatan: 'WH',
    no_hp: '0819-0022-9911',
    wilayah_kerja: 'Gudang Pusat Rungkut',
    is_placeholder: false,
    status_aktif: true,
  },

  // BO Medan (bo-mdn-002)
  {
    id: 'sdm-mdn-01',
    bo_id: 'bo-mdn-002',
    nama: 'Siti Nurhaliza, S.E.',
    jabatan: 'BM',
    no_hp: '0812-7711-2233',
    wilayah_kerja: 'Seluruh BO Medan & Deli Serdang',
    is_placeholder: false,
    status_aktif: true,
  },
  {
    id: 'sdm-mdn-02',
    bo_id: 'bo-mdn-002',
    nama: 'Rahmat Siregar',
    jabatan: 'Sales',
    no_hp: '0813-4455-6677',
    wilayah_kerja: 'Medan Kota, Medan Barat, Helvetia',
    is_placeholder: false,
    status_aktif: true,
  },
  {
    id: 'sdm-mdn-03',
    bo_id: 'bo-mdn-002',
    nama: 'SRBaru02 (Sales Cadangan Medan Baru)',
    jabatan: 'Sales',
    no_hp: '-',
    wilayah_kerja: 'Deli Serdang & Binjai',
    is_placeholder: true,
    kode_placeholder: 'SRBaru02',
    status_aktif: true,
  },

  // BO Makassar (bo-mks-003)
  {
    id: 'sdm-mks-01',
    bo_id: 'bo-mks-003',
    nama: 'Ir. Daeng Mattalitti',
    jabatan: 'BM',
    no_hp: '0852-9900-1122',
    wilayah_kerja: 'Sulawesi Selatan & Barat',
    is_placeholder: false,
    status_aktif: true,
  },
  {
    id: 'sdm-mks-02',
    bo_id: 'bo-mks-003',
    nama: 'Andi Mallarangeng',
    jabatan: 'Sales',
    no_hp: '0853-4411-2233',
    wilayah_kerja: 'Makassar, Gowa, Maros',
    is_placeholder: false,
    status_aktif: true,
  },

  // BO Bandung (bo-bdg-004)
  {
    id: 'sdm-bdg-01',
    bo_id: 'bo-bdg-004',
    nama: 'Cecep Supriyatna',
    jabatan: 'BM',
    no_hp: '0822-1133-5577',
    wilayah_kerja: 'Bandung Raya & Cimahi',
    is_placeholder: false,
    status_aktif: true,
  },
  {
    id: 'sdm-bdg-02',
    bo_id: 'bo-bdg-004',
    nama: 'Asep Saepudin',
    jabatan: 'Sales',
    no_hp: '0878-2233-4455',
    wilayah_kerja: 'Bandung Kota & Soreang',
    is_placeholder: false,
    status_aktif: true,
  },

  // BO Jayapura (bo-jpr-005)
  {
    id: 'sdm-jpr-01',
    bo_id: 'bo-jpr-005',
    nama: 'Yohanes Kogoya',
    jabatan: 'BM',
    no_hp: '0821-9988-1122',
    wilayah_kerja: 'Jayapura, Sentani, Keerom',
    is_placeholder: false,
    status_aktif: true,
  },
  {
    id: 'sdm-jpr-02',
    bo_id: 'bo-jpr-005',
    nama: 'Markus Wenda',
    jabatan: 'Sales',
    no_hp: '0822-3344-5566',
    wilayah_kerja: 'Kota Jayapura & Sentani',
    is_placeholder: false,
    status_aktif: true,
  },
  // NOTE: BO-BPN (bo-bpn-006) intentionally has NO SDM registered to demonstrate the GATEKEEPER RULE!
];

export const INITIAL_RELASI: MasterRelasi[] = [
  // Surabaya Relasi
  {
    id: 'rel-sby-01',
    bo_id: 'bo-sby-001',
    kode_relasi: 'REL-SD-001',
    nama_relasi: 'SD Negeri 1 Wonokromo',
    jenis_relasi: 'Sekolah',
    jenjang: 'SD/MI',
    alamat: 'Jl. Wonokromo No. 12, Surabaya',
    kontak_person: 'Dra. Endang Sulistyowati (Kepsek)',
    no_kontak: '0812-4411-2200',
    default_rabat_persen: 20,
  },
  {
    id: 'rel-sby-02',
    bo_id: 'bo-sby-001',
    kode_relasi: 'REL-K3S-002',
    nama_relasi: 'K3S Kecamatan Rungkut',
    jenis_relasi: 'K3S',
    jenjang: 'SD/MI',
    alamat: 'Kantor Korwil Rungkut, Surabaya',
    kontak_person: 'Drs. H. Mulyono (Ketua K3S)',
    no_kontak: '0813-5566-7788',
    default_rabat_persen: 22,
  },
  {
    id: 'rel-sby-03',
    bo_id: 'bo-sby-001',
    kode_relasi: 'REL-IGTKI-003',
    nama_relasi: 'IGTKI Kota Surabaya Bagian Timur',
    jenis_relasi: 'IGTKI',
    jenjang: 'PAUD/TK',
    alamat: 'Gedung Guru Jl. Ketabang Kali, Surabaya',
    kontak_person: 'Ibu Ratna Juwita, S.Pd. AUD',
    no_kontak: '0856-7788-9900',
    default_rabat_persen: 25,
  },
  {
    id: 'rel-sby-04',
    bo_id: 'bo-sby-001',
    kode_relasi: 'REL-SMP-004',
    nama_relasi: 'SMP Negeri 3 Surabaya',
    jenis_relasi: 'Sekolah',
    jenjang: 'SMP/MTs',
    alamat: 'Jl. Praban No. 3, Surabaya',
    kontak_person: 'Bambang Irawan, M.Pd.',
    no_kontak: '0812-8800-4411',
    default_rabat_persen: 18,
  },
  {
    id: 'rel-sby-05',
    bo_id: 'bo-sby-001',
    kode_relasi: 'REL-SMA-005',
    nama_relasi: 'SMA Negeri 5 Surabaya',
    jenis_relasi: 'Sekolah',
    jenjang: 'SMA/MA',
    alamat: 'Jl. Kusuma Bangsa No. 21, Surabaya',
    kontak_person: 'Drs. Sukirno (Waka Kurikulum)',
    no_kontak: '0811-3344-5566',
    default_rabat_persen: 18,
  },
  {
    id: 'rel-sby-06',
    bo_id: 'bo-sby-001',
    kode_relasi: 'REL-SMK-006',
    nama_relasi: 'SMK Negeri 1 Surabaya',
    jenis_relasi: 'Sekolah',
    jenjang: 'SMK',
    alamat: 'Jl. SMEA No. 4, Wonokromo, Surabaya',
    kontak_person: 'Ir. Sutarto (Ketua Program)',
    no_kontak: '0812-2244-6688',
    default_rabat_persen: 20,
  },

  // Medan Relasi
  {
    id: 'rel-mdn-01',
    bo_id: 'bo-mdn-002',
    kode_relasi: 'REL-MDN-001',
    nama_relasi: 'SD Negeri 060801 Medan Barat',
    jenis_relasi: 'Sekolah',
    jenjang: 'SD/MI',
    alamat: 'Jl. Sei Batanghari No. 10, Medan',
    kontak_person: 'Hotmaida Tambunan, S.Pd.',
    no_kontak: '0813-6622-1100',
    default_rabat_persen: 20,
  },
  {
    id: 'rel-mdn-02',
    bo_id: 'bo-mdn-002',
    kode_relasi: 'REL-MDN-002',
    nama_relasi: 'K3S Kecamatan Medan Kota',
    jenis_relasi: 'K3S',
    jenjang: 'SD/MI',
    alamat: 'Kompleks Pendidikan Medan Kota',
    kontak_person: 'Maruli Tua Sinaga, M.Pd.',
    no_kontak: '0812-7788-9911',
    default_rabat_persen: 22,
  },
];

export const INITIAL_PRODUK: MasterProduk[] = [
  {
    id: 'prod-001',
    kode_sku: 'BPAUD-TEMA-01',
    judul_buku: 'Buku Tematik PAUD Ceria Karakter Mandiri (Paket Semester 1 & 2)',
    jenjang: 'PAUD/TK',
    mata_pelajaran: 'Tematik PAUD',
    kurikulum: 'Kurikulum Merdeka',
    penulis: 'Tim Guru PAUD Indonesia',
    halaman: 112,
    default_hpp_persen: 32,
  },
  {
    id: 'prod-002',
    kode_sku: 'BSD-MAT-04',
    judul_buku: 'Matematika Pintar Kurikulum Merdeka Kelas 4 SD/MI',
    jenjang: 'SD/MI',
    mata_pelajaran: 'Matematika',
    kurikulum: 'Kurikulum Merdeka',
    penulis: 'Prof. Dr. Ir. Suyanto, M.Sc.',
    halaman: 192,
    default_hpp_persen: 35,
  },
  {
    id: 'prod-003',
    kode_sku: 'BSD-IPAS-05',
    judul_buku: 'IPAS (Ilmu Pengetahuan Alam & Sosial) Jelajah Nusantara Kelas 5 SD',
    jenjang: 'SD/MI',
    mata_pelajaran: 'IPAS',
    kurikulum: 'Kurikulum Merdeka',
    penulis: 'Dra. Sri Wahyuningsih, M.Pd.',
    halaman: 216,
    default_hpp_persen: 34,
  },
  {
    id: 'prod-004',
    kode_sku: 'BSD-BIND-01',
    judul_buku: 'Bahasa Indonesia Aku Bisa Membaca & Menulis Kelas 1 SD',
    jenjang: 'SD/MI',
    mata_pelajaran: 'Bahasa Indonesia',
    kurikulum: 'Kurikulum Merdeka',
    penulis: 'Hartono, M.Hum.',
    halaman: 160,
    default_hpp_persen: 33,
  },
  {
    id: 'prod-005',
    kode_sku: 'BSMP-IPA-07',
    judul_buku: 'IPA Terpadu Eksplorasi Sains Laboratorium Kelas 7 SMP/MTs',
    jenjang: 'SMP/MTs',
    mata_pelajaran: 'IPA',
    kurikulum: 'Kurikulum Merdeka',
    penulis: 'Dr. Hendra Wijaya & Tim',
    halaman: 248,
    default_hpp_persen: 36,
  },
  {
    id: 'prod-006',
    kode_sku: 'BSMP-MAT-08',
    judul_buku: 'Matematika Aljabar & Geometri Interaktif Kelas 8 SMP/MTs',
    jenjang: 'SMP/MTs',
    mata_pelajaran: 'Matematika',
    kurikulum: 'Kurikulum Merdeka',
    penulis: 'Drs. Joko Purwanto',
    halaman: 224,
    default_hpp_persen: 35,
  },
  {
    id: 'prod-007',
    kode_sku: 'BSMA-FIS-10',
    judul_buku: 'Fisika Eksperimental & Konseptual Fase E Kelas 10 SMA/MA',
    jenjang: 'SMA/MA',
    mata_pelajaran: 'Fisika',
    kurikulum: 'Kurikulum Merdeka',
    penulis: 'Dr. Agus Santoso, M.Si.',
    halaman: 280,
    default_hpp_persen: 37,
  },
  {
    id: 'prod-008',
    kode_sku: 'BSMA-BIO-11',
    judul_buku: 'Biologi Sel & Keanekaragaman Hayati Fase F Kelas 11 SMA/MA',
    jenjang: 'SMA/MA',
    mata_pelajaran: 'Biologi',
    kurikulum: 'Kurikulum Merdeka',
    penulis: 'Dra. Nurul Hidayati, M.Sc.',
    halaman: 272,
    default_hpp_persen: 36,
  },
  {
    id: 'prod-009',
    kode_sku: 'BSMK-DKK-10',
    judul_buku: 'Dasar-Dasar Teknik Jaringan Komputer & Telekomunikasi SMK Kelas 10',
    jenjang: 'SMK',
    mata_pelajaran: 'Produktif Kejuruan TJKT',
    kurikulum: 'Kurikulum Merdeka',
    penulis: 'Rizki Pratama, S.T., M.Kom.',
    halaman: 260,
    default_hpp_persen: 38,
  },
];

// Base product prices in Zona 1 for Year 2026 & 2027
const BASE_PRICES_2026: Record<string, number> = {
  'prod-001': 48000,
  'prod-002': 78000,
  'prod-003': 85000,
  'prod-004': 62000,
  'prod-005': 92000,
  'prod-006': 89000,
  'prod-007': 115000,
  'prod-008': 110000,
  'prod-009': 105000,
};

// Generate multi-zona & multi-tahun pricing matrix dynamically
export function generateHargaMatrix(): MasterProdukHarga[] {
  const matrix: MasterProdukHarga[] = [];
  const years = [2026, 2027];

  for (const prod of INITIAL_PRODUK) {
    const base2026 = BASE_PRICES_2026[prod.id] || 75000;
    const base2027 = Math.round(base2026 * 1.07); // ~7% annual inflation index

    for (const year of years) {
      const yearBase = year === 2026 ? base2026 : base2027;

      for (let zona = 1; zona <= 13; zona++) {
        const mult = ZONA_MULTIPLIERS[zona] || 1.0;
        const harga = Math.round((yearBase * mult) / 500) * 500; // Round to nearest 500 Rupiah

        matrix.push({
          id: `prc-${prod.id}-${year}-z${zona}`,
          produk_id: prod.id,
          tahun_anggaran: year,
          zona_id: zona,
          harga_satuan: harga,
        });
      }
    }
  }

  return matrix;
}

export const INITIAL_HARGA_MATRIX: MasterProdukHarga[] = generateHargaMatrix();

// Initial Target details for demonstration in BO Surabaya
export function generateInitialTargets(): TargetPenjualanDetail[] {
  const targets: TargetPenjualanDetail[] = [
    {
      id: 'tgt-sby-001',
      bo_id: 'bo-sby-001',
      sdm_id: 'sdm-sby-04', // Bambang Triatmojo
      relasi_id: 'rel-sby-01', // SD Negeri 1 Wonokromo
      produk_id: 'prod-002', // Matematika SD 4
      tahun_anggaran: 2026,
      zona_id: 2,
      harga_satuan: 81000,
      qty: 450,
      persen_keyakinan: 85,
      persen_rabat: 20,
      persen_bsr: 5,
      persen_hpp: 35,
      ...calculateTargetColumns(450, 81000, 20, 5, 35, 85),
      catatan: 'Pesanan buku semester 1, MOU sudah ditandatangani kepsek',
      created_at: '2026-02-15T08:30:00Z',
    },
    {
      id: 'tgt-sby-002',
      bo_id: 'bo-sby-001',
      sdm_id: 'sdm-sby-04', // Bambang Triatmojo
      relasi_id: 'rel-sby-01', // SD Negeri 1 Wonokromo
      produk_id: 'prod-003', // IPAS SD 5
      tahun_anggaran: 2026,
      zona_id: 2,
      harga_satuan: 88500,
      qty: 400,
      persen_keyakinan: 80,
      persen_rabat: 20,
      persen_bsr: 5,
      persen_hpp: 34,
      ...calculateTargetColumns(400, 88500, 20, 5, 34, 80),
      catatan: 'Paket IPAS gabungan kurikulum merdeka',
      created_at: '2026-02-15T09:00:00Z',
    },
    {
      id: 'tgt-sby-003',
      bo_id: 'bo-sby-001',
      sdm_id: 'sdm-sby-05', // Tri Wahyuni
      relasi_id: 'rel-sby-04', // SMP Negeri 3 Surabaya
      produk_id: 'prod-005', // IPA SMP 7
      tahun_anggaran: 2026,
      zona_id: 2,
      harga_satuan: 95500,
      qty: 600,
      persen_keyakinan: 90,
      persen_rabat: 18,
      persen_bsr: 4,
      persen_hpp: 36,
      ...calculateTargetColumns(600, 95500, 18, 4, 36, 90),
      catatan: 'Pengadaan reguler dana BOS SMPN 3 Surabaya',
      created_at: '2026-02-18T10:15:00Z',
    },
    {
      id: 'tgt-sby-004',
      bo_id: 'bo-sby-001',
      sdm_id: 'sdm-sby-05', // Tri Wahyuni
      relasi_id: 'rel-sby-04', // SMP Negeri 3 Surabaya
      produk_id: 'prod-006', // Matematika SMP 8
      tahun_anggaran: 2026,
      zona_id: 2,
      harga_satuan: 92500,
      qty: 550,
      persen_keyakinan: 90,
      persen_rabat: 18,
      persen_bsr: 4,
      persen_hpp: 35,
      ...calculateTargetColumns(550, 92500, 18, 4, 35, 90),
      catatan: 'Lanjutan repeat order tahun lalu',
      created_at: '2026-02-18T11:00:00Z',
    },
    {
      id: 'tgt-sby-005',
      bo_id: 'bo-sby-001',
      sdm_id: 'sdm-sby-06', // Placeholder SRBaru01
      relasi_id: 'rel-sby-02', // K3S Kec Rungkut
      produk_id: 'prod-004', // Bahasa Indonesia SD 1
      tahun_anggaran: 2026,
      zona_id: 2,
      harga_satuan: 64500,
      qty: 1200,
      persen_keyakinan: 65,
      persen_rabat: 22,
      persen_bsr: 6,
      persen_hpp: 33,
      ...calculateTargetColumns(1200, 64500, 22, 6, 33, 65),
      catatan: 'Target alokasi sales baru untuk proyek pengadaan kolektif K3S Rungkut',
      created_at: '2026-02-20T14:30:00Z',
    },
    {
      id: 'tgt-sby-006',
      bo_id: 'bo-sby-001',
      sdm_id: 'sdm-sby-07', // Placeholder SRDSTB01
      relasi_id: 'rel-sby-03', // IGTKI
      produk_id: 'prod-001', // Buku Tematik PAUD
      tahun_anggaran: 2026,
      zona_id: 2,
      harga_satuan: 50000,
      qty: 1500,
      persen_keyakinan: 75,
      persen_rabat: 25,
      persen_bsr: 5,
      persen_hpp: 32,
      ...calculateTargetColumns(1500, 50000, 25, 5, 32, 75),
      catatan: 'Proyek serentak PAUD se-Surabaya Timur',
      created_at: '2026-02-22T16:00:00Z',
    },
  ];

  return targets;
}

export const INITIAL_TARGETS: TargetPenjualanDetail[] = generateInitialTargets();
