const mysql = require('mysql');
const path = require('path');
const fs = require('fs');

// MySQL 연결 설정
let connection = null;
let mysqlAvailable = false;

try {
  connection = mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'dbuser',
    password: process.env.MYSQL_PASSWORD || 'dbuser',
    database: process.env.MYSQL_DATABASE || 'egov'
  });

  connection.connect(error => {
    if (error) {
      console.warn('[Notice MySQL] Connection failed:', error.message);
      mysqlAvailable = false;
    } else {
      console.log('[Notice MySQL] Successfully connected to the database.');
      mysqlAvailable = true;
    }
  });
} catch (err) {
  console.warn('[Notice MySQL] Failed to create connection:', err.message);
}

/**
 * 입력값 검증 및 sanitize
 */
const validateInput = (input, fieldName, maxLength = 1000) => {
  if (typeof input !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (input.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
  }
  // XSS 방지를 위한 기본 검증
  const dangerous = /<script|javascript:|onerror=|onclick=/i;
  if (dangerous.test(input)) {
    throw new Error(`${fieldName} contains invalid characters`);
  }
  return input.trim();
};

/**
 * 페이지네이션 파라미터 검증
 */
const validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;

  if (pageNum < 1) return { page: 1, limit: limitNum };
  if (limitNum < 1 || limitNum > 100) return { page: pageNum, limit: 10 };

  return { page: pageNum, limit: limitNum };
};

/**
 * 공지사항 목록 조회
 * GET /api/notices?page=1&limit=10&search=
 */
const getNotices = async (req, res) => {
  try {
    // 1. MySQL 연결 확인
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    // 2. 입력 검증
    const { page: validPage, limit: validLimit } = validatePagination(
      req.query.page,
      req.query.limit
    );
    const offset = (validPage - 1) * validLimit;

    const searchTerm = req.query.search ?
      validateInput(req.query.search, 'search', 100) : '';

    // 3. 쿼리 실행
    const whereClause = searchTerm ?
      'WHERE (title LIKE ? OR content LIKE ?) AND is_deleted = 0' :
      'WHERE is_deleted = 0';

    const searchPattern = `%${searchTerm}%`;
    const queryParams = searchTerm ?
      [searchPattern, searchPattern, validLimit, offset] :
      [validLimit, offset];

    const listQuery = `
      SELECT
        id,
        title,
        content,
        author,
        view_count,
        created_at,
        updated_at,
        is_pinned
      FROM notices
      ${whereClause}
      ORDER BY is_pinned DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM notices
      ${whereClause}
    `;

    // 4. 병렬 쿼리 실행
    connection.query(listQuery, queryParams, (error, notices) => {
      if (error) {
        console.error('[Notice] Error fetching notices:', error);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: 'Failed to fetch notices'
        });
      }

      const countParams = searchTerm ? [searchPattern, searchPattern] : [];
      connection.query(countQuery, countParams, (countError, countResult) => {
        if (countError) {
          console.error('[Notice] Error counting notices:', countError);
          return res.status(500).json({
            success: false,
            error_code: 'QUERY_ERROR',
            message: 'Failed to count notices'
          });
        }

        // 5. 성공 응답
        res.json({
          success: true,
          data: {
            notices: notices,
            pagination: {
              total: countResult[0].total,
              page: validPage,
              limit: validLimit,
              totalPages: Math.ceil(countResult[0].total / validLimit)
            }
          }
        });
      });
    });
  } catch (error) {
    console.error('[Notice] Error in getNotices:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: 'An error occurred while processing your request'
    });
  }
};

/**
 * 공지사항 상세 조회
 * GET /api/notices/:id
 */
const getNoticeById = async (req, res) => {
  try {
    // 1. MySQL 연결 확인
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    // 2. 입력 검증
    const noticeId = parseInt(req.params.id);
    if (isNaN(noticeId) || noticeId < 1) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_ID',
        message: 'Invalid notice ID'
      });
    }

    // 3. 조회수 증가
    const updateViewQuery = `
      UPDATE notices
      SET view_count = view_count + 1
      WHERE id = ? AND is_deleted = 0
    `;

    connection.query(updateViewQuery, [noticeId], (updateError) => {
      if (updateError) {
        console.error('[Notice] Error updating view count:', updateError);
      }

      // 4. 공지사항 조회
      const selectQuery = `
        SELECT
          id,
          title,
          content,
          author,
          view_count,
          created_at,
          updated_at,
          is_pinned
        FROM notices
        WHERE id = ? AND is_deleted = 0
      `;

      connection.query(selectQuery, [noticeId], (error, results) => {
        if (error) {
          console.error('[Notice] Error fetching notice:', error);
          return res.status(500).json({
            success: false,
            error_code: 'QUERY_ERROR',
            message: 'Failed to fetch notice'
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            error_code: 'NOTICE_NOT_FOUND',
            message: 'Notice not found'
          });
        }

        // 5. 성공 응답
        res.json({
          success: true,
          data: results[0]
        });
      });
    });
  } catch (error) {
    console.error('[Notice] Error in getNoticeById:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: 'An error occurred while processing your request'
    });
  }
};

/**
 * 공지사항 생성
 * POST /api/notices
 */
