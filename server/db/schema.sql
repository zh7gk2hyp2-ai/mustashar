-- ════════════════════════════════════════════════════════
--  منصة مستشار – جامعة الطائف
--  مخطط قاعدة البيانات
--  MySQL 8.0+ / MariaDB 10.6+
-- ════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS mustashar_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mustashar_db;

-- ── المديرون ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(60)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  role          ENUM('super_admin','admin','reviewer') DEFAULT 'admin',
  is_active     BOOLEAN DEFAULT TRUE,
  last_login    DATETIME,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── الكليات ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS colleges (
  id   SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── المنسوبون المسجلون ────────────────────────────────────
CREATE TABLE IF NOT EXISTS registrations (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  req_number      VARCHAR(20)  NOT NULL UNIQUE,   -- TU-XXXXXX
  first_name      VARCHAR(60)  NOT NULL,
  last_name       VARCHAR(60)  NOT NULL,
  emp_id          VARCHAR(20)  NOT NULL UNIQUE,   -- رقم المنسوب
  phone           VARCHAR(15)  NOT NULL,
  email           VARCHAR(120) NOT NULL,
  college_id      SMALLINT UNSIGNED,
  work_type       ENUM('أكاديمي','إداري') NOT NULL,
  rate            DECIMAL(10,2),
  rate_type       ENUM('ساعة','يوم','مشروع'),
  admin_exp       TEXT,
  training_exp    TEXT,
  research_exp    TEXT,
  skills          JSON,                            -- مصفوفة المهارات
  languages       JSON,                            -- مصفوفة اللغات
  has_conflict    BOOLEAN DEFAULT FALSE,
  conflict_detail TEXT,
  consent_publish BOOLEAN DEFAULT TRUE,
  consent_pdpl    BOOLEAN DEFAULT TRUE,
  consent_ai      BOOLEAN DEFAULT TRUE,
  cv_path         VARCHAR(255),
  certs_path      JSON,
  ai_summary      TEXT,
  ai_reviewed     BOOLEAN DEFAULT FALSE,
  status          ENUM('قيد المراجعة','معتمد','مرفوض','موقوف') DEFAULT 'قيد المراجعة',
  reviewed_by     INT UNSIGNED,
  reviewed_at     DATETIME,
  rejection_note  TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id)   REFERENCES colleges(id),
  FOREIGN KEY (reviewed_by)  REFERENCES admins(id),
  INDEX idx_status    (status),
  INDEX idx_emp_id    (emp_id),
  INDEX idx_college   (college_id),
  INDEX idx_created   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── المستشارون المعتمدون ──────────────────────────────────
CREATE TABLE IF NOT EXISTS consultants (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  registration_id INT UNSIGNED UNIQUE,
  emp_id        VARCHAR(20)  NOT NULL UNIQUE,
  full_name     VARCHAR(120) NOT NULL,
  title         VARCHAR(180),
  college_id    SMALLINT UNSIGNED,
  department    VARCHAR(120),
  work_type     ENUM('أكاديمي','إداري') NOT NULL,
  email         VARCHAR(120) NOT NULL,
  phone         VARCHAR(15),
  rate          DECIMAL(10,2),
  rate_type     ENUM('ساعة','يوم','مشروع'),
  exp_years     TINYINT UNSIGNED DEFAULT 0,
  skills        JSON,
  languages     JSON,
  certs         JSON,
  admin_exp     TEXT,
  training_exp  TEXT,
  research_exp  TEXT,
  ai_summary    TEXT,
  linkedin_url  VARCHAR(255),
  rating        DECIMAL(3,2) DEFAULT 0.00,
  reviews_count SMALLINT UNSIGNED DEFAULT 0,
  contracts_count SMALLINT UNSIGNED DEFAULT 0,
  is_available  BOOLEAN DEFAULT TRUE,
  is_verified   BOOLEAN DEFAULT TRUE,
  avatar_color  VARCHAR(10) DEFAULT '#006633',
  banner_id     VARCHAR(30),   -- معرّف Banner
  ad_username   VARCHAR(60),   -- حساب Active Directory
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES registrations(id),
  FOREIGN KEY (college_id)      REFERENCES colleges(id),
  INDEX idx_college    (college_id),
  INDEX idx_available  (is_available),
  INDEX idx_rating     (rating DESC),
  FULLTEXT idx_ft (full_name, title, ai_summary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── طلبات التعاقد ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  consultant_id   INT UNSIGNED,
  org_name        VARCHAR(180) NOT NULL,
  contact_name    VARCHAR(120) NOT NULL,
  contact_email   VARCHAR(120) NOT NULL,
  contact_phone   VARCHAR(15),
  service_type    VARCHAR(120) NOT NULL,
  description     TEXT         NOT NULL,
  duration        VARCHAR(60),
  mode            ENUM('حضوري','عن بُعد','مختلط') DEFAULT 'مختلط',
  estimated_value DECIMAL(12,2),
  consultant_share DECIMAL(12,2),
  university_share DECIMAL(12,2),
  status          ENUM('قيد الدراسة','مقبول','مرفوض','تحت التنفيذ','مكتمل') DEFAULT 'قيد الدراسة',
  admin_notes     TEXT,
  rating          TINYINT UNSIGNED,   -- تقييم الجهة للمستشار
  rating_comment  TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (consultant_id) REFERENCES consultants(id),
  INDEX idx_status      (status),
  INDEX idx_consultant  (consultant_id),
  INDEX idx_org         (org_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── التقييمات ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contract_id   INT UNSIGNED NOT NULL UNIQUE,
  consultant_id INT UNSIGNED NOT NULL,
  rating        TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id)   REFERENCES contracts(id),
  FOREIGN KEY (consultant_id) REFERENCES consultants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── سجل التدقيق ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id   INT UNSIGNED,
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(60),
  entity_id  INT UNSIGNED,
  details    JSON,
  ip_address VARCHAR(45),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id),
  INDEX idx_entity    (entity, entity_id),
  INDEX idx_created   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
