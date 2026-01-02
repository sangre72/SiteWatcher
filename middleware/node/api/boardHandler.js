const mysql = require('mysql2');
const bcrypt = require('bcrypt');

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
      console.warn('[Board MySQL] Connection failed:', error.message);
      mysqlAvailable = false;
    } else {
      console.log('[Board MySQL] Successfully connected to the database.');
      mysqlAvailable = true;
    }
  });
} catch (err) {
  console.warn('[Board MySQL] Failed to create connection:', err.message);
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
  // XSS 및 SQL Injection 방지
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
  return false;
};

/**
 * 게시판 목록 조회
 * GET /api/boards
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
      SELECT
        id, board_code, board_name, description, board_type,
        read_permission, write_permission, comment_permission,
        use_category, use_notice, use_secret, use_attachment, use_like,
        posts_per_page, display_order,
        created_at, updated_at
      FROM boards
      WHERE is_active = 1 AND is_deleted = 0
      ORDER BY display_order ASC, id ASC
    `;

    connection.query(query, (error, results) => {
      if (error) {
        console.error('[Board] Error fetching boards:', error);
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
    console.error('[Board] Error in getBoards:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '게시판 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 게시판 상세 조회
 * GET /api/boards/:boardCode
 */
const getBoardByCode = async (req, res) => {
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

    const query = `
      SELECT
        id, board_code, board_name, description, board_type,
        read_permission, write_permission, comment_permission,
        use_category, use_notice, use_secret, use_attachment, use_like,
        max_file_size, max_file_count, allowed_file_types,
        posts_per_page, display_order,
        created_at, updated_at
      FROM boards
      WHERE board_code = ? AND is_active = 1 AND is_deleted = 0
    `;

    connection.query(query, [validBoardCode], (error, results) => {
      if (error) {
        console.error('[Board] Error fetching board:', error);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '게시판 조회 중 오류가 발생했습니다.'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          error_code: 'BOARD_NOT_FOUND',
          message: '게시판을 찾을 수 없습니다.'
        });
      }

      const board = results[0];

      // 카테고리 조회
      if (board.use_category) {
        const categoryQuery = `
          SELECT id, category_name, category_order
          FROM board_categories
          WHERE board_id = ? AND is_active = 1 AND is_deleted = 0
          ORDER BY category_order ASC
        `;

        connection.query(categoryQuery, [board.id], (catError, categories) => {
          if (catError) {
            console.error('[Board] Error fetching categories:', catError);
            return res.status(500).json({
              success: false,
              error_code: 'QUERY_ERROR',
              message: '게시판 조회 중 오류가 발생했습니다.'
            });
          }

          res.json({
            success: true,
            data: {
              ...board,
              categories
            }
          });
        });
      } else {
        res.json({
          success: true,
          data: board
        });
      }
    });
  } catch (error) {
    console.error('[Board] Error in getBoardByCode:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '게시판 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 게시글 목록 조회
 * GET /api/boards/:boardCode/posts
 */
const getPosts = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const { boardCode } = req.params;
    const { page = 1, limit = 20, categoryId, search } = req.query;

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
      SELECT id, read_permission, posts_per_page
      FROM boards
      WHERE board_code = ? AND is_active = 1 AND is_deleted = 0
    `;

    connection.query(boardQuery, [validBoardCode], (boardError, boardResults) => {
      if (boardError) {
        console.error('[Board] Error fetching board:', boardError);
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

      // 읽기 권한 확인
      if (!checkPermission(req.session, board.read_permission)) {
        return res.status(403).json({
          success: false,
          error_code: 'ACCESS_DENIED',
          message: '게시판 접근 권한이 없습니다.'
        });
      }

      const postsPerPage = parseInt(limit) || board.posts_per_page;
      const offset = (parseInt(page) - 1) * postsPerPage;

      // 게시글 목록 조회 쿼리 빌드
      let postsQuery = `
        SELECT
          p.id, p.title, p.author, p.is_notice, p.is_secret,
          p.view_count, p.like_count, p.comment_count,
          p.created_at, p.updated_at,
          c.category_name
        FROM board_posts p
        LEFT JOIN board_categories c ON p.category_id = c.id
        WHERE p.board_id = ? AND p.is_active = 1 AND p.is_deleted = 0
      `;

      const queryParams = [board.id];

      // 카테고리 필터
      if (categoryId) {
        postsQuery += ' AND p.category_id = ?';
        queryParams.push(parseInt(categoryId));
      }

      // 검색 필터
      if (search) {
        postsQuery += ' AND (p.title LIKE ? OR p.content LIKE ?)';
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern);
      }

      // 공지사항을 먼저, 그 다음 최신순
      postsQuery += ' ORDER BY p.is_notice DESC, p.id DESC LIMIT ? OFFSET ?';
      queryParams.push(postsPerPage, offset);

      connection.query(postsQuery, queryParams, (postsError, posts) => {
        if (postsError) {
          console.error('[Board] Error fetching posts:', postsError);
          return res.status(500).json({
            success: false,
            error_code: 'QUERY_ERROR',
            message: '게시글 조회 중 오류가 발생했습니다.'
          });
        }

        // 전체 게시글 수 조회
        let countQuery = `
          SELECT COUNT(*) as total
          FROM board_posts
          WHERE board_id = ? AND is_active = 1 AND is_deleted = 0
        `;

        const countParams = [board.id];

        if (categoryId) {
          countQuery += ' AND category_id = ?';
          countParams.push(parseInt(categoryId));
        }

        if (search) {
          countQuery += ' AND (title LIKE ? OR content LIKE ?)';
          const searchPattern = `%${search}%`;
          countParams.push(searchPattern, searchPattern);
        }

        connection.query(countQuery, countParams, (countError, countResults) => {
          if (countError) {
            console.error('[Board] Error counting posts:', countError);
            return res.status(500).json({
              success: false,
              error_code: 'QUERY_ERROR',
              message: '게시글 조회 중 오류가 발생했습니다.'
            });
          }

          const total = countResults[0].total;

          res.json({
            success: true,
            data: {
              posts,
              pagination: {
                page: parseInt(page),
                limit: postsPerPage,
                total,
                totalPages: Math.ceil(total / postsPerPage)
              }
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('[Board] Error in getPosts:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '게시글 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 게시글 상세 조회
 * GET /api/boards/:boardCode/posts/:postId
 */
const getPostById = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const { boardCode, postId } = req.params;
    const { secretPassword } = req.query;

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
      SELECT id, read_permission
      FROM boards
      WHERE board_code = ? AND is_active = 1 AND is_deleted = 0
    `;

    connection.query(boardQuery, [validBoardCode], (boardError, boardResults) => {
      if (boardError) {
        console.error('[Board] Error fetching board:', boardError);
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

      // 읽기 권한 확인
      if (!checkPermission(req.session, board.read_permission)) {
        return res.status(403).json({
          success: false,
          error_code: 'ACCESS_DENIED',
          message: '게시판 접근 권한이 없습니다.'
        });
      }

      // 게시글 조회
      const postQuery = `
        SELECT
          p.id, p.board_id, p.category_id, p.title, p.content, p.author,
          p.is_notice, p.is_secret, p.secret_password,
          p.view_count, p.like_count, p.comment_count,
          p.created_at, p.created_by, p.updated_at, p.updated_by,
          c.category_name
        FROM board_posts p
        LEFT JOIN board_categories c ON p.category_id = c.id
        WHERE p.id = ? AND p.board_id = ? AND p.is_active = 1 AND p.is_deleted = 0
      `;

      connection.query(postQuery, [parseInt(postId), board.id], async (postError, postResults) => {
        if (postError) {
          console.error('[Board] Error fetching post:', postError);
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

        // 비밀글 확인
        if (post.is_secret) {
          const isAuthor = req.session.userId === post.created_by;
          const isAdmin = req.session.isAdmin;

          if (!isAuthor && !isAdmin) {
            // 비밀번호 확인
            if (!secretPassword) {
              return res.status(403).json({
                success: false,
                error_code: 'SECRET_POST_PASSWORD_REQUIRED',
                message: '비밀글입니다. 비밀번호를 입력해주세요.'
              });
            }

            try {
              const isPasswordValid = await bcrypt.compare(secretPassword, post.secret_password);
              if (!isPasswordValid) {
                return res.status(403).json({
                  success: false,
                  error_code: 'SECRET_POST_INVALID_PASSWORD',
                  message: '비밀번호가 올바르지 않습니다.'
                });
              }
            } catch (bcryptError) {
              console.error('[Board] Error comparing password:', bcryptError);
              return res.status(500).json({
                success: false,
                error_code: 'INTERNAL_ERROR',
                message: '게시글 조회 중 오류가 발생했습니다.'
              });
            }
          }
        }

        // 조회수 증가
        const updateViewQuery = 'UPDATE board_posts SET view_count = view_count + 1 WHERE id = ?';
        connection.query(updateViewQuery, [post.id], (updateError) => {
          if (updateError) {
            console.error('[Board] Error updating view count:', updateError);
          }
        });

        // 첨부파일 조회
        const attachmentQuery = `
          SELECT id, original_filename, file_size, download_count, created_at
          FROM board_attachments
          WHERE post_id = ? AND is_active = 1 AND is_deleted = 0
        `;

        connection.query(attachmentQuery, [post.id], (attachError, attachments) => {
          if (attachError) {
            console.error('[Board] Error fetching attachments:', attachError);
            return res.status(500).json({
              success: false,
              error_code: 'QUERY_ERROR',
              message: '게시글 조회 중 오류가 발생했습니다.'
            });
          }

          // 비밀번호는 응답에서 제거
          delete post.secret_password;

          res.json({
            success: true,
            data: {
              ...post,
              attachments
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('[Board] Error in getPostById:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '게시글 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 게시글 작성
 * POST /api/boards/:boardCode/posts
 */
const createPost = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const { boardCode } = req.params;
    const { categoryId, title, content, isNotice, isSecret, secretPassword } = req.body;

    // 입력 검증
    let validBoardCode, validTitle, validContent;
    try {
      validBoardCode = validateInput(boardCode, 'boardCode', 50);
      validTitle = validateInput(title, 'title', 500);
      validContent = validateInput(content, 'content', 100000);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_INPUT',
        message: err.message
      });
    }

    // 게시판 조회
    const boardQuery = `
      SELECT id, write_permission, use_secret, use_notice
      FROM boards
      WHERE board_code = ? AND is_active = 1 AND is_deleted = 0
    `;

    connection.query(boardQuery, [validBoardCode], async (boardError, boardResults) => {
      if (boardError) {
        console.error('[Board] Error fetching board:', boardError);
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

      // 쓰기 권한 확인
      if (!checkPermission(req.session, board.write_permission)) {
        return res.status(403).json({
          success: false,
          error_code: 'WRITE_PERMISSION_DENIED',
          message: '게시글 작성 권한이 없습니다.'
        });
      }

      // 비밀글 비밀번호 해시
      let hashedPassword = null;
      if (isSecret && board.use_secret) {
        if (!secretPassword) {
          return res.status(400).json({
            success: false,
            error_code: 'SECRET_PASSWORD_REQUIRED',
            message: '비밀글 비밀번호를 입력해주세요.'
          });
        }
        try {
          hashedPassword = await bcrypt.hash(secretPassword, 10);
        } catch (hashError) {
          console.error('[Board] Error hashing password:', hashError);
          return res.status(500).json({
            success: false,
            error_code: 'INTERNAL_ERROR',
            message: '게시글 작성 중 오류가 발생했습니다.'
          });
        }
      }

      // 공지사항 권한 확인
      const finalIsNotice = (isNotice && board.use_notice && req.session.isAdmin) ? 1 : 0;

      // 게시글 삽입
      const insertQuery = `
        INSERT INTO board_posts (
          board_id, category_id, title, content, author,
          is_notice, is_secret, secret_password,
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const author = req.session.userName || req.session.userId || 'anonymous';
      const createdBy = req.session.userId || 'anonymous';

      connection.query(
        insertQuery,
        [
          board.id,
          categoryId || null,
          validTitle,
          validContent,
          author,
          finalIsNotice,
          isSecret ? 1 : 0,
          hashedPassword,
          createdBy,
          createdBy
        ],
        (insertError, result) => {
          if (insertError) {
            console.error('[Board] Error creating post:', insertError);
            return res.status(500).json({
              success: false,
              error_code: 'CREATE_ERROR',
              message: '게시글 작성 중 오류가 발생했습니다.'
            });
          }

          res.status(201).json({
            success: true,
            data: {
              id: result.insertId,
              message: '게시글이 작성되었습니다.'
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('[Board] Error in createPost:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '게시글 작성 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 게시글 수정
 * PUT /api/boards/:boardCode/posts/:postId
 */
const updatePost = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const { boardCode, postId } = req.params;
    const { categoryId, title, content } = req.body;

    // 입력 검증
    let validBoardCode, validTitle, validContent;
    try {
      validBoardCode = validateInput(boardCode, 'boardCode', 50);
      validTitle = validateInput(title, 'title', 500);
      validContent = validateInput(content, 'content', 100000);
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
        console.error('[Board] Error fetching board:', boardError);
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

      // 게시글 조회 및 권한 확인
      const postQuery = `
        SELECT id, created_by
        FROM board_posts
        WHERE id = ? AND board_id = ? AND is_active = 1 AND is_deleted = 0
      `;

      connection.query(postQuery, [parseInt(postId), board.id], (postError, postResults) => {
        if (postError) {
          console.error('[Board] Error fetching post:', postError);
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

        // 작성자 또는 관리자만 수정 가능
        const isAuthor = req.session.userId === post.created_by;
        const isAdmin = req.session.isAdmin;

        if (!isAuthor && !isAdmin) {
          return res.status(403).json({
            success: false,
            error_code: 'UPDATE_PERMISSION_DENIED',
            message: '게시글 수정 권한이 없습니다.'
          });
        }

        // 게시글 수정
        const updateQuery = `
          UPDATE board_posts
          SET category_id = ?, title = ?, content = ?, updated_by = ?
          WHERE id = ?
        `;

        const updatedBy = req.session.userId || 'anonymous';

        connection.query(
          updateQuery,
          [categoryId || null, validTitle, validContent, updatedBy, post.id],
          (updateError) => {
            if (updateError) {
              console.error('[Board] Error updating post:', updateError);
              return res.status(500).json({
                success: false,
                error_code: 'UPDATE_ERROR',
                message: '게시글 수정 중 오류가 발생했습니다.'
              });
            }

            res.json({
              success: true,
              data: {
                message: '게시글이 수정되었습니다.'
              }
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('[Board] Error in updatePost:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '게시글 수정 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 게시글 삭제 (Soft Delete)
 * DELETE /api/boards/:boardCode/posts/:postId
 */
const deletePost = async (req, res) => {
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

    // 게시판 조회
    const boardQuery = `
      SELECT id FROM boards
      WHERE board_code = ? AND is_active = 1 AND is_deleted = 0
    `;

    connection.query(boardQuery, [validBoardCode], (boardError, boardResults) => {
      if (boardError) {
        console.error('[Board] Error fetching board:', boardError);
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

      // 게시글 조회 및 권한 확인
      const postQuery = `
        SELECT id, created_by
        FROM board_posts
        WHERE id = ? AND board_id = ? AND is_active = 1 AND is_deleted = 0
      `;

      connection.query(postQuery, [parseInt(postId), board.id], (postError, postResults) => {
        if (postError) {
          console.error('[Board] Error fetching post:', postError);
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

        // 작성자 또는 관리자만 삭제 가능
        const isAuthor = req.session.userId === post.created_by;
        const isAdmin = req.session.isAdmin;

        if (!isAuthor && !isAdmin) {
          return res.status(403).json({
            success: false,
            error_code: 'DELETE_PERMISSION_DENIED',
            message: '게시글 삭제 권한이 없습니다.'
          });
        }

        // Soft Delete
        const deleteQuery = `
          UPDATE board_posts
          SET is_deleted = 1, updated_by = ?
          WHERE id = ?
        `;

        const updatedBy = req.session.userId || 'anonymous';

        connection.query(deleteQuery, [updatedBy, post.id], (deleteError) => {
          if (deleteError) {
            console.error('[Board] Error deleting post:', deleteError);
            return res.status(500).json({
              success: false,
              error_code: 'DELETE_ERROR',
              message: '게시글 삭제 중 오류가 발생했습니다.'
            });
          }

          res.json({
            success: true,
            data: {
              message: '게시글이 삭제되었습니다.'
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('[Board] Error in deletePost:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '게시글 삭제 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getBoards,
  getBoardByCode,
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
};
