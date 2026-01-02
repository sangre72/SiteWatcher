/**
 * Menu Handler (Public API)
 * 공개 메뉴 조회 API
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
      console.warn('[Menu Public MySQL] Connection failed:', error.message);
      mysqlAvailable = false;
    } else {
      console.log('[Menu Public MySQL] Successfully connected to the database.');
      mysqlAvailable = true;
    }
  });
} catch (err) {
  console.warn('[Menu Public MySQL] Failed to create connection:', err.message);
}

/**
 * 메뉴 트리 조회 (Public)
 * GET /api/menus?type=site|user|admin
 */
const getMenuTree = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const { type } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_INPUT',
        message: 'Menu type is required'
      });
    }

    const query = `
      SELECT *
      FROM menus
      WHERE menu_type = ?
        AND is_active = 1
        AND is_deleted = 0
        AND is_visible = 1
      ORDER BY parent_id, sort_order
    `;

    connection.query(query, [type], (error, results) => {
      if (error) {
        console.error('[Menu Public] Error fetching menu tree:', error);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '메뉴 조회 중 오류가 발생했습니다.'
        });
      }

      res.json({
        success: true,
        data: results
      });
    });
  } catch (error) {
    console.error('[Menu Public] Error in getMenuTree:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '메뉴 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 유틸리티 메뉴 조회
 * GET /api/menus/utility/:utilityType
 */
const getUtilityMenu = async (req, res) => {
  try {
    if (!mysqlAvailable) {
      return res.status(503).json({
        success: false,
        error_code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is not available'
      });
    }

    const { utilityType } = req.params;
    const menuType = `${utilityType}_utility`;

    const query = `
      SELECT *
      FROM menus
      WHERE menu_type = ?
        AND is_active = 1
        AND is_deleted = 0
        AND is_visible = 1
      ORDER BY sort_order
    `;

    connection.query(query, [menuType], (error, results) => {
      if (error) {
        console.error('[Menu Public] Error fetching utility menu:', error);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '메뉴 조회 중 오류가 발생했습니다.'
        });
      }

      res.json({
        success: true,
        data: results
      });
    });
  } catch (error) {
    console.error('[Menu Public] Error in getUtilityMenu:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '메뉴 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 사이트맵 조회
 * GET /api/menus/sitemap
 */
const getSitemap = async (req, res) => {
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
      FROM menus
      WHERE menu_type IN ('site', 'user')
        AND is_active = 1
        AND is_deleted = 0
        AND is_visible = 1
      ORDER BY menu_type, parent_id, sort_order
    `;

    connection.query(query, (error, results) => {
      if (error) {
        console.error('[Menu Public] Error fetching sitemap:', error);
        return res.status(500).json({
          success: false,
          error_code: 'QUERY_ERROR',
          message: '사이트맵 조회 중 오류가 발생했습니다.'
        });
      }

      res.json({
        success: true,
        data: results
      });
    });
  } catch (error) {
    console.error('[Menu Public] Error in getSitemap:', error);
    res.status(500).json({
      success: false,
      error_code: 'INTERNAL_ERROR',
      message: '사이트맵 조회 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getMenuTree,
  getUtilityMenu,
  getSitemap
};