const createNotice = async (req, res) => {
  try {
    // 1. MySQL 연결 확인
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    // 2. 인증 확인 (세션에서 사용자 정보 확인)
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        error_code: 'AUTH_REQUIRED',
        message: 'Authentication required'
      });
    }

    // 3. 입력 검증
    const { title, content, isPinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error_code: 'MISSING_FIELDS',
        message: 'Title and content are required'
      });
    }

    const validTitle = validateInput(title, 'title', 200);
    const validContent = validateInput(content, 'content', 10000);
    const validIsPinned = isPinned === true ? 1 : 0;
    const author = req.session.userId;

    // 4. 공지사항 생성
    const insertQuery = `
      INSERT INTO notices (
        title,
        content,
        author,
        is_pinned,
        created_at,
        updated_at,
        created_by,
        updated_by,
        is_active,
        is_deleted,
        view_count
      ) VALUES (?, ?, ?, ?, NOW(), NOW(), ?, ?, 1, 0, 0)
    `;

    connection.query(
      insertQuery,
      [validTitle, validContent, author, validIsPinned, author, author],
      (error, result) => {
        if (error) {
          console.error('[Notice] Error creating notice:', error);
          return res.status(500).json({
            success: false,
            error_code: 'CREATE_ERROR',
            message: 'Failed to create notice'
          });
        }

        // 5. 성공 응답
        res.status(201).json({
          success: true,
          data: {
            id: result.insertId,
            message: 'Notice created successfully'
          }
        });
      }
    );
  } catch (error) {
    console.error('[Notice] Error in createNotice:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: 'An error occurred while processing your request'
    });
  }
};

/**
 * 공지사항 수정
 * PUT /api/notices/:id
 */
const updateNotice = async (req, res) => {
  try {
    // 1. MySQL 연결 확인
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    // 2. 인증 확인
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        error_code: 'AUTH_REQUIRED',
        message: 'Authentication required'
      });
    }

    // 3. 입력 검증
    const noticeId = parseInt(req.params.id);
    if (isNaN(noticeId) || noticeId < 1) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_ID',
        message: 'Invalid notice ID'
      });
    }

    const { title, content, isPinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error_code: 'MISSING_FIELDS',
        message: 'Title and content are required'
      });
    }

    const validTitle = validateInput(title, 'title', 200);
    const validContent = validateInput(content, 'content', 10000);
    const validIsPinned = isPinned === true ? 1 : 0;
    const updatedBy = req.session.userId;

    // 4. 권한 확인 (작성자 또는 관리자만 수정 가능)
    const checkQuery = `
      SELECT author FROM notices WHERE id = ? AND is_deleted = 0
    `;

    connection.query(checkQuery, [noticeId], (checkError, checkResults) => {
      if (checkError) {
        console.error('[Notice] Error checking notice:', checkError);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: 'Failed to verify notice'
        });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({
          success: false,
          error_code: 'NOTICE_NOT_FOUND',
          message: 'Notice not found'
        });
      }

      // TODO: 관리자 권한 체크 추가 필요
      if (checkResults[0].author !== updatedBy) {
        return res.status(403).json({
          success: false,
          error_code: 'ACCESS_DENIED',
          message: 'You do not have permission to update this notice'
        });
      }

      // 5. 공지사항 수정
      const updateQuery = `
        UPDATE notices
        SET title = ?,
            content = ?,
            is_pinned = ?,
            updated_at = NOW(),
            updated_by = ?
        WHERE id = ? AND is_deleted = 0
      `;

      connection.query(
        updateQuery,
        [validTitle, validContent, validIsPinned, updatedBy, noticeId],
        (error) => {
          if (error) {
            console.error('[Notice] Error updating notice:', error);
            return res.status(500).json({
              success: false,
              error_code: 'UPDATE_ERROR',
              message: 'Failed to update notice'
            });
          }

          // 6. 성공 응답
          res.json({
            success: true,
            data: {
              message: 'Notice updated successfully'
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('[Notice] Error in updateNotice:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: 'An error occurred while processing your request'
    });
  }
};

/**
 * 공지사항 삭제 (소프트 삭제)
 * DELETE /api/notices/:id
 */
const deleteNotice = async (req, res) => {
  try {
    // 1. MySQL 연결 확인
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    // 2. 인증 확인
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        error_code: 'AUTH_REQUIRED',
        message: 'Authentication required'
      });
    }

    // 3. 입력 검증
    const noticeId = parseInt(req.params.id);
    if (isNaN(noticeId) || noticeId < 1) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_ID',
        message: 'Invalid notice ID'
      });
    }

    const deletedBy = req.session.userId;

    // 4. 권한 확인
    const checkQuery = `
      SELECT author FROM notices WHERE id = ? AND is_deleted = 0
    `;

    connection.query(checkQuery, [noticeId], (checkError, checkResults) => {
      if (checkError) {
        console.error('[Notice] Error checking notice:', checkError);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: 'Failed to verify notice'
        });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({
          success: false,
          error_code: 'NOTICE_NOT_FOUND',
          message: 'Notice not found'
        });
      }

      // TODO: 관리자 권한 체크 추가 필요
      if (checkResults[0].author !== deletedBy) {
        return res.status(403).json({
          success: false,
          error_code: 'ACCESS_DENIED',
          message: 'You do not have permission to delete this notice'
        });
      }

      // 5. 소프트 삭제 실행
      const deleteQuery = `
        UPDATE notices
        SET is_deleted = 1,
            updated_at = NOW(),
            updated_by = ?
        WHERE id = ?
      `;

      connection.query(deleteQuery, [deletedBy, noticeId], (error) => {
        if (error) {
          console.error('[Notice] Error deleting notice:', error);
          return res.status(500).json({
            success: false,
            error_code: 'DELETE_ERROR',
            message: 'Failed to delete notice'
          });
        }

        // 6. 성공 응답
        res.json({
          success: true,
          data: {
            message: 'Notice deleted successfully'
          }
        });
      });
    });
  } catch (error) {
    console.error('[Notice] Error in deleteNotice:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: 'An error occurred while processing your request'
    });
  }
};

module.exports = {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice
};
