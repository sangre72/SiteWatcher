-- Tenant (Multi-site) System Database Schema
-- 멀티사이트/테넌트 관리를 위한 데이터베이스 스키마

-- 1. 테넌트 테이블
CREATE TABLE IF NOT EXISTS tenants (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_code VARCHAR(50) NOT NULL UNIQUE COMMENT '테넌트 코드 (URL/식별용)',
  tenant_name VARCHAR(100) NOT NULL COMMENT '테넌트 이름',
  domain VARCHAR(255) COMMENT '도메인 주소',
  subdomain VARCHAR(100) COMMENT '서브도메인',
  description TEXT COMMENT '설명',

  -- 설정
  logo_url VARCHAR(500) COMMENT '로고 이미지 URL',
  theme_color VARCHAR(20) DEFAULT '#1976d2' COMMENT '테마 색상',
  language VARCHAR(10) DEFAULT 'ko' COMMENT '기본 언어',
  timezone VARCHAR(50) DEFAULT 'Asia/Seoul' COMMENT '타임존',

  -- 연락처
  admin_email VARCHAR(255) COMMENT '관리자 이메일',
  admin_name VARCHAR(100) COMMENT '관리자 이름',

  -- 공통 필드
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  is_deleted TINYINT(1) DEFAULT 0,

  INDEX idx_tenant_code (tenant_code),
  INDEX idx_domain (domain),
  INDEX idx_subdomain (subdomain),
  INDEX idx_is_active (is_active, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='테넌트(사이트)';

-- 2. boards 테이블에 tenant_id 추가 (기존 테이블 수정)
-- ALTER TABLE boards ADD COLUMN tenant_id BIGINT AFTER id;
-- ALTER TABLE boards ADD CONSTRAINT fk_boards_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
-- ALTER TABLE boards ADD INDEX idx_tenant_id (tenant_id);

-- 기본 테넌트 데이터 삽입
INSERT INTO tenants (
  tenant_code,
  tenant_name,
  description,
  admin_email,
  theme_color,
  created_by,
  updated_by
) VALUES
('default', '기본 사이트', '기본 테넌트 사이트입니다.', 'admin@example.com', '#1976d2', 'system', 'system');
