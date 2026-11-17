-- =====================================================================
-- Skema Database MariaDB: pln_pil_3 (Sistem Evaluasi Level 3 UP3 Metro)
-- Server: KemzKun Server
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `pln_pil_3` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pln_pil_3`;

-- 1. Tabel Responden / Peserta Evaluasi
CREATE TABLE IF NOT EXISTS `respondents` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `nip` VARCHAR(100) NOT NULL,
  `nama` VARCHAR(255) NOT NULL,
  `jabatan` VARCHAR(255) DEFAULT '',
  `unit` VARCHAR(255) DEFAULT '',
  `unitId` VARCHAR(100) DEFAULT '',
  `updlId` VARCHAR(100) DEFAULT '',
  `programId` VARCHAR(100) DEFAULT '',
  `periodId` VARCHAR(100) DEFAULT '',
  `telepon` VARCHAR(50) DEFAULT '',
  `email` VARCHAR(150) DEFAULT '',
  `itemCount` INT DEFAULT 11,
  `atasan` JSON NULL,
  `koordinatorInternal` JSON NULL,
  `koordinatorEksternal` JSON NULL,
  `data` LONGTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_resp_nip` (`nip`),
  INDEX `idx_resp_unit` (`unitId`),
  INDEX `idx_resp_updl` (`updlId`),
  INDEX `idx_resp_prog` (`programId`),
  INDEX `idx_resp_period` (`periodId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Evaluasi Level 3
CREATE TABLE IF NOT EXISTS `evaluations` (
  `respondentId` VARCHAR(64) NOT NULL PRIMARY KEY,
  `peserta` JSON NULL,
  `atasan` JSON NULL,
  `koordinator` JSON NULL,
  `validation` JSON NULL,
  `ringkasan` JSON NULL,
  `data` LONGTEXT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Master UPDL
CREATE TABLE IF NOT EXISTS `updls` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `kode` VARCHAR(50) DEFAULT '',
  `nama` VARCHAR(255) NOT NULL,
  `wilayah` VARCHAR(150) DEFAULT '',
  `alamat` TEXT NULL,
  `telepon` VARCHAR(50) DEFAULT '',
  `status` VARCHAR(50) DEFAULT 'AKTIF',
  `data` LONGTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Master Unit Pelaksana
CREATE TABLE IF NOT EXISTS `units` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `kode` VARCHAR(50) DEFAULT '',
  `nama` VARCHAR(255) NOT NULL,
  `induk` VARCHAR(150) DEFAULT '',
  `kota` VARCHAR(150) DEFAULT '',
  `alamat` TEXT NULL,
  `updlId` VARCHAR(100) DEFAULT '',
  `status` VARCHAR(50) DEFAULT 'AKTIF',
  `atasan` JSON NULL,
  `data` LONGTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_unit_updl` (`updlId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel Master Program Pelatihan (PIL)
CREATE TABLE IF NOT EXISTS `programs` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `kode` VARCHAR(50) DEFAULT '',
  `nama` VARCHAR(255) NOT NULL,
  `deskripsi` TEXT NULL,
  `kategori` VARCHAR(100) DEFAULT '',
  `status` VARCHAR(50) DEFAULT 'AKTIF',
  `updlIds` JSON NULL,
  `koordinatorEksternal` JSON NULL,
  `data` LONGTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel Master Periode Evaluasi
CREATE TABLE IF NOT EXISTS `periods` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(255) NOT NULL,
  `programId` VARCHAR(100) DEFAULT '',
  `tenggatPengisian` VARCHAR(50) DEFAULT '',
  `status` VARCHAR(50) DEFAULT 'AKTIF',
  `updlIds` JSON NULL,
  `completionRate` FLOAT DEFAULT 0,
  `deskripsi` TEXT NULL,
  `data` LONGTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_period_prog` (`programId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabel Template Formulir Evaluasi
CREATE TABLE IF NOT EXISTS `form_templates` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `programId` VARCHAR(100) DEFAULT '',
  `judul` VARCHAR(255) DEFAULT '',
  `petunjuk` TEXT NULL,
  `items` JSON NULL,
  `data` LONGTEXT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabel Pengguna / Master Users
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `nip` VARCHAR(100) NOT NULL,
  `nama` VARCHAR(255) NOT NULL,
  `email` VARCHAR(150) DEFAULT '',
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `jabatan` VARCHAR(255) DEFAULT '',
  `unitId` VARCHAR(100) DEFAULT '',
  `unitName` VARCHAR(255) DEFAULT '',
  `updlId` VARCHAR(100) DEFAULT '',
  `status` VARCHAR(50) DEFAULT 'AKTIF',
  `isAdminPusat` TINYINT(1) DEFAULT 0,
  `avatar` LONGTEXT NULL,
  `data` LONGTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX `idx_user_nip` (`nip`),
  INDEX `idx_user_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabel Biometrik Wajah Admin (Fallback Terenkripsi AES-256 & Persetujuan UU PDP)
CREATE TABLE IF NOT EXISTS `admin_biometrics` (
  `userId` VARCHAR(100) NOT NULL PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL,
  `nama` VARCHAR(255) DEFAULT '',
  `role` VARCHAR(50) DEFAULT '',
  `status` VARCHAR(50) DEFAULT 'AKTIF',
  `algorithm` VARCHAR(100) DEFAULT 'AES-256-GCM-L3-v3',
  `featureVector` LONGTEXT NULL,
  `encrypted_embedding` LONGTEXT NULL,
  `qualityScore` FLOAT DEFAULT 0,
  `salt` VARCHAR(255) DEFAULT '',
  `recoveryCodeHash` VARCHAR(255) DEFAULT '',
  `pdp_consent` TINYINT(1) DEFAULT 0,
  `pdp_consent_at` VARCHAR(64) NULL,
  `pdp_consent_ip` VARCHAR(64) NULL,
  `preferred_method` VARCHAR(32) DEFAULT 'auto',
  `enrolledAt` VARCHAR(50) DEFAULT '',
  `updatedAt` VARCHAR(50) DEFAULT '',
  `data` LONGTEXT NULL,
  INDEX `idx_bio_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9B. Tabel Kredensial WebAuthn / Passkeys (Windows Hello, Touch ID, HP QR Passkey)
CREATE TABLE IF NOT EXISTS `webauthn_credentials` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(100) NOT NULL,
  `publicKey` TEXT NOT NULL,
  `counter` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `deviceType` VARCHAR(50) DEFAULT 'singleDevice',
  `backedUp` TINYINT(1) DEFAULT 0,
  `transports` JSON NULL,
  `attachmentType` VARCHAR(32) DEFAULT 'platform',
  `friendlyName` VARCHAR(255) DEFAULT 'Passkey Perangkat',
  `aaguid` VARCHAR(64) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_used_at` TIMESTAMP NULL,
  INDEX `idx_webauthn_user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9C. Tabel Tantangan Autentikasi (WebAuthn, Active Liveness 15s, OTP Fallback)
CREATE TABLE IF NOT EXISTS `auth_challenges` (
  `id` VARCHAR(128) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(100) NOT NULL,
  `purpose` VARCHAR(50) NOT NULL,
  `challenge_data` TEXT NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_chal_user` (`userId`, `purpose`),
  INDEX `idx_chal_exp` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9D. Tabel Rate Limiting & Lockout Biometrik (Max 3x Gagal -> Lockout 15 Menit)
CREATE TABLE IF NOT EXISTS `auth_rate_limits` (
  `identifier` VARCHAR(150) NOT NULL PRIMARY KEY,
  `failed_attempts` INT NOT NULL DEFAULT 0,
  `locked_until` DATETIME NULL,
  `otp_required` TINYINT(1) DEFAULT 0,
  `last_attempt_at` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tabel Log Audit Sistem
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `action` VARCHAR(100) NOT NULL,
  `target` VARCHAR(255) DEFAULT '',
  `details` TEXT NULL,
  `user` VARCHAR(100) DEFAULT '',
  `role` VARCHAR(50) DEFAULT '',
  `timestamp` VARCHAR(50) DEFAULT '',
  `data` LONGTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Tabel Bank Butir Pertanyaan
CREATE TABLE IF NOT EXISTS `bank_butir` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `kompetensi` VARCHAR(255) DEFAULT '',
  `pertanyaan` TEXT NULL,
  `skala` JSON NULL,
  `data` LONGTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Tabel Pengaturan Sistem
CREATE TABLE IF NOT EXISTS `settings` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `data` LONGTEXT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Tabel Token Dicabut (Revoked JWT Blacklist)
CREATE TABLE IF NOT EXISTS `revoked_tokens` (
  `token_hash` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(100) DEFAULT '',
  `revoked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  INDEX `idx_revoked_exp` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


