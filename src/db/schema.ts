import { pgTable, text, integer, doublePrecision, boolean, timestamp, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. MASTER BRANCH OFFICE (BO)
export const masterBo = pgTable('master_bo', {
  id: uuid('id').defaultRandom().primaryKey(),
  kode_bo: text('kode_bo').notNull().unique(),
  nama_bo: text('nama_bo').notNull(),
  zona_id: integer('zona_id').notNull(), // Zona 1 s.d. 13
  wilayah: text('wilayah').notNull(),
  alamat: text('alamat'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_master_bo_kode').on(table.kode_bo),
  index('idx_master_bo_zona').on(table.zona_id),
]);

// 2. MASTER SDM & SALES
export const masterSdm = pgTable('master_sdm', {
  id: uuid('id').defaultRandom().primaryKey(),
  bo_id: uuid('bo_id').notNull().references(() => masterBo.id, { onDelete: 'cascade' }),
  nama: text('nama').notNull(),
  jabatan: text('jabatan').notNull(), // BM, WBM, BA, WH, Pimpas, Korpos, Sales
  no_hp: text('no_hp').default('-'),
  wilayah_kerja: text('wilayah_kerja').notNull(),
  is_placeholder: boolean('is_placeholder').default(false).notNull(),
  kode_placeholder: text('kode_placeholder'),
  status_aktif: boolean('status_aktif').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_master_sdm_bo_id').on(table.bo_id),
  index('idx_master_sdm_jabatan').on(table.jabatan),
  index('idx_master_sdm_placeholder').on(table.is_placeholder),
]);

// 3. MASTER RELASI (SEKOLAH / MITRA)
export const masterRelasi = pgTable('master_relasi', {
  id: uuid('id').defaultRandom().primaryKey(),
  bo_id: uuid('bo_id').notNull().references(() => masterBo.id, { onDelete: 'cascade' }),
  kode_relasi: text('kode_relasi').notNull(),
  nama_relasi: text('nama_relasi').notNull(),
  jenis_relasi: text('jenis_relasi').notNull(), // Sekolah, K3S, IGTKI, MKKS, Dinas Pendidikan, Yayasan Pendidikan
  jenjang: text('jenjang').notNull(), // PAUD/TK, SD/MI, SMP/MTs, SMA/MA, SMK, Umum
  alamat: text('alamat'),
  kontak_person: text('kontak_person'),
  no_kontak: text('no_kontak'),
  default_rabat_persen: doublePrecision('default_rabat_persen').default(20.0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_master_relasi_bo_id').on(table.bo_id),
  index('idx_master_relasi_kode').on(table.kode_relasi),
]);

// 4. MASTER PRODUK (BUKU & KURIKULUM)
export const masterProduk = pgTable('master_produk', {
  id: uuid('id').defaultRandom().primaryKey(),
  kode_sku: text('kode_sku').notNull().unique(),
  judul_buku: text('judul_buku').notNull(),
  jenjang: text('jenjang').notNull(),
  mata_pelajaran: text('mata_pelajaran').notNull(),
  kurikulum: text('kurikulum').default('Kurikulum Merdeka').notNull(),
  penulis: text('penulis'),
  halaman: integer('halaman').default(160),
  default_hpp_persen: doublePrecision('default_hpp_persen').default(35.0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_master_produk_sku').on(table.kode_sku),
  index('idx_master_produk_jenjang').on(table.jenjang),
]);

// 5. MASTER PRODUK HARGA (MATRIKS ZONA 1-13 & MULTI-TAHUN)
export const masterProdukHarga = pgTable('master_produk_harga', {
  id: uuid('id').defaultRandom().primaryKey(),
  produk_id: uuid('produk_id').notNull().references(() => masterProduk.id, { onDelete: 'cascade' }),
  tahun_anggaran: integer('tahun_anggaran').notNull(),
  zona_id: integer('zona_id').notNull(),
  harga_satuan: doublePrecision('harga_satuan').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_master_harga_produk').on(table.produk_id),
  index('idx_master_harga_tahun_zona').on(table.tahun_anggaran, table.zona_id),
  uniqueIndex('idx_master_harga_unique_lookup').on(table.produk_id, table.tahun_anggaran, table.zona_id),
]);

// 6. TARGET PENJUALAN DETAIL (OPERASIONAL KANBAN / MASTER TARGET)
export const targetPenjualanDetail = pgTable('target_penjualan_detail', {
  id: uuid('id').defaultRandom().primaryKey(),
  bo_id: uuid('bo_id').notNull().references(() => masterBo.id, { onDelete: 'cascade' }),
  sdm_id: uuid('sdm_id').notNull().references(() => masterSdm.id, { onDelete: 'cascade' }),
  relasi_id: uuid('relasi_id').notNull().references(() => masterRelasi.id, { onDelete: 'cascade' }),
  produk_id: uuid('produk_id').notNull().references(() => masterProduk.id, { onDelete: 'cascade' }),
  tahun_anggaran: integer('tahun_anggaran').default(2026).notNull(),
  zona_id: integer('zona_id').notNull(),
  harga_satuan: doublePrecision('harga_satuan').notNull(),
  qty: integer('qty').default(0).notNull(),
  persen_keyakinan: doublePrecision('persen_keyakinan').default(100).notNull(),
  persen_rabat: doublePrecision('persen_rabat').default(20).notNull(),
  persen_bsr: doublePrecision('persen_bsr').default(5).notNull(),
  persen_hpp: doublePrecision('persen_hpp').default(35).notNull(),
  nilai_brutto: doublePrecision('nilai_brutto').default(0).notNull(),
  nilai_rabat: doublePrecision('nilai_rabat').default(0).notNull(),
  nilai_bsr: doublePrecision('nilai_bsr').default(0).notNull(),
  nilai_netto: doublePrecision('nilai_netto').default(0).notNull(),
  nilai_hpp: doublePrecision('nilai_hpp').default(0).notNull(),
  laba_kotor: doublePrecision('laba_kotor').default(0).notNull(),
  nilai_tertimbang_brutto: doublePrecision('nilai_tertimbang_brutto').default(0).notNull(),
  catatan: text('catatan'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_target_detail_bo_id').on(table.bo_id),
  index('idx_target_detail_sdm_id').on(table.sdm_id),
  index('idx_target_detail_relasi_id').on(table.relasi_id),
  index('idx_target_detail_produk_id').on(table.produk_id),
  index('idx_target_detail_tahun').on(table.tahun_anggaran),
  index('idx_target_detail_bo_tahun').on(table.bo_id, table.tahun_anggaran),
]);

// 7. APP USERS (SUPERADMIN & BRANCH MANAGERS)
export const appUsers = pgTable('app_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  nama: text('nama').notNull(),
  role: text('role').default('branch_manager').notNull(), // 'superadmin' | 'branch_manager'
  bo_id: uuid('bo_id').references(() => masterBo.id, { onDelete: 'set null' }),
  status_aktif: boolean('status_aktif').default(true).notNull(),
  firebase_uid: text('firebase_uid').unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_app_users_email').on(table.email),
  index('idx_app_users_role').on(table.role),
  index('idx_app_users_bo_id').on(table.bo_id),
]);

// RELATIONS DEFINITIONS
export const masterBoRelations = relations(masterBo, ({ many }) => ({
  sdmList: many(masterSdm),
  relasiList: many(masterRelasi),
  targetList: many(targetPenjualanDetail),
  users: many(appUsers),
}));

export const masterSdmRelations = relations(masterSdm, ({ one, many }) => ({
  bo: one(masterBo, {
    fields: [masterSdm.bo_id],
    references: [masterBo.id],
  }),
  targets: many(targetPenjualanDetail),
}));

export const masterRelasiRelations = relations(masterRelasi, ({ one, many }) => ({
  bo: one(masterBo, {
    fields: [masterRelasi.bo_id],
    references: [masterBo.id],
  }),
  targets: many(targetPenjualanDetail),
}));

export const masterProdukRelations = relations(masterProduk, ({ many }) => ({
  hargaMatrix: many(masterProdukHarga),
  targets: many(targetPenjualanDetail),
}));

export const masterProdukHargaRelations = relations(masterProdukHarga, ({ one }) => ({
  produk: one(masterProduk, {
    fields: [masterProdukHarga.produk_id],
    references: [masterProduk.id],
  }),
}));

export const targetPenjualanDetailRelations = relations(targetPenjualanDetail, ({ one }) => ({
  bo: one(masterBo, {
    fields: [targetPenjualanDetail.bo_id],
    references: [masterBo.id],
  }),
  sdm: one(masterSdm, {
    fields: [targetPenjualanDetail.sdm_id],
    references: [masterSdm.id],
  }),
  relasi: one(masterRelasi, {
    fields: [targetPenjualanDetail.relasi_id],
    references: [masterRelasi.id],
  }),
  produk: one(masterProduk, {
    fields: [targetPenjualanDetail.produk_id],
    references: [masterProduk.id],
  }),
}));

export const appUsersRelations = relations(appUsers, ({ one }) => ({
  bo: one(masterBo, {
    fields: [appUsers.bo_id],
    references: [masterBo.id],
  }),
}));
