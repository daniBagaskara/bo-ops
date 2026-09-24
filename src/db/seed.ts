import { db } from './index.ts';
import { masterBo, masterSdm, masterRelasi, masterProduk, masterProdukHarga, targetPenjualanDetail, appUsers } from './schema.ts';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export async function runSeed() {
  console.log('--- Starting BO-OPS Database Seed ---');

  // Check if data already seeded
  const existingBo = await db.select().from(masterBo);
  if (existingBo.length > 0) {
    console.log('Database already has BO data, checking users...');
  } else {
    // 1. Seed Branch Offices
    console.log('Seeding Master Branch Offices...');
    const insertedBos = await db.insert(masterBo).values([
      {
        kode_bo: 'BO-SBY',
        nama_bo: 'Branch Office Surabaya',
        zona_id: 2,
        wilayah: 'Jawa Timur',
        alamat: 'Jl. Rungkut Industri No. 45, Surabaya, Jawa Timur',
      },
      {
        kode_bo: 'BO-MDN',
        nama_bo: 'Branch Office Medan',
        zona_id: 4,
        wilayah: 'Sumatera Utara',
        alamat: 'Jl. Gatot Subroto No. 88, Medan, Sumatera Utara',
      },
      {
        kode_bo: 'BO-BDG',
        nama_bo: 'Branch Office Bandung',
        zona_id: 1,
        wilayah: 'Jawa Barat',
        alamat: 'Jl. Soekarno Hatta No. 120, Bandung, Jawa Barat',
      },
      {
        kode_bo: 'BO-MKS',
        nama_bo: 'Branch Office Makassar',
        zona_id: 5,
        wilayah: 'Sulawesi Selatan',
        alamat: 'Jl. Urip Sumoharjo No. 67, Makassar, Sulawesi Selatan',
      },
      {
        kode_bo: 'BO-JPR',
        nama_bo: 'Branch Office Jayapura',
        zona_id: 13,
        wilayah: 'Papua',
        alamat: 'Jl. Percetakan Negara No. 10, Jayapura, Papua',
      },
    ]).returning();

    const boSby = insertedBos.find((b) => b.kode_bo === 'BO-SBY')!;
    const boMdn = insertedBos.find((b) => b.kode_bo === 'BO-MDN')!;
    const boBdg = insertedBos.find((b) => b.kode_bo === 'BO-BDG')!;

    // 2. Seed Master SDM & Sales Placeholders
    console.log('Seeding Master SDM...');
    const insertedSdm = await db.insert(masterSdm).values([
      {
        bo_id: boSby.id,
        nama: 'Bambang Triatmojo, S.E.',
        jabatan: 'Sales',
        no_hp: '0812-3456-7890',
        wilayah_kerja: 'Surabaya Timur & Sidoarjo',
        is_placeholder: false,
        status_aktif: true,
      },
      {
        bo_id: boSby.id,
        nama: 'Dewi Anggraeni, S.Pd.',
        jabatan: 'Sales',
        no_hp: '0813-9876-5432',
        wilayah_kerja: 'Surabaya Barat & Gresik',
        is_placeholder: false,
        status_aktif: true,
      },
      {
        bo_id: boSby.id,
        nama: 'SRBaru-SBY-01 (Proyeksi Sales)',
        jabatan: 'Sales',
        no_hp: '-',
        wilayah_kerja: 'Wilayah Ekspansi Lamongan',
        is_placeholder: true,
        kode_placeholder: 'SRBaru01',
        status_aktif: true,
      },
      {
        bo_id: boMdn.id,
        nama: 'Rian Siregar, S.Kom.',
        jabatan: 'Sales',
        no_hp: '0852-1122-3344',
        wilayah_kerja: 'Medan Kota & Deli Serdang',
        is_placeholder: false,
        status_aktif: true,
      },
      {
        bo_id: boBdg.id,
        nama: 'Asep Saepullah, S.T.',
        jabatan: 'Sales',
        no_hp: '0819-5566-7788',
        wilayah_kerja: 'Bandung Raya & Cimahi',
        is_placeholder: false,
        status_aktif: true,
      },
    ]).returning();

    // 3. Seed Master Relasi
    console.log('Seeding Master Relasi...');
    const insertedRelasi = await db.insert(masterRelasi).values([
      {
        bo_id: boSby.id,
        kode_relasi: 'REL-SBY-001',
        nama_relasi: 'SD Negeri 1 Wonokromo',
        jenis_relasi: 'Sekolah',
        jenjang: 'SD/MI',
        alamat: 'Jl. Wonokromo No. 12, Surabaya',
        kontak_person: 'Drs. H. Mulyadi (Kepsek)',
        no_kontak: '0812-7777-1111',
        default_rabat_persen: 20,
      },
      {
        bo_id: boSby.id,
        kode_relasi: 'REL-SBY-002',
        nama_relasi: 'SMP Negeri 3 Rungkut',
        jenis_relasi: 'Sekolah',
        jenjang: 'SMP/MTs',
        alamat: 'Jl. Rungkut Madya No. 4, Surabaya',
        kontak_person: 'Dra. Endang Sulastri',
        no_kontak: '0813-8888-2222',
        default_rabat_persen: 22,
      },
      {
        bo_id: boSby.id,
        kode_relasi: 'REL-SBY-003',
        nama_relasi: 'K3S SD Wilayah Gubeng',
        jenis_relasi: 'K3S',
        jenjang: 'SD/MI',
        alamat: 'Jl. Dharmawangsa No. 25, Surabaya',
        kontak_person: 'Bpk. Suwandi, M.Pd.',
        no_kontak: '0811-9999-3333',
        default_rabat_persen: 25,
      },
      {
        bo_id: boMdn.id,
        kode_relasi: 'REL-MDN-001',
        nama_relasi: 'SD Swasta Harapan Medan',
        jenis_relasi: 'Sekolah',
        jenjang: 'SD/MI',
        alamat: 'Jl. Imam Bonjol No. 30, Medan',
        kontak_person: 'Ibu Mariani, S.Pd.',
        no_kontak: '0812-4444-5555',
        default_rabat_persen: 20,
      },
    ]).returning();

    // 4. Seed Master Produk
    console.log('Seeding Master Produk...');
    const insertedProduk = await db.insert(masterProduk).values([
      {
        kode_sku: 'BK-KM-SD-01',
        judul_buku: 'Buku Siswa: Matematika Kelas 1 SD',
        jenjang: 'SD/MI',
        mata_pelajaran: 'Matematika',
        kurikulum: 'Kurikulum Merdeka',
        penulis: 'Prof. Suparno, Ph.D.',
        halaman: 184,
        default_hpp_persen: 35,
      },
      {
        kode_sku: 'BK-KM-SD-04',
        judul_buku: 'Buku Siswa: IPAS Kelas 4 SD',
        jenjang: 'SD/MI',
        mata_pelajaran: 'Ilmu Pengetahuan Alam & Sosial',
        kurikulum: 'Kurikulum Merdeka',
        penulis: 'Tim Sains Edukasi',
        halaman: 216,
        default_hpp_persen: 35,
      },
      {
        kode_sku: 'BK-KM-SMP-07',
        judul_buku: 'Buku Siswa: Bahasa Indonesia Kelas 7 SMP',
        jenjang: 'SMP/MTs',
        mata_pelajaran: 'Bahasa Indonesia',
        kurikulum: 'Kurikulum Merdeka',
        penulis: 'Dr. Hendra Gunawan',
        halaman: 240,
        default_hpp_persen: 35,
      },
      {
        kode_sku: 'BK-KM-SMA-10',
        judul_buku: 'Buku Siswa: Informatika Kelas 10 SMA',
        jenjang: 'SMA/MA',
        mata_pelajaran: 'Informatika',
        kurikulum: 'Kurikulum Merdeka',
        penulis: 'Dr. Ing. Budi Rahardjo',
        halaman: 260,
        default_hpp_persen: 35,
      },
    ]).returning();

    // 5. Seed Master Produk Harga (Multi-Zona 1-13 untuk tahun 2026)
    console.log('Seeding Multi-Zone Product Prices (2026)...');
    const multipliers: Record<number, number> = {
      1: 1.0, 2: 1.05, 3: 1.1, 4: 1.15, 5: 1.2, 6: 1.25, 7: 1.3,
      8: 1.35, 9: 1.4, 10: 1.45, 11: 1.5, 12: 1.6, 13: 1.75,
    };
    const basePrices: Record<string, number> = {
      'BK-KM-SD-01': 68000,
      'BK-KM-SD-04': 76000,
      'BK-KM-SMP-07': 85000,
      'BK-KM-SMA-10': 92000,
    };

    const hargaValues: any[] = [];
    for (const p of insertedProduk) {
      const base = basePrices[p.kode_sku] || 70000;
      for (let z = 1; z <= 13; z++) {
        const factor = multipliers[z] || 1.0;
        hargaValues.push({
          produk_id: p.id,
          tahun_anggaran: 2026,
          zona_id: z,
          harga_satuan: Math.round(base * factor / 1000) * 1000,
        });
      }
    }
    await db.insert(masterProdukHarga).values(hargaValues);

    // 6. Seed Target Penjualan Detail
    console.log('Seeding Sample Operational Target...');
    const sdm1 = insertedSdm[0];
    const relasi1 = insertedRelasi[0];
    const prod1 = insertedProduk[0];
    const qty = 500;
    const unitPrice = 71000; // Zona 2 for SD-01
    const brutto = qty * unitPrice; // 35,500,000
    const rabat = Math.round(brutto * 0.20); // 7,100,000
    const bsr = Math.round(brutto * 0.05); // 1,775,000
    const netto = brutto - rabat - bsr; // 26,625,000
    const hpp = Math.round(brutto * 0.35); // 12,425,000
    const laba = netto - hpp; // 14,200,000
    const tertimbang = brutto; // 100% keyakinan

    await db.insert(targetPenjualanDetail).values({
      bo_id: boSby.id,
      sdm_id: sdm1.id,
      relasi_id: relasi1.id,
      produk_id: prod1.id,
      tahun_anggaran: 2026,
      zona_id: boSby.zona_id,
      harga_satuan: unitPrice,
      qty,
      persen_keyakinan: 100,
      persen_rabat: 20,
      persen_bsr: 5,
      persen_hpp: 35,
      nilai_brutto: brutto,
      nilai_rabat: rabat,
      nilai_bsr: bsr,
      nilai_netto: netto,
      nilai_hpp: hpp,
      laba_kotor: laba,
      nilai_tertimbang_brutto: tertimbang,
      catatan: 'Pengadaan Semester 1 TP 2026/2027 Buku Kurikulum Merdeka',
    });
  }

  // 7. Seed App Users
  console.log('Seeding App Users...');
  const salt = await bcrypt.genSalt(10);
  const hashAdmin = await bcrypt.hash('admin123', salt);
  const hashBM = await bcrypt.hash('bm123', salt);

  const boList = await db.select().from(masterBo);
  const sby = boList.find((b) => b.kode_bo === 'BO-SBY') || boList[0];

  // Insert or update users
  const usersToSeed = [
    {
      email: 'superadmin@edubranch.id',
      password_hash: hashAdmin,
      nama: 'Super Admin Pusat',
      role: 'superadmin',
      bo_id: null,
      status_aktif: true,
    },
    {
      email: 'bm.surabaya@edubranch.id',
      password_hash: hashBM,
      nama: 'Ahmad Fauzi (BM Surabaya)',
      role: 'branch_manager',
      bo_id: sby?.id || null,
      status_aktif: true,
    },
    // Also include user's Google email as Super Admin
    {
      email: 'danitugas48@gmail.com',
      password_hash: hashAdmin,
      nama: 'Dani (Super Admin)',
      role: 'superadmin',
      bo_id: null,
      status_aktif: true,
    }
  ];

  for (const u of usersToSeed) {
    const existing = await db.select().from(appUsers).where(eq(appUsers.email, u.email));
    if (existing.length === 0) {
      await db.insert(appUsers).values(u);
      console.log(`Created user: ${u.email} (${u.role})`);
    } else {
      await db.update(appUsers).set({
        nama: u.nama,
        role: u.role,
        bo_id: u.bo_id,
        status_aktif: true,
      }).where(eq(appUsers.email, u.email));
      console.log(`Updated user: ${u.email} (${u.role})`);
    }
  }

  console.log('--- Database Seed Completed Successfully ---');
}

if (process.env.RUN_SEED === 'true') {
  runSeed().then(() => process.exit(0)).catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
