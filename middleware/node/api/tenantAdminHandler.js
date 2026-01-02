/**
 * Tenant Admin Handler
 * 테넌트(멀티사이트) 관리 API
 */
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
      console.warn('[TenantAdmin MySQL] Connection failed:', error.message);
      mysqlAvailable = false;
    } else {
      console.log('[TenantAdmin MySQL] Successfully connected to the database.');
      mysqlAvailable = true;
    }
  });
} catch (err) {
  console.warn('[TenantAdmin MySQL] Failed to create connection:', err.message);
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
  // XSS 방지
  const dangerous = /<script|javascript:|onerror=|onclick=|--/i;
  if (dangerous.test(input)) {
    throw new Error(`${fieldName} contains invalid characters`);
  }
  return input.trim();
};

/**
 * 테넌트 코드 형식 검증
 */
const validateTenantCode = (code) => {
  if (!/^[a-z][a-z0-9_-]{2,49}$/.test(code)) {
    throw new Error('테넌트 코드는 영문 소문자로 시작하고, 영문 소문자, 숫자, _, -만 사용 가능합니다 (3-50자)');
  }
  return code;
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
 * tenants 테이블 존재 여부 (캐시)
 */
let tenantsTableExists = null;

/**
 * tenants 테이블 존재 확인
 */
const checkTenantsTable = () => {
  return new Promise((resolve, reject) => {
    // 캐시된 결과가 있으면 반환
    if (tenantsTableExists !== null) {
      return resolve(tenantsTableExists);
    }

    if (!connection) {
      return resolve(false);
    }

    const query = `
      SELECT COUNT(*) as cnt FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants'
    `;

    connection.query(query, (error, results) => {
      if (error) {
        console.error('[TenantAdmin] Table check error:', error);
        return resolve(false);
      }
      tenantsTableExists = results[0]?.cnt > 0;
      resolve(tenantsTableExists);
    });
  });
};

/**
 * 테넌트 목록 조회
 * GET /api/admin/tenants
 */
const getTenants = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    // tenants 테이블 존재 확인
    const tableExists = await checkTenantsTable();
    if (!tableExists) {
      return res.json({
        success: true,
        data: [],
        warning: 'tenants 테이블이 존재하지 않습니다. tenant_schema.sql을 실행하세요.',
        schema_path: 'middleware/node/db/schema/tenant_schema.sql'
      });
    }

    const query = `
      SELECT
        id, tenant_code, tenant_name, domain, subdomain, description,
        logo_url, theme_color, language, timezone,
        admin_email, admin_name,
        is_active, created_at, updated_at
      FROM tenants
      WHERE is_deleted = 0
      ORDER BY id ASC
    `;

    connection.query(query, (error, results) => {
      if (error) {
        console.error('[TenantAdmin] Query error:', error);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '테넌트 목록 조회 중 오류가 발생했습니다.'
        });
      }

      res.json({
        success: true,
        data: results
      });
    });
  } catch (error) {
    console.error('[TenantAdmin] Error:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '서버 오류가 발생했습니다.'
    });
  }
};

/**
 * 테넌트 상세 조회
 * GET /api/admin/tenants/:id
 */
const getTenantById = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    // tenants 테이블 존재 확인
    const tableExists = await checkTenantsTable();
    if (!tableExists) {
      return res.status(400).json({
        success: false,
        error_code: 'TABLE_NOT_EXISTS',
        message: 'tenants 테이블이 존재하지 않습니다. tenant_schema.sql을 실행하세요.',
        schema_path: 'middleware/node/db/schema/tenant_schema.sql'
      });
    }

    const { id } = req.params;
    const tenantId = parseInt(id, 10);

    if (isNaN(tenantId)) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_ID',
        message: '유효하지 않은 테넌트 ID입니다.'
      });
    }

    const query = `
      SELECT
        id, tenant_code, tenant_name, domain, subdomain, description,
        logo_url, theme_color, language, timezone,
        admin_email, admin_name,
        is_active, created_at, updated_at
      FROM tenants
      WHERE id = ? AND is_deleted = 0
    `;

    connection.query(query, [tenantId], (error, results) => {
      if (error) {
        console.error('[TenantAdmin] Query error:', error);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '테넌트 조회 중 오류가 발생했습니다.'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          error_code: 'NOT_FOUND',
          message: '테넌트를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: results[0]
      });
    });
  } catch (error) {
    console.error('[TenantAdmin] Error:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '서버 오류가 발생했습니다.'
    });
  }
};

