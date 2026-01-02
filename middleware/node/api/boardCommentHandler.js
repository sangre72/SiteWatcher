const mysql = require('mysql2');

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
      console.warn('[BoardComment MySQL] Connection failed:', error.message);
      mysqlAvailable = false;
    } else {
      console.log('[BoardComment MySQL] Successfully connected to the database.');
      mysqlAvailable = true;
    }
  });
} catch (err) {
  console.warn('[BoardComment MySQL] Failed to create connection:', err.message);
}

/**
 * 입력값 검증
 */
const validateInput = (input, fieldName, maxLength = 100) => {
  if (typeof input !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (input.length === 0) {
    throw new Error(`${fieldName} is required`);
  }
  if (input.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
  }
  const dangerous = /<script|javascript:|onerror=|onclick=|--/i;
  if (dangerous.test(input)) {
    throw new Error(`${fieldName} contains invalid characters`);
  }
  return input.trim();
};

/**
 * 권한 확인 헬퍼
 */
const checkPermission = (session, requiredPermission) => {
  if (requiredPermission === 'public') return true;
  if (requiredPermission === 'member' && session.isLoggedIn) return true;
  if (requiredPermission === 'admin' && session.isAdmin) return true;
  if (requiredPermission === 'disabled') return false;
  return false;
};

/**
 * 댓글 목록 조회
 * GET /api/boards/:boardCode/posts/:postId/comments
 */
const getComments = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const { boardCode, postId } = req.params;

    let validBoardCode;
    try {
      validBoardCode = validateInput(boardCode, 'boardCode', 50);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_INPUT',
        message: err.message
      });
    }

    // 게시판 조회 및 권한 확인
    const boardQuery = `
      SELECT b.id, b.comment_permission
      FROM boards b
      WHERE b.board_code = ? AND b.is_active = 1 AND b.is_deleted = 0
    `;

    connection.query(boardQuery, [validBoardCode], (boardError, boardResults) => {
      if (boardError) {
        console.error('[BoardComment] Error fetching board:', boardError);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '게시판 조회 중 오류가 발생했습니다.'
        });
      }

      if (boardResults.length === 0) {
        return res.status(404).json({
          success: false,
          error_code: 'BOARD_NOT_FOUND',
          message: '게시판을 찾을 수 없습니다.'
        });
      }

      const board = boardResults[0];

      // 게시글 존재 확인
      const postQuery = `
        SELECT id, created_by
        FROM board_posts
        WHERE id = ? AND board_id = ? AND is_active = 1 AND is_deleted = 0
      `;

      connection.query(postQuery, [parseInt(postId), board.id], (postError, postResults) => {
        if (postError) {
          console.error('[BoardComment] Error fetching post:', postError);
          return res.status(500).json({
            success: false,
            error_code: 'QUERY_ERROR',
            message: '게시글 조회 중 오류가 발생했습니다.'
          });
        }

        if (postResults.length === 0) {
          return res.status(404).json({
            success: false,
            error_code: 'POST_NOT_FOUND',
            message: '게시글을 찾을 수 없습니다.'
          });
        }

        const post = postResults[0];

        // 댓글 조회
        const commentQuery = `
          SELECT
            id, post_id, parent_id, content, author, is_secret,
            created_at, created_by, updated_at, updated_by
          FROM board_comments
          WHERE post_id = ? AND is_active = 1 AND is_deleted = 0
          ORDER BY
            COALESCE(parent_id, id) ASC,
            CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END ASC,
            id ASC
        `;

        connection.query(commentQuery, [parseInt(postId)], (commentError, comments) => {
          if (commentError) {
            console.error('[BoardComment] Error fetching comments:', commentError);
            return res.status(500).json({
              success: false,
              error_code: 'QUERY_ERROR',
              message: '댓글 조회 중 오류가 발생했습니다.'
            });
          }

          // 비밀 댓글 필터링
          const filteredComments = comments.map(comment => {
            if (comment.is_secret) {
              const isAuthor = req.session.userId === comment.created_by;
              const isPostAuthor = req.session.userId === post.created_by;
              const isAdmin = req.session.isAdmin;

              if (!isAuthor && !isPostAuthor && !isAdmin) {
                return {
                  ...comment,
                  content: '비밀 댓글입니다.',
                  author: '****'
                };
              }
            }
            return comment;
          });

          res.json({
            success: true,
            data: filteredComments
          });
        });
      });
    });
  } catch (error) {
    console.error('[BoardComment] Error in getComments:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '댓글 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 댓글 작성
 * POST /api/boards/:boardCode/posts/:postId/comments
 */
const createComment = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const { boardCode, postId } = req.params;
    const { content, parentId, isSecret } = req.body;

    // 입력 검증
    let validBoardCode, validContent;
    try {
      validBoardCode = validateInput(boardCode, 'boardCode', 50);
      validContent = validateInput(content, 'content', 5000);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_INPUT',
        message: err.message
      });
    }

    // 게시판 조회 및 권한 확인
    const boardQuery = `
      SELECT id, comment_permission
      FROM boards
      WHERE board_code = ? AND is_active = 1 AND is_deleted = 0
    `;

    connection.query(boardQuery, [validBoardCode], (boardError, boardResults) => {
      if (boardError) {
        console.error('[BoardComment] Error fetching board:', boardError);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '게시판 조회 중 오류가 발생했습니다.'
        });
      }

      if (boardResults.length === 0) {
        return res.status(404).json({
          success: false,
          error_code: 'BOARD_NOT_FOUND',
          message: '게시판을 찾을 수 없습니다.'
        });
      }

      const board = boardResults[0];

      // 댓글 권한 확인
      if (!checkPermission(req.session, board.comment_permission)) {
        return res.status(403).json({
          success: false,
          error_code: 'COMMENT_PERMISSION_DENIED',
          message: '댓글 작성 권한이 없습니다.'
        });
      }

      // 게시글 존재 확인
      const postQuery = `
        SELECT id
        FROM board_posts
        WHERE id = ? AND board_id = ? AND is_active = 1 AND is_deleted = 0
      `;

      connection.query(postQuery, [parseInt(postId), board.id], (postError, postResults) => {
        if (postError) {
          console.error('[BoardComment] Error fetching post:', postError);
          return res.status(500).json({
            success: false,
            error_code: 'QUERY_ERROR',
            message: '게시글 조회 중 오류가 발생했습니다.'
          });
        }

        if (postResults.length === 0) {
          return res.status(404).json({
            success: false,
            error_code: 'POST_NOT_FOUND',
            message: '게시글을 찾을 수 없습니다.'
          });
        }

        // 부모 댓글 확인 (대댓글인 경우)
        if (parentId) {
          const parentQuery = `
            SELECT id
            FROM board_comments
            WHERE id = ? AND post_id = ? AND is_active = 1 AND is_deleted = 0
          `;

          connection.query(parentQuery, [parseInt(parentId), parseInt(postId)], (parentError, parentResults) => {
            if (parentError) {
              console.error('[BoardComment] Error fetching parent comment:', parentError);
              return res.status(500).json({
                success: false,
                error_code: 'QUERY_ERROR',
                message: '댓글 작성 중 오류가 발생했습니다.'
              });
            }

            if (parentResults.length === 0) {
              return res.status(404).json({
                success: false,
                error_code: 'PARENT_COMMENT_NOT_FOUND',
                message: '부모 댓글을 찾을 수 없습니다.'
              });
            }

            insertComment();
          });
        } else {
          insertComment();
        }

        function insertComment() {
          const insertQuery = `
            INSERT INTO board_comments (
              post_id, parent_id, content, author, is_secret,
              created_by, updated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

          const author = req.session.userName || req.session.userId || 'anonymous';
          const createdBy = req.session.userId || 'anonymous';

          connection.query(
            insertQuery,
            [
              parseInt(postId),
              parentId ? parseInt(parentId) : null,
              validContent,
              author,
              isSecret ? 1 : 0,
              createdBy,
              createdBy
            ],
            (insertError, result) => {
              if (insertError) {
                console.error('[BoardComment] Error creating comment:', insertError);
                return res.status(500).json({
                  success: false,
                  error_code: 'CREATE_ERROR',
                  message: '댓글 작성 중 오류가 발생했습니다.'
                });
              }

              // 게시글의 댓글 수 증가
              const updateCountQuery = `
                UPDATE board_posts
                SET comment_count = comment_count + 1
                WHERE id = ?
              `;

              connection.query(updateCountQuery, [parseInt(postId)], (updateError) => {
                if (updateError) {
                  console.error('[BoardComment] Error updating comment count:', updateError);
                }
              });

              res.status(201).json({
                success: true,
                data: {
                  id: result.insertId,
                  message: '댓글이 작성되었습니다.'
                }
              });
            }
          );
        }
      });
    });
  } catch (error) {
    console.error('[BoardComment] Error in createComment:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '댓글 작성 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 댓글 수정
 * PUT /api/boards/:boardCode/posts/:postId/comments/:commentId
 */
const updateComment = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const { boardCode, postId, commentId } = req.params;
    const { content } = req.body;

    // 입력 검증
    let validBoardCode, validContent;
    try {
      validBoardCode = validateInput(boardCode, 'boardCode', 50);
      validContent = validateInput(content, 'content', 5000);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_INPUT',
        message: err.message
      });
    }

    // 게시판 조회
    const boardQuery = `
      SELECT id FROM boards
      WHERE board_code = ? AND is_active = 1 AND is_deleted = 0
    `;

    connection.query(boardQuery, [validBoardCode], (boardError, boardResults) => {
      if (boardError) {
        console.error('[BoardComment] Error fetching board:', boardError);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '게시판 조회 중 오류가 발생했습니다.'
        });
      }

      if (boardResults.length === 0) {
        return res.status(404).json({
          success: false,
          error_code: 'BOARD_NOT_FOUND',
          message: '게시판을 찾을 수 없습니다.'
        });
      }

      const board = boardResults[0];

      // 댓글 조회 및 권한 확인
      const commentQuery = `
        SELECT id, created_by
        FROM board_comments
        WHERE id = ? AND post_id = ? AND is_active = 1 AND is_deleted = 0
      `;

      connection.query(commentQuery, [parseInt(commentId), parseInt(postId)], (commentError, commentResults) => {
        if (commentError) {
          console.error('[BoardComment] Error fetching comment:', commentError);
          return res.status(500).json({
            success: false,
            error_code: 'QUERY_ERROR',
            message: '댓글 조회 중 오류가 발생했습니다.'
          });
        }

        if (commentResults.length === 0) {
          return res.status(404).json({
            success: false,
            error_code: 'COMMENT_NOT_FOUND',
            message: '댓글을 찾을 수 없습니다.'
          });
        }

        const comment = commentResults[0];

        // 작성자 또는 관리자만 수정 가능
        const isAuthor = req.session.userId === comment.created_by;
        const isAdmin = req.session.isAdmin;

        if (!isAuthor && !isAdmin) {
          return res.status(403).json({
            success: false,
            error_code: 'UPDATE_PERMISSION_DENIED',
            message: '댓글 수정 권한이 없습니다.'
          });
        }

        // 댓글 수정
        const updateQuery = `
          UPDATE board_comments
          SET content = ?, updated_by = ?
          WHERE id = ?
        `;

        const updatedBy = req.session.userId || 'anonymous';

        connection.query(updateQuery, [validContent, updatedBy, comment.id], (updateError) => {
          if (updateError) {
            console.error('[BoardComment] Error updating comment:', updateError);
            return res.status(500).json({
              success: false,
              error_code: 'UPDATE_ERROR',
              message: '댓글 수정 중 오류가 발생했습니다.'
            });
          }

          res.json({
            success: true,
            data: {
              message: '댓글이 수정되었습니다.'
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('[BoardComment] Error in updateComment:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '댓글 수정 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 댓글 삭제 (Soft Delete)
 * DELETE /api/boards/:boardCode/posts/:postId/comments/:commentId
 */
const deleteComment = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const { boardCode, postId, commentId } = req.params;

    let validBoardCode;
    try {
      validBoardCode = validateInput(boardCode, 'boardCode', 50);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_INPUT',
        message: err.message
      });
    }

    // 게시판 조회
    const boardQuery = `
      SELECT id FROM boards
      WHERE board_code = ? AND is_active = 1 AND is_deleted = 0
    `;

    connection.query(boardQuery, [validBoardCode], (boardError, boardResults) => {
      if (boardError) {
        console.error('[BoardComment] Error fetching board:', boardError);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '게시판 조회 중 오류가 발생했습니다.'
        });
      }

      if (boardResults.length === 0) {
        return res.status(404).json({
          success: false,
          error_code: 'BOARD_NOT_FOUND',
          message: '게시판을 찾을 수 없습니다.'
        });
      }

      // 댓글 조회 및 권한 확인
      const commentQuery = `
        SELECT id, created_by
        FROM board_comments
        WHERE id = ? AND post_id = ? AND is_active = 1 AND is_deleted = 0
      `;

      connection.query(commentQuery, [parseInt(commentId), parseInt(postId)], (commentError, commentResults) => {
        if (commentError) {
          console.error('[BoardComment] Error fetching comment:', commentError);
          return res.status(500).json({
            success: false,
            error_code: 'QUERY_ERROR',
            message: '댓글 조회 중 오류가 발생했습니다.'
          });
        }

        if (commentResults.length === 0) {
          return res.status(404).json({
            success: false,
            error_code: 'COMMENT_NOT_FOUND',
            message: '댓글을 찾을 수 없습니다.'
          });
        }

        const comment = commentResults[0];

        // 작성자 또는 관리자만 삭제 가능
        const isAuthor = req.session.userId === comment.created_by;
        const isAdmin = req.session.isAdmin;

        if (!isAuthor && !isAdmin) {
          return res.status(403).json({
            success: false,
            error_code: 'DELETE_PERMISSION_DENIED',
            message: '댓글 삭제 권한이 없습니다.'
          });
        }

        // Soft Delete
        const deleteQuery = `
          UPDATE board_comments
          SET is_deleted = 1, updated_by = ?
          WHERE id = ?
        `;

        const updatedBy = req.session.userId || 'anonymous';

        connection.query(deleteQuery, [updatedBy, comment.id], (deleteError) => {
          if (deleteError) {
            console.error('[BoardComment] Error deleting comment:', deleteError);
            return res.status(500).json({
              success: false,
              error_code: 'DELETE_ERROR',
              message: '댓글 삭제 중 오류가 발생했습니다.'
            });
          }

          // 게시글의 댓글 수 감소
          const updateCountQuery = `
            UPDATE board_posts
            SET comment_count = comment_count - 1
            WHERE id = ?
          `;

          connection.query(updateCountQuery, [parseInt(postId)], (updateError) => {
            if (updateError) {
              console.error('[BoardComment] Error updating comment count:', updateError);
            }
          });

          res.json({
            success: true,
            data: {
              message: '댓글이 삭제되었습니다.'
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('[BoardComment] Error in deleteComment:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '댓글 삭제 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment
};
