-- Multi Board System Database Schema
-- 멀티게시판 시스템을 위한 데이터베이스 스키마

-- 1. 게시판 설정 테이블
CREATE TABLE IF NOT EXISTS boards (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  board_code VARCHAR(50) NOT NULL UNIQUE COMMENT '게시판 코드 (URL에 사용)',
  board_name VARCHAR(200) NOT NULL COMMENT '게시판 이름',
  description TEXT COMMENT '게시판 설명',
  board_type VARCHAR(20) DEFAULT 'general' COMMENT '게시판 유형 (notice, free, qna, gallery)',

  -- 권한 설정
  read_permission VARCHAR(20) DEFAULT 'public' COMMENT '읽기 권한 (public, member, admin)',
  write_permission VARCHAR(20) DEFAULT 'member' COMMENT '쓰기 권한 (public, member, admin)',
  comment_permission VARCHAR(20) DEFAULT 'member' COMMENT '댓글 권한 (public, member, admin, disabled)',

  -- 기능 설정
  use_category TINYINT(1) DEFAULT 0 COMMENT '카테고리 사용 여부',
  use_notice TINYINT(1) DEFAULT 1 COMMENT '공지사항 기능 사용',
  use_secret TINYINT(1) DEFAULT 0 COMMENT '비밀글 기능 사용',
  use_attachment TINYINT(1) DEFAULT 1 COMMENT '파일첨부 기능 사용',
  use_like TINYINT(1) DEFAULT 0 COMMENT '좋아요 기능 사용',

  -- 제한 설정
  max_file_size INT DEFAULT 10485760 COMMENT '최대 파일 크기 (bytes, 기본 10MB)',
  max_file_count INT DEFAULT 5 COMMENT '최대 첨부 파일 개수',
  allowed_file_types VARCHAR(255) DEFAULT 'jpg,jpeg,png,gif,pdf,zip' COMMENT '허용 파일 확장자',

  -- 표시 설정
  posts_per_page INT DEFAULT 20 COMMENT '페이지당 게시글 수',
  display_order INT DEFAULT 0 COMMENT '표시 순서',

  -- 공통 필드
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  is_deleted TINYINT(1) DEFAULT 0,

  INDEX idx_board_code (board_code),
  INDEX idx_board_type (board_type),
  INDEX idx_is_active (is_active, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='게시판 설정';

-- 2. 카테고리 테이블
CREATE TABLE IF NOT EXISTS board_categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  board_id BIGINT NOT NULL COMMENT '게시판 ID',
  category_name VARCHAR(100) NOT NULL COMMENT '카테고리명',
  category_order INT DEFAULT 0 COMMENT '표시 순서',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  is_deleted TINYINT(1) DEFAULT 0,

  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
  INDEX idx_board_id (board_id),
  INDEX idx_is_active (is_active, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='게시판 카테고리';

-- 3. 게시글 테이블
CREATE TABLE IF NOT EXISTS board_posts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  board_id BIGINT NOT NULL COMMENT '게시판 ID',
  category_id BIGINT COMMENT '카테고리 ID',

  -- 게시글 정보
  title VARCHAR(500) NOT NULL COMMENT '제목',
  content TEXT NOT NULL COMMENT '내용',
  author VARCHAR(100) NOT NULL COMMENT '작성자',

  -- 상태
  is_notice TINYINT(1) DEFAULT 0 COMMENT '공지사항 여부',
  is_secret TINYINT(1) DEFAULT 0 COMMENT '비밀글 여부',
  secret_password VARCHAR(255) COMMENT '비밀글 비밀번호 (해시)',

  -- 통계
  view_count INT DEFAULT 0 COMMENT '조회수',
  like_count INT DEFAULT 0 COMMENT '좋아요 수',
  comment_count INT DEFAULT 0 COMMENT '댓글 수',

  -- 공통 필드
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  is_deleted TINYINT(1) DEFAULT 0,

  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES board_categories(id) ON DELETE SET NULL,
  INDEX idx_board_id (board_id),
  INDEX idx_category_id (category_id),
  INDEX idx_author (author),
  INDEX idx_is_notice (is_notice),
  INDEX idx_created_at (created_at),
  INDEX idx_is_active (is_active, is_deleted),
  FULLTEXT INDEX ft_title_content (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='게시글';

-- 4. 댓글 테이블
CREATE TABLE IF NOT EXISTS board_comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL COMMENT '게시글 ID',
  parent_id BIGINT COMMENT '부모 댓글 ID (대댓글)',

  content TEXT NOT NULL COMMENT '댓글 내용',
  author VARCHAR(100) NOT NULL COMMENT '작성자',

  -- 비밀 댓글
  is_secret TINYINT(1) DEFAULT 0 COMMENT '비밀 댓글 여부',

  -- 공통 필드
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  is_deleted TINYINT(1) DEFAULT 0,

  FOREIGN KEY (post_id) REFERENCES board_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES board_comments(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_author (author),
  INDEX idx_created_at (created_at),
  INDEX idx_is_active (is_active, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='댓글';

-- 5. 첨부파일 테이블
CREATE TABLE IF NOT EXISTS board_attachments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL COMMENT '게시글 ID',

  original_filename VARCHAR(255) NOT NULL COMMENT '원본 파일명',
  saved_filename VARCHAR(255) NOT NULL COMMENT '저장된 파일명 (UUID)',
  file_path VARCHAR(500) NOT NULL COMMENT '파일 경로',
  file_size BIGINT NOT NULL COMMENT '파일 크기 (bytes)',
  file_type VARCHAR(100) COMMENT 'MIME 타입',
  file_extension VARCHAR(20) COMMENT '확장자',

  download_count INT DEFAULT 0 COMMENT '다운로드 수',

  -- 공통 필드
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  is_deleted TINYINT(1) DEFAULT 0,

  FOREIGN KEY (post_id) REFERENCES board_posts(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id),
  INDEX idx_is_active (is_active, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='첨부파일';

-- 6. 좋아요 테이블
CREATE TABLE IF NOT EXISTS board_likes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL COMMENT '게시글 ID',
  user_id VARCHAR(100) NOT NULL COMMENT '사용자 ID',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (post_id) REFERENCES board_posts(id) ON DELETE CASCADE,
  UNIQUE KEY uk_post_user (post_id, user_id),
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='게시글 좋아요';

-- 기본 게시판 템플릿 데이터 삽입
INSERT INTO boards (
  board_code,
  board_name,
  description,
  board_type,
  read_permission,
  write_permission,
  comment_permission,
  use_category,
  use_notice,
  use_secret,
  use_attachment,
  use_like,
  display_order,
  created_by,
  updated_by
) VALUES
-- 1. 공지사항
('notice', '공지사항', '중요한 공지사항을 알려드립니다.', 'notice',
 'public', 'admin', 'disabled', 0, 1, 0, 1, 0, 1, 'system', 'system'),

-- 2. 자유게시판
('free', '자유게시판', '자유롭게 의견을 나눠보세요.', 'free',
 'public', 'member', 'member', 0, 1, 1, 1, 1, 2, 'system', 'system'),

-- 3. Q&A
('qna', '질문과 답변', '궁금한 점을 질문해주세요.', 'qna',
 'public', 'member', 'member', 1, 1, 1, 1, 0, 3, 'system', 'system');

-- Q&A 게시판 카테고리 추가
INSERT INTO board_categories (board_id, category_name, category_order, created_by, updated_by)
SELECT id, '서비스문의', 1, 'system', 'system' FROM boards WHERE board_code = 'qna'
UNION ALL
SELECT id, '결제문의', 2, 'system', 'system' FROM boards WHERE board_code = 'qna'
UNION ALL
SELECT id, '기타', 3, 'system', 'system' FROM boards WHERE board_code = 'qna';