/**
 * 테넌트 생성
 * POST /api/admin/tenants
 */
const createTenant = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    // tenants 테이블 존재 확인
    const tableExists = await checkTenantsTable();
    if (!tableExists) {
      return res.status(400).json({
        success: false,
        error_code: 'TABLE_NOT_EXISTS',
        message: 'tenants 테이블이 존재하지 않습니다. tenant_schema.sql을 실행하세요.',
        schema_path: 'middleware/node/db/schema/tenant_schema.sql'
      });
    }

    const {
      tenant_code,
      tenant_name,
      domain,
      subdomain,
      description,
      logo_url,
      theme_color,
      language,
      timezone,
      admin_email,
      admin_name
    } = req.body;

    // 필수 값 검증
    const validatedCode = validateTenantCode(validateInput(tenant_code, 'tenant_code', 50));
    const validatedName = validateInput(tenant_name, 'tenant_name', 100);

    // 중복 체크
    const checkQuery = 'SELECT id FROM tenants WHERE tenant_code = ? AND is_deleted = 0';
    connection.query(checkQuery, [validatedCode], (checkError, checkResults) => {
      if (checkError) {
        console.error('[TenantAdmin] Check query error:', checkError);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '중복 확인 중 오류가 발생했습니다.'
        });
      }

      if (checkResults.length > 0) {
        return res.status(409).json({
          success: false,
          error_code: 'DUPLICATE_CODE',
          message: '이미 사용 중인 테넌트 코드입니다.'
        });
      }

      // 생성
      const insertQuery = `
        INSERT INTO tenants (
          tenant_code, tenant_name, domain, subdomain, description,
          logo_url, theme_color, language, timezone,
          admin_email, admin_name,
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const userId = req.session?.userId || 'admin';
      const params = [
        validatedCode,
        validatedName,
        domain || null,
        subdomain || null,
        description || null,
        logo_url || null,
        theme_color || '#1976d2',
        language || 'ko',
        timezone || 'Asia/Seoul',
        admin_email || null,
        admin_name || null,
        userId,
        userId
      ];

      connection.query(insertQuery, params, (insertError, result) => {
        if (insertError) {
          console.error('[TenantAdmin] Insert error:', insertError);
          return res.status(500).json({
            success: false,
            error_code: 'INSERT_ERROR',
            message: '테넌트 생성 중 오류가 발생했습니다.'
          });
        }

        res.status(201).json({
          success: true,
          data: {
            id: result.insertId,
            tenant_code: validatedCode,
            tenant_name: validatedName
          },
          message: '테넌트가 생성되었습니다.'
        });
      });
    });
  } catch (error) {
    console.error('[TenantAdmin] Error:', error);
    res.status(400).json({
      success: false,
      error_code: 'VALIDATION_ERROR',
      message: error.message
    });
  }
};

/**
 * 테넌트 수정
 * PUT /api/admin/tenants/:id
 */
const updateTenant = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    // tenants 테이블 존재 확인
    const tableExists = await checkTenantsTable();
    if (!tableExists) {
      return res.status(400).json({
        success: false,
        error_code: 'TABLE_NOT_EXISTS',
        message: 'tenants 테이블이 존재하지 않습니다. tenant_schema.sql을 실행하세요.',
        schema_path: 'middleware/node/db/schema/tenant_schema.sql'
      });
    }

    const { id } = req.params;
    const tenantId = parseInt(id, 10);

    if (isNaN(tenantId)) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_ID',
        message: '유효하지 않은 테넌트 ID입니다.'
      });
    }

    const {
      tenant_name,
      domain,
      subdomain,
      description,
      logo_url,
      theme_color,
      language,
      timezone,
      admin_email,
      admin_name,
      is_active
    } = req.body;

    // 필수 값 검증
    const validatedName = validateInput(tenant_name, 'tenant_name', 100);

    const updateQuery = `
      UPDATE tenants SET
        tenant_name = ?,
        domain = ?,
        subdomain = ?,
        description = ?,
        logo_url = ?,
        theme_color = ?,
        language = ?,
        timezone = ?,
        admin_email = ?,
        admin_name = ?,
        is_active = ?,
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_deleted = 0
    `;

    const userId = req.session?.userId || 'admin';
    const params = [
      validatedName,
      domain || null,
      subdomain || null,
      description || null,
      logo_url || null,
      theme_color || '#1976d2',
      language || 'ko',
      timezone || 'Asia/Seoul',
      admin_email || null,
      admin_name || null,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      userId,
      tenantId
    ];

    connection.query(updateQuery, params, (error, result) => {
      if (error) {
        console.error('[TenantAdmin] Update error:', error);
        return res.status(500).json({
          success: false,
          error_code: 'UPDATE_ERROR',
          message: '테넌트 수정 중 오류가 발생했습니다.'
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error_code: 'NOT_FOUND',
          message: '테넌트를 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        message: '테넌트가 수정되었습니다.'
      });
    });
  } catch (error) {
    console.error('[TenantAdmin] Error:', error);
    res.status(400).json({
      success: false,
      error_code: 'VALIDATION_ERROR',
      message: error.message
    });
  }
};

/**
 * 테넌트 삭제 (Soft Delete)
 * DELETE /api/admin/tenants/:id
 */
const deleteTenant = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    // tenants 테이블 존재 확인
    const tableExists = await checkTenantsTable();
    if (!tableExists) {
      return res.status(400).json({
        success: false,
        error_code: 'TABLE_NOT_EXISTS',
        message: 'tenants 테이블이 존재하지 않습니다. tenant_schema.sql을 실행하세요.',
        schema_path: 'middleware/node/db/schema/tenant_schema.sql'
      });
    }

    const { id } = req.params;
    const tenantId = parseInt(id, 10);

    if (isNaN(tenantId)) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_ID',
        message: '유효하지 않은 테넌트 ID입니다.'
      });
    }

    // default 테넌트는 삭제 불가
    const checkDefaultQuery = 'SELECT tenant_code FROM tenants WHERE id = ?';
    connection.query(checkDefaultQuery, [tenantId], (checkError, checkResults) => {
      if (checkError) {
        console.error('[TenantAdmin] Check query error:', checkError);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '조회 중 오류가 발생했습니다.'
        });
      }

      if (checkResults.length > 0 && checkResults[0].tenant_code === 'default') {
        return res.status(403).json({
          success: false,
          error_code: 'CANNOT_DELETE_DEFAULT',
          message: '기본 테넌트는 삭제할 수 없습니다.'
        });
      }

      const userId = req.session?.userId || 'admin';
      const deleteQuery = `
        UPDATE tenants SET
          is_deleted = 1,
          is_active = 0,
          updated_by = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_deleted = 0
      `;

      connection.query(deleteQuery, [userId, tenantId], (error, result) => {
        if (error) {
          console.error('[TenantAdmin] Delete error:', error);
          return res.status(500).json({
            success: false,
            error_code: 'DELETE_ERROR',
            message: '테넌트 삭제 중 오류가 발생했습니다.'
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            error_code: 'NOT_FOUND',
            message: '테넌트를 찾을 수 없습니다.'
          });
        }

        res.json({
          success: true,
          message: '테넌트가 삭제되었습니다.'
        });
      });
    });
  } catch (error) {
    console.error('[TenantAdmin] Error:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '서버 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  requireAdmin,
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant
};
