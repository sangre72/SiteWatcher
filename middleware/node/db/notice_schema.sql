-- 공지사항 테이블
CREATE TABLE IF NOT EXISTS notices (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '공지사항 ID',
  title VARCHAR(200) NOT NULL COMMENT '제목',
  content TEXT NOT NULL COMMENT '내용',
  author VARCHAR(100) NOT NULL COMMENT '작성자',
  view_count INT DEFAULT 0 COMMENT '조회수',
  is_pinned TINYINT(1) DEFAULT 0 COMMENT '상단 고정 여부',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  created_by VARCHAR(100) NOT NULL COMMENT '생성자 ID',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  updated_by VARCHAR(100) NOT NULL COMMENT '수정자 ID',
  is_active TINYINT(1) DEFAULT 1 COMMENT '사용 여부',
  is_deleted TINYINT(1) DEFAULT 0 COMMENT '삭제 여부',
  INDEX idx_created_at (created_at),
  INDEX idx_is_deleted (is_deleted),
  INDEX idx_is_pinned (is_pinned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공지사항';

-- 공지사항 댓글 테이블
CREATE TABLE IF NOT EXISTS notice_comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '댓글 ID',
  notice_id BIGINT NOT NULL COMMENT '공지사항 ID',
  content TEXT NOT NULL COMMENT '댓글 내용',
  author VARCHAR(100) NOT NULL COMMENT '작성자',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  created_by VARCHAR(100) NOT NULL COMMENT '생성자 ID',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  updated_by VARCHAR(100) NOT NULL COMMENT '수정자 ID',
  is_active TINYINT(1) DEFAULT 1 COMMENT '사용 여부',
  is_deleted TINYINT(1) DEFAULT 0 COMMENT '삭제 여부',
  FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE,
  INDEX idx_notice_id (notice_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공지사항 댓글';

-- 공지사항 첨부파일 테이블
CREATE TABLE IF NOT EXISTS notice_attachments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '첨부파일 ID',
  notice_id BIGINT NOT NULL COMMENT '공지사항 ID',
  original_filename VARCHAR(255) NOT NULL COMMENT '원본 파일명',
  stored_filename VARCHAR(255) NOT NULL COMMENT '저장된 파일명',
  file_path VARCHAR(500) NOT NULL COMMENT '파일 경로',
  file_size BIGINT NOT NULL COMMENT '파일 크기 (bytes)',
  mime_type VARCHAR(100) NOT NULL COMMENT 'MIME 타입',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  created_by VARCHAR(100) NOT NULL COMMENT '생성자 ID',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  updated_by VARCHAR(100) NOT NULL COMMENT '수정자 ID',
  is_active TINYINT(1) DEFAULT 1 COMMENT '사용 여부',
  is_deleted TINYINT(1) DEFAULT 0 COMMENT '삭제 여부',
  FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE,
  INDEX idx_notice_id (notice_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공지사항 첨부파일';

-- 샘플 데이터 추가
INSERT INTO notices (title, content, author, is_pinned, created_by, updated_by) VALUES
('시스템 점검 안내', '2026년 1월 15일 새벽 2시부터 4시까지 시스템 점검이 예정되어 있습니다. 점검 시간 동안 서비스 이용이 제한될 수 있습니다.', 'admin', 1, 'admin', 'admin'),
('새로운 기능 업데이트', 'AI 이미지 검색 기능이 추가되었습니다. 자연어로 이미지를 검색할 수 있습니다.', 'admin', 0, 'admin', 'admin'),
('개인정보 처리방침 변경 안내', '개인정보 처리방침이 2026년 1월 1일부로 변경되었습니다. 자세한 내용은 공지사항을 참고해주세요.', 'admin', 0, 'admin', 'admin');

-- 샘플 댓글 추가
INSERT INTO notice_comments (notice_id, content, author, created_by, updated_by) VALUES
(1, '점검 시간이 좀 더 늘어날 수 있나요?', 'user1', 'user1', 'user1'),
(1, '점검 시간은 변경되지 않습니다. 양해 부탁드립니다.', 'admin', 'admin', 'admin'),
(2, '새로운 기능 정말 유용하네요!', 'user2', 'user2', 'user2');
