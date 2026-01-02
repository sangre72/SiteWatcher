const mysql = require('mysql');

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
      console.warn('[Notice Comment MySQL] Connection failed:', error.message);
      mysqlAvailable = false;
    } else {
      console.log('[Notice Comment MySQL] Successfully connected to the database.');
      mysqlAvailable = true;
    }
  });
} catch (err) {
  console.warn('[Notice Comment MySQL] Failed to create connection:', err.message);
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
  const dangerous = /<script|javascript:|onerror=|onclick=/i;
  if (dangerous.test(input)) {
    throw new Error(`${fieldName} contains invalid characters`);
  }
  return input.trim();
};

/**
 * 댓글 목록 조회
 * GET /api/notices/:noticeId/comments
 */
const getComments = async (req, res) => {
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
    const noticeId = parseInt(req.params.noticeId);
    if (isNaN(noticeId) || noticeId < 1) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_NOTICE_ID',
        message: 'Invalid notice ID'
      });
    }

    // 3. 댓글 조회
    const query = `
      SELECT
        id,
        notice_id,
        content,
        author,
        created_at,
        updated_at
      FROM notice_comments
      WHERE notice_id = ? AND is_deleted = 0
      ORDER BY created_at ASC
    `;

    connection.query(query, [noticeId], (error, results) => {
      if (error) {
        console.error('[Notice Comment] Error fetching comments:', error);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: 'Failed to fetch comments'
        });
      }

      // 4. 성공 응답
      res.json({
        success: true,
        data: {
          comments: results
        }
      });
    });
  } catch (error) {
    console.error('[Notice Comment] Error in getComments:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: 'An error occurred while processing your request'
    });
  }
};

/**
 * 댓글 생성
 * POST /api/notices/:noticeId/comments
 */
const createComment = async (req, res) => {
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
    const noticeId = parseInt(req.params.noticeId);
    if (isNaN(noticeId) || noticeId < 1) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_NOTICE_ID',
        message: 'Invalid notice ID'
      });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({
        success: false,
        error_code: 'MISSING_CONTENT',
        message: 'Comment content is required'
      });
    }

    const validContent = validateInput(content, 'content', 1000);
    const author = req.session.userId;

    // 4. 공지사항 존재 확인
    const checkNoticeQuery = `
      SELECT id FROM notices WHERE id = ? AND is_deleted = 0
    `;

    connection.query(checkNoticeQuery, [noticeId], (checkError, checkResults) => {
      if (checkError) {
        console.error('[Notice Comment] Error checking notice:', checkError);
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

      // 5. 댓글 생성
      const insertQuery = `
        INSERT INTO notice_comments (
          notice_id,
          content,
          author,
          created_at,
          updated_at,
          created_by,
          updated_by,
          is_active,
          is_deleted
        ) VALUES (?, ?, ?, NOW(), NOW(), ?, ?, 1, 0)
      `;

      connection.query(
        insertQuery,
        [noticeId, validContent, author, author, author],
        (error, result) => {
          if (error) {
            console.error('[Notice Comment] Error creating comment:', error);
            return res.status(500).json({
              success: false,
              error_code: 'CREATE_ERROR',
              message: 'Failed to create comment'
            });
          }

          // 6. 성공 응답
          res.status(201).json({
            success: true,
            data: {
              id: result.insertId,
              message: 'Comment created successfully'
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('[Notice Comment] Error in createComment:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: 'An error occurred while processing your request'
    });
  }
};

/**
 * 댓글 수정
 * PUT /api/notices/:noticeId/comments/:commentId
 */
const updateComment = async (req, res) => {
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
    const commentId = parseInt(req.params.commentId);
    if (isNaN(commentId) || commentId < 1) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_COMMENT_ID',
        message: 'Invalid comment ID'
      });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({
        success: false,
        error_code: 'MISSING_CONTENT',
        message: 'Comment content is required'
      });
    }

    const validContent = validateInput(content, 'content', 1000);
    const updatedBy = req.session.userId;

    // 4. 권한 확인
    const checkQuery = `
      SELECT author FROM notice_comments WHERE id = ? AND is_deleted = 0
    `;

    connection.query(checkQuery, [commentId], (checkError, checkResults) => {
      if (checkError) {
        console.error('[Notice Comment] Error checking comment:', checkError);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: 'Failed to verify comment'
        });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({
          success: false,
          error_code: 'COMMENT_NOT_FOUND',
          message: 'Comment not found'
        });
      }

      if (checkResults[0].author !== updatedBy) {
        return res.status(403).json({
          success: false,
          error_code: 'ACCESS_DENIED',
          message: 'You do not have permission to update this comment'
        });
      }

      // 5. 댓글 수정
      const updateQuery = `
        UPDATE notice_comments
        SET content = ?,
            updated_at = NOW(),
            updated_by = ?
        WHERE id = ? AND is_deleted = 0
      `;

      connection.query(updateQuery, [validContent, updatedBy, commentId], (error) => {
        if (error) {
          console.error('[Notice Comment] Error updating comment:', error);
          return res.status(500).json({
            success: false,
            error_code: 'UPDATE_ERROR',
            message: 'Failed to update comment'
          });
        }

        // 6. 성공 응답
        res.json({
          success: true,
          data: {
            message: 'Comment updated successfully'
          }
        });
      });
    });
  } catch (error) {
    console.error('[Notice Comment] Error in updateComment:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: 'An error occurred while processing your request'
    });
  }
};

/**
 * 댓글 삭제
 * DELETE /api/notices/:noticeId/comments/:commentId
 */
const deleteComment = async (req, res) => {
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
    const commentId = parseInt(req.params.commentId);
    if (isNaN(commentId) || commentId < 1) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_COMMENT_ID',
        message: 'Invalid comment ID'
      });
    }

    const deletedBy = req.session.userId;

    // 4. 권한 확인
    const checkQuery = `
      SELECT author FROM notice_comments WHERE id = ? AND is_deleted = 0
    `;

    connection.query(checkQuery, [commentId], (checkError, checkResults) => {
      if (checkError) {
        console.error('[Notice Comment] Error checking comment:', checkError);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: 'Failed to verify comment'
        });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({
          success: false,
          error_code: 'COMMENT_NOT_FOUND',
          message: 'Comment not found'
        });
      }

      if (checkResults[0].author !== deletedBy) {
        return res.status(403).json({
          success: false,
          error_code: 'ACCESS_DENIED',
          message: 'You do not have permission to delete this comment'
        });
      }

      // 5. 소프트 삭제
      const deleteQuery = `
        UPDATE notice_comments
        SET is_deleted = 1,
            updated_at = NOW(),
            updated_by = ?
        WHERE id = ?
      `;

      connection.query(deleteQuery, [deletedBy, commentId], (error) => {
        if (error) {
          console.error('[Notice Comment] Error deleting comment:', error);
          return res.status(500).json({
            success: false,
            error_code: 'DELETE_ERROR',
            message: 'Failed to delete comment'
          });
        }

        // 6. 성공 응답
        res.json({
          success: true,
          data: {
            message: 'Comment deleted successfully'
          }
        });
      });
    });
  } catch (error) {
    console.error('[Notice Comment] Error in deleteComment:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: 'An error occurred while processing your request'
    });
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment
};
