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
      console.warn('[Auth MySQL] Connection failed:', error.message);
      mysqlAvailable = false;
    } else {
      console.log('[Auth MySQL] Successfully connected to the database.');
      mysqlAvailable = true;
    }
  });
} catch (err) {
  console.warn('[Auth MySQL] Failed to create connection:', err.message);
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
  // SQL Injection 및 XSS 방지를 위한 기본 검증
  const dangerous = /<script|javascript:|onerror=|onclick=|--/i;
  if (dangerous.test(input)) {
    throw new Error(`${fieldName} contains invalid characters`);
  }
  return input.trim();
};

/**
 * 로그인
 * POST /api/auth/login
 */
const login = async (req, res) => {
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
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        error_code: 'MISSING_FIELDS',
        message: '아이디와 비밀번호를 입력해주세요.'
      });
    }

    let validUserId;
    try {
      validUserId = validateInput(userId, 'userId', 50);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_INPUT',
        message: err.message
      });
    }

    // 3. 사용자 조회
    const query = `
      SELECT id, user_id, password, user_name, email, role, is_active
      FROM users
      WHERE user_id = ? AND is_deleted = 0
    `;

    connection.query(query, [validUserId], async (error, results) => {
      if (error) {
        console.error('[Auth] Error querying user:', error);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '로그인 처리 중 오류가 발생했습니다.'
        });
      }

      // 4. 사용자 존재 여부 확인
      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          error_code: 'AUTH_FAILED',
          message: '아이디 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      const user = results[0];

      // 5. 계정 활성화 상태 확인
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error_code: 'ACCOUNT_DISABLED',
          message: '비활성화된 계정입니다. 관리자에게 문의하세요.'
        });
      }

      // 6. 비밀번호 검증
      try {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            error_code: 'AUTH_FAILED',
            message: '아이디 또는 비밀번호가 올바르지 않습니다.'
          });
        }
      } catch (bcryptError) {
        console.error('[Auth] Error comparing password:', bcryptError);
        return res.status(500).json({
          success: false,
          error_code: 'INTERNAL_ERROR',
          message: '로그인 처리 중 오류가 발생했습니다.'
        });
      }

      // 7. 마지막 로그인 시간 업데이트
      const updateQuery = 'UPDATE users SET last_login_at = NOW() WHERE id = ?';
      connection.query(updateQuery, [user.id], (updateError) => {
        if (updateError) {
          console.error('[Auth] Error updating last login:', updateError);
        }
      });

      // 8. 세션에 사용자 정보 저장
      req.session.userId = user.user_id;
      req.session.userName = user.user_name;
      req.session.userEmail = user.email;
      req.session.userRole = user.role;
      req.session.isAdmin = user.role === 'admin';
      req.session.isLoggedIn = true;

      // 9. 성공 응답 (비밀번호 제외)
      res.json({
        success: true,
        data: {
          userId: user.user_id,
          userName: user.user_name,
          email: user.email,
          role: user.role,
          isAdmin: user.role === 'admin'
        }
      });
    });
  } catch (error) {
    console.error('[Auth] Error in login:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '로그인 처리 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 로그아웃
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('[Auth] Error destroying session:', err);
        return res.status(500).json({
          success: false,
          error_code: 'LOGOUT_ERROR',
          message: '로그아웃 처리 중 오류가 발생했습니다.'
        });
      }

      res.clearCookie('JSESSIONID');
      res.json({
        success: true,
        data: {
          message: '로그아웃되었습니다.'
        }
      });
    });
  } catch (error) {
    console.error('[Auth] Error in logout:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '로그아웃 처리 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 현재 사용자 정보 조회
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    if (!req.session || !req.session.isLoggedIn) {
      return res.status(401).json({
        success: false,
        error_code: 'NOT_LOGGED_IN',
        message: '로그인이 필요합니다.'
      });
    }

    res.json({
      success: true,
      data: {
        userId: req.session.userId,
        userName: req.session.userName,
        email: req.session.userEmail,
        role: req.session.userRole,
        isAdmin: req.session.isAdmin
      }
    });
  } catch (error) {
    console.error('[Auth] Error in getCurrentUser:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '사용자 정보 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 회원가입
 * POST /api/auth/register
 */
const register = async (req, res) => {
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
    const { userId, password, userName, email } = req.body;

    if (!userId || !password || !userName) {
      return res.status(400).json({
        success: false,
        error_code: 'MISSING_FIELDS',
        message: '필수 항목을 모두 입력해주세요.'
      });
    }

    let validUserId, validUserName, validEmail;
    try {
      validUserId = validateInput(userId, 'userId', 50);
      validUserName = validateInput(userName, 'userName', 100);
      if (email) {
        validEmail = validateInput(email, 'email', 255);
        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(validEmail)) {
          throw new Error('올바른 이메일 형식이 아닙니다.');
        }
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_INPUT',
        message: err.message
      });
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error_code: 'WEAK_PASSWORD',
        message: '비밀번호는 최소 6자 이상이어야 합니다.'
      });
    }

    // 3. 사용자 ID 중복 확인
    const checkQuery = 'SELECT id FROM users WHERE user_id = ? AND is_deleted = 0';

    connection.query(checkQuery, [validUserId], async (checkError, checkResults) => {
      if (checkError) {
        console.error('[Auth] Error checking user:', checkError);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '회원가입 처리 중 오류가 발생했습니다.'
        });
      }

      if (checkResults.length > 0) {
        return res.status(409).json({
          success: false,
          error_code: 'USER_EXISTS',
          message: '이미 사용 중인 아이디입니다.'
        });
      }

      // 4. 비밀번호 해시
      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(password, 10);
      } catch (hashError) {
        console.error('[Auth] Error hashing password:', hashError);
        return res.status(500).json({
          success: false,
          error_code: 'INTERNAL_ERROR',
          message: '회원가입 처리 중 오류가 발생했습니다.'
        });
      }

      // 5. 사용자 생성
      const insertQuery = `
        INSERT INTO users (user_id, password, user_name, email, role, created_by)
        VALUES (?, ?, ?, ?, 'member', 'self')
      `;

      connection.query(
        insertQuery,
        [validUserId, hashedPassword, validUserName, validEmail || null],
        (insertError, result) => {
          if (insertError) {
            console.error('[Auth] Error inserting user:', insertError);
            return res.status(500).json({
              success: false,
              error_code: 'CREATE_ERROR',
              message: '회원가입 처리 중 오류가 발생했습니다.'
            });
          }

          // 6. 성공 응답
          res.status(201).json({
            success: true,
            data: {
              message: '회원가입이 완료되었습니다. 로그인해주세요.'
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('[Auth] Error in register:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '회원가입 처리 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser,
  register
};
