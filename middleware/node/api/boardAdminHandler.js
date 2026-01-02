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
      console.warn('[BoardAdmin MySQL] Connection failed:', error.message);
      mysqlAvailable = false;
    } else {
      console.log('[BoardAdmin MySQL] Successfully connected to the database.');
      mysqlAvailable = true;
    }
  });
} catch (err) {
  console.warn('[BoardAdmin MySQL] Failed to create connection:', err.message);
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
 * 관리자 권한 확인 미들웨어
 */
const requireAdmin = (req, res, next) => {
  if (!req.session?.isAdmin) {
    return res.status(403).json({
      success: false,
      error_code: 'ADMIN_REQUIRED',
      message: '관리자 권한이 필요합니다.'
    });
  }
  next();
};

/**
 * 게시판 목록 조회 (관리자용 - 모든 게시판)
 * GET /api/admin/boards
 */
const getBoards = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const query = `
      SELECT *
      FROM boards
      WHERE is_deleted = 0
      ORDER BY display_order ASC, id ASC
    `;

    connection.query(query, (error, results) => {
      if (error) {
        console.error('[BoardAdmin] Error fetching boards:', error);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '게시판 목록 조회 중 오류가 발생했습니다.'
        });
      }

      res.json({
        success: true,
        data: results
      });
    });
  } catch (error) {
    console.error('[BoardAdmin] Error in getBoards:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '게시판 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 게시판 생성
 * POST /api/admin/boards
 */
const createBoard = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const {
      board_code,
      board_name,
      description,
      board_type = 'free',
      read_permission = 'public',
      write_permission = 'member',
      comment_permission = 'member',
      list_view_type = 'list',
      posts_per_page = 20,
      gallery_cols = 4,
      use_category = false,
      use_notice = true,
      use_secret = false,
      use_attachment = true,
      use_like = true,
      use_comment = true,
      use_thumbnail = false,
      use_top_fixed = true,
      use_display_period = false,
      max_file_size = 10485760,
      max_file_count = 5,
      allowed_file_types = 'jpg,jpeg,png,gif,pdf,zip,doc,docx,xls,xlsx,ppt,pptx',
      thumbnail_width = 200,
      thumbnail_height = 200,
      display_order = 0
    } = req.body;

    // 입력 검증
    let validCode, validName;
    try {
      validCode = validateInput(board_code, 'board_code', 50);
      validName = validateInput(board_name, 'board_name', 100);

      // board_code 형식 검증 (영문, 숫자, 언더스코어만 허용)
      if (!/^[a-z0-9_]+$/.test(validCode)) {
        throw new Error('게시판 코드는 영문 소문자, 숫자, 언더스코어만 사용할 수 있습니다.');
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_INPUT',
        message: err.message
      });
    }

    // 중복 체크
    const checkQuery = 'SELECT id FROM boards WHERE board_code = ? AND is_deleted = 0';
    connection.query(checkQuery, [validCode], (checkError, checkResults) => {
      if (checkError) {
        console.error('[BoardAdmin] Error checking board:', checkError);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '게시판 확인 중 오류가 발생했습니다.'
        });
      }

      if (checkResults.length > 0) {
        return res.status(409).json({
          success: false,
          error_code: 'DUPLICATE_BOARD_CODE',
          message: '이미 존재하는 게시판 코드입니다.'
        });
      }

      const insertQuery = `
        INSERT INTO boards (
          board_code, board_name, description, board_type,
          read_permission, write_permission, comment_permission,
          list_view_type, posts_per_page, gallery_cols,
          use_category, use_notice, use_secret, use_attachment, use_like, use_comment,
          use_thumbnail, use_top_fixed, use_display_period,
          max_file_size, max_file_count, allowed_file_types,
          thumbnail_width, thumbnail_height,
          display_order, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const createdBy = req.session?.userId || 'admin';

      connection.query(
        insertQuery,
        [
          validCode, validName, description || null, board_type,
          read_permission, write_permission, comment_permission,
          list_view_type, parseInt(posts_per_page), parseInt(gallery_cols),
          use_category ? 1 : 0, use_notice ? 1 : 0, use_secret ? 1 : 0,
          use_attachment ? 1 : 0, use_like ? 1 : 0, use_comment ? 1 : 0,
          use_thumbnail ? 1 : 0, use_top_fixed ? 1 : 0, use_display_period ? 1 : 0,
          parseInt(max_file_size), parseInt(max_file_count), allowed_file_types,
          parseInt(thumbnail_width), parseInt(thumbnail_height),
          parseInt(display_order), createdBy, createdBy
        ],
        (insertError, result) => {
          if (insertError) {
            console.error('[BoardAdmin] Error creating board:', insertError);
            return res.status(500).json({
              success: false,
              error_code: 'CREATE_ERROR',
              message: '게시판 생성 중 오류가 발생했습니다.'
            });
          }

          res.status(201).json({
            success: true,
            data: {
              id: result.insertId,
              board_code: validCode,
              message: '게시판이 생성되었습니다.'
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('[BoardAdmin] Error in createBoard:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '게시판 생성 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 게시판 수정
 * PUT /api/admin/boards/:boardCode
 */
const updateBoard = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const { boardCode } = req.params;
    const updates = req.body;

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

    // 게시판 존재 확인
    const checkQuery = 'SELECT id FROM boards WHERE board_code = ? AND is_deleted = 0';
    connection.query(checkQuery, [validBoardCode], (checkError, checkResults) => {
      if (checkError) {
        console.error('[BoardAdmin] Error checking board:', checkError);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '게시판 확인 중 오류가 발생했습니다.'
        });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({
          success: false,
          error_code: 'BOARD_NOT_FOUND',
          message: '게시판을 찾을 수 없습니다.'
        });
      }

      // 수정 가능한 필드 목록
      const allowedFields = [
        'board_name', 'description', 'board_type',
        'read_permission', 'write_permission', 'comment_permission',
        'list_view_type', 'posts_per_page', 'gallery_cols',
        'use_category', 'use_notice', 'use_secret', 'use_attachment',
        'use_like', 'use_comment', 'use_thumbnail', 'use_top_fixed', 'use_display_period',
        'max_file_size', 'max_file_count', 'allowed_file_types',
        'thumbnail_width', 'thumbnail_height',
        'display_order', 'is_active'
      ];

      const setClauses = [];
      const values = [];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          setClauses.push(`${field} = ?`);
          // Boolean 필드 처리
          if (field.startsWith('use_') || field === 'is_active') {
            values.push(updates[field] ? 1 : 0);
          } else {
            values.push(updates[field]);
          }
        }
      }

      if (setClauses.length === 0) {
        return res.status(400).json({
          success: false,
          error_code: 'NO_UPDATES',
          message: '수정할 항목이 없습니다.'
        });
      }

      setClauses.push('updated_by = ?');
      values.push(req.session?.userId || 'admin');
      values.push(validBoardCode);

      const updateQuery = `
        UPDATE boards SET ${setClauses.join(', ')} WHERE board_code = ?
      `;

      connection.query(updateQuery, values, (updateError) => {
        if (updateError) {
          console.error('[BoardAdmin] Error updating board:', updateError);
          return res.status(500).json({
            success: false,
            error_code: 'UPDATE_ERROR',
            message: '게시판 수정 중 오류가 발생했습니다.'
          });
        }

        res.json({
          success: true,
          data: { message: '게시판이 수정되었습니다.' }
        });
      });
    });
  } catch (error) {
    console.error('[BoardAdmin] Error in updateBoard:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '게시판 수정 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 게시판 삭제 (Soft Delete)
 * DELETE /api/admin/boards/:boardCode
 */
const deleteBoard = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const { boardCode } = req.params;

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

    const deleteQuery = `
      UPDATE boards SET is_deleted = 1, updated_by = ? WHERE board_code = ? AND is_deleted = 0
    `;

    connection.query(deleteQuery, [req.session?.userId || 'admin', validBoardCode], (error, result) => {
      if (error) {
        console.error('[BoardAdmin] Error deleting board:', error);
        return res.status(500).json({
          success: false,
          error_code: 'DELETE_ERROR',
          message: '게시판 삭제 중 오류가 발생했습니다.'
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error_code: 'BOARD_NOT_FOUND',
          message: '게시판을 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: { message: '게시판이 삭제되었습니다.' }
      });
    });
  } catch (error) {
    console.error('[BoardAdmin] Error in deleteBoard:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '게시판 삭제 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 카테고리 추가
 * POST /api/admin/boards/:boardCode/categories
 */
const addCategory = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const { boardCode } = req.params;
    const { category_name, display_order = 0 } = req.body;

    let validBoardCode, validCategoryName;
    try {
      validBoardCode = validateInput(boardCode, 'boardCode', 50);
      validCategoryName = validateInput(category_name, 'category_name', 100);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_INPUT',
        message: err.message
      });
    }

    // 게시판 ID 조회
    const boardQuery = 'SELECT id FROM boards WHERE board_code = ? AND is_deleted = 0';
    connection.query(boardQuery, [validBoardCode], (boardError, boardResults) => {
      if (boardError) {
        console.error('[BoardAdmin] Error fetching board:', boardError);
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

      const boardId = boardResults[0].id;

      const insertQuery = `
        INSERT INTO board_categories (board_id, category_name, display_order)
        VALUES (?, ?, ?)
      `;

      connection.query(insertQuery, [boardId, validCategoryName, parseInt(display_order)], (insertError, result) => {
        if (insertError) {
          console.error('[BoardAdmin] Error creating category:', insertError);
          return res.status(500).json({
            success: false,
            error_code: 'CREATE_ERROR',
            message: '카테고리 생성 중 오류가 발생했습니다.'
          });
        }

        res.status(201).json({
          success: true,
          data: {
            id: result.insertId,
            category_name: validCategoryName,
            message: '카테고리가 추가되었습니다.'
          }
        });
      });
    });
  } catch (error) {
    console.error('[BoardAdmin] Error in addCategory:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '카테고리 추가 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 카테고리 목록 조회
 * GET /api/admin/boards/:boardCode/categories
 */
const getCategories = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const { boardCode } = req.params;

    const query = `
      SELECT c.id, c.category_name, c.display_order, c.is_active
      FROM board_categories c
      JOIN boards b ON c.board_id = b.id
      WHERE b.board_code = ? AND b.is_deleted = 0 AND c.is_deleted = 0
      ORDER BY c.display_order ASC, c.id ASC
    `;

    connection.query(query, [boardCode], (error, results) => {
      if (error) {
        console.error('[BoardAdmin] Error fetching categories:', error);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '카테고리 조회 중 오류가 발생했습니다.'
        });
      }

      res.json({
        success: true,
        data: results
      });
    });
  } catch (error) {
    console.error('[BoardAdmin] Error in getCategories:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '카테고리 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 카테고리 삭제
 * DELETE /api/admin/boards/:boardCode/categories/:categoryId
 */
const deleteCategory = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const { categoryId } = req.params;

    const deleteQuery = `
      UPDATE board_categories SET is_deleted = 1 WHERE id = ?
    `;

    connection.query(deleteQuery, [parseInt(categoryId)], (error, result) => {
      if (error) {
        console.error('[BoardAdmin] Error deleting category:', error);
        return res.status(500).json({
          success: false,
          error_code: 'DELETE_ERROR',
          message: '카테고리 삭제 중 오류가 발생했습니다.'
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error_code: 'CATEGORY_NOT_FOUND',
          message: '카테고리를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: { message: '카테고리가 삭제되었습니다.' }
      });
    });
  } catch (error) {
    console.error('[BoardAdmin] Error in deleteCategory:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '카테고리 삭제 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  requireAdmin,
  getBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  addCategory,
  getCategories,
  deleteCategory
};
