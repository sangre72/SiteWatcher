const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');

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
      console.warn('[Attachment MySQL] Connection failed:', error.message);
      mysqlAvailable = false;
    } else {
      console.log('[Attachment MySQL] Successfully connected to the database.');
      mysqlAvailable = true;
    }
  });
} catch (err) {
  console.warn('[Attachment MySQL] Failed to create connection:', err.message);
}

// 업로드 디렉토리 설정
const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads', 'boards');

// 디렉토리 생성 헬퍼
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 파일명 생성 헬퍼
const generateFileName = (originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}${ext}`;
};

// MIME 타입 매핑
const MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
  zip: 'application/zip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

// Multer 스토리지 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const boardCode = req.params.boardCode || 'default';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uploadDir = path.join(UPLOAD_BASE_DIR, boardCode, String(year), month);
    ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const storedName = generateFileName(file.originalname);
    cb(null, storedName);
  }
});

// Multer 파일 필터
const fileFilter = (req, file, cb) => {
  const board = req.boardSettings;
  if (!board) {
    cb(new Error('게시판 설정을 찾을 수 없습니다.'), false);
    return;
  }

  const allowedTypes = (board.allowed_file_types || 'jpg,jpeg,png,gif,pdf,zip').split(',');
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

  if (!allowedTypes.includes(ext)) {
    cb(new Error(`허용되지 않는 파일 형식입니다. (허용: ${allowedTypes.join(', ')})`), false);
    return;
  }

  cb(null, true);
};

// Multer 인스턴스
const createUploader = (maxFileSize) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSize || 10 * 1024 * 1024 // 기본 10MB
    }
  });
};

/**
 * 게시판 설정 로드 미들웨어
 */
const loadBoardSettings = (req, res, next) => {
  const { boardCode } = req.params;

  if (!mysqlAvailable) {
    return res.status(503).json({
      success: false,
      error_code: 'DATABASE_UNAVAILABLE',
      message: 'Database service is not available'
    });
  }

  const query = `
    SELECT id, board_code, max_file_size, max_file_count, allowed_file_types,
           use_thumbnail, thumbnail_width, thumbnail_height
    FROM boards
    WHERE board_code = ? AND is_active = 1 AND is_deleted = 0
  `;

  connection.query(query, [boardCode], (error, results) => {
    if (error) {
      console.error('[Attachment] Error loading board settings:', error);
      return res.status(500).json({
        success: false,
        error_code: 'QUERY_ERROR',
        message: '게시판 설정 로드 중 오류가 발생했습니다.'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error_code: 'BOARD_NOT_FOUND',
        message: '게시판을 찾을 수 없습니다.'
      });
    }

    req.boardSettings = results[0];
    next();
  });
};

/**
 * 썸네일 생성
 */
const createThumbnail = async (filePath, board) => {
  const ext = path.extname(filePath).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  if (!imageExts.includes(ext)) {
    return null;
  }

  try {
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, ext);
    const thumbnailPath = path.join(dir, `thumb_${baseName}${ext}`);

    await sharp(filePath)
      .resize(board.thumbnail_width || 200, board.thumbnail_height || 200, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(thumbnailPath);

    return thumbnailPath;
  } catch (error) {
    console.error('[Attachment] Error creating thumbnail:', error);
    return null;
  }
};

/**
 * 이미지 크기 조회
 */
const getImageDimensions = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    return { width: metadata.width, height: metadata.height };
  } catch (error) {
    return { width: null, height: null };
  }
};

/**
 * 파일 업로드
 * POST /api/boards/:boardCode/posts/:postId/attachments
 */
const uploadFiles = async (req, res) => {
  const { postId } = req.params;
  const board = req.boardSettings;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error_code: 'NO_FILES',
      message: '업로드할 파일이 없습니다.'
    });
  }

  // 현재 첨부파일 수 확인
  const countQuery = `
    SELECT COUNT(*) as count FROM board_attachments
    WHERE post_id = ? AND is_deleted = 0
  `;

  connection.query(countQuery, [parseInt(postId)], async (countError, countResults) => {
    if (countError) {
      console.error('[Attachment] Error counting attachments:', countError);
      return res.status(500).json({
        success: false,
        error_code: 'QUERY_ERROR',
        message: '첨부파일 확인 중 오류가 발생했습니다.'
      });
    }

    const currentCount = countResults[0].count;
    const maxCount = board.max_file_count || 5;

    if (currentCount + req.files.length > maxCount) {
      // 업로드된 파일 삭제
      req.files.forEach(file => {
        fs.unlink(file.path, () => {});
      });

      return res.status(400).json({
        success: false,
        error_code: 'MAX_FILE_COUNT_EXCEEDED',
        message: `최대 ${maxCount}개의 파일만 업로드할 수 있습니다.`
      });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      try {
        const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);

        let imageWidth = null;
        let imageHeight = null;
        let thumbnailPath = null;

        if (isImage) {
          const dimensions = await getImageDimensions(file.path);
          imageWidth = dimensions.width;
          imageHeight = dimensions.height;

          if (board.use_thumbnail) {
            thumbnailPath = await createThumbnail(file.path, board);
          }
        }

        const relativePath = file.path.replace(UPLOAD_BASE_DIR, '').replace(/\\/g, '/');
        const relativeThumbnailPath = thumbnailPath ? thumbnailPath.replace(UPLOAD_BASE_DIR, '').replace(/\\/g, '/') : null;

        const insertQuery = `
          INSERT INTO board_attachments (
            post_id, original_name, stored_name, file_path, file_size,
            mime_type, file_ext, is_image, image_width, image_height,
            thumbnail_path, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const createdBy = req.session?.userId || 'anonymous';

        await new Promise((resolve, reject) => {
          connection.query(
            insertQuery,
            [
              parseInt(postId),
              file.originalname,
              file.filename,
              relativePath,
              file.size,
              file.mimetype || MIME_TYPES[ext] || 'application/octet-stream',
              ext,
              isImage ? 1 : 0,
              imageWidth,
              imageHeight,
              relativeThumbnailPath,
              createdBy
            ],
            (insertError, result) => {
              if (insertError) {
                reject(insertError);
              } else {
                uploadedFiles.push({
                  id: result.insertId,
                  original_name: file.originalname,
                  stored_name: file.filename,
                  file_path: relativePath,
                  file_size: file.size,
                  mime_type: file.mimetype,
                  file_ext: ext,
                  is_image: isImage,
                  image_width: imageWidth,
                  image_height: imageHeight,
                  thumbnail_path: relativeThumbnailPath
                });
                resolve();
              }
            }
          );
        });

        // 게시글 file_count 업데이트
        const updateQuery = `
          UPDATE board_posts SET file_count = file_count + 1 WHERE id = ?
        `;
        connection.query(updateQuery, [parseInt(postId)], () => {});

      } catch (error) {
        console.error('[Attachment] Error saving file:', error);
        // 파일 삭제
        fs.unlink(file.path, () => {});
      }
    }

    res.status(201).json({
      success: true,
      data: uploadedFiles
    });
  });
};

/**
 * 첨부파일 목록 조회
 * GET /api/boards/:boardCode/posts/:postId/attachments
 */
const getAttachments = async (req, res) => {
  const { postId } = req.params;

  if (!mysqlAvailable) {
    return res.status(503).json({
      success: false,
      error_code: 'DATABASE_UNAVAILABLE',
      message: 'Database service is not available'
    });
  }

  const query = `
    SELECT id, original_name, file_size, file_ext, is_image,
           thumbnail_path, download_count, created_at
    FROM board_attachments
    WHERE post_id = ? AND is_deleted = 0
    ORDER BY id ASC
  `;

  connection.query(query, [parseInt(postId)], (error, results) => {
    if (error) {
      console.error('[Attachment] Error fetching attachments:', error);
      return res.status(500).json({
        success: false,
        error_code: 'QUERY_ERROR',
        message: '첨부파일 조회 중 오류가 발생했습니다.'
      });
    }

    res.json({
      success: true,
      data: results
    });
  });
};

/**
 * 파일 다운로드
 * GET /api/attachments/:attachmentId/download
 */
const downloadFile = async (req, res) => {
  const { attachmentId } = req.params;

  if (!mysqlAvailable) {
    return res.status(503).json({
      success: false,
      error_code: 'DATABASE_UNAVAILABLE',
      message: 'Database service is not available'
    });
  }

  const query = `
    SELECT original_name, stored_name, file_path, mime_type
    FROM board_attachments
    WHERE id = ? AND is_deleted = 0
  `;

  connection.query(query, [parseInt(attachmentId)], (error, results) => {
    if (error) {
      console.error('[Attachment] Error fetching attachment:', error);
      return res.status(500).json({
        success: false,
        error_code: 'QUERY_ERROR',
        message: '파일 조회 중 오류가 발생했습니다.'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error_code: 'FILE_NOT_FOUND',
        message: '파일을 찾을 수 없습니다.'
      });
    }

    const attachment = results[0];
    const filePath = path.join(UPLOAD_BASE_DIR, attachment.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error_code: 'FILE_NOT_FOUND',
        message: '파일이 서버에 존재하지 않습니다.'
      });
    }

    // 다운로드 카운트 증가
    const updateQuery = 'UPDATE board_attachments SET download_count = download_count + 1 WHERE id = ?';
    connection.query(updateQuery, [parseInt(attachmentId)], () => {});

    // 파일 다운로드
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.original_name)}"`);
    res.setHeader('Content-Type', attachment.mime_type || 'application/octet-stream');
    res.sendFile(filePath);
  });
};

/**
 * 파일 삭제
 * DELETE /api/attachments/:attachmentId
 */
const deleteFile = async (req, res) => {
  const { attachmentId } = req.params;

  if (!mysqlAvailable) {
    return res.status(503).json({
      success: false,
      error_code: 'DATABASE_UNAVAILABLE',
      message: 'Database service is not available'
    });
  }

  const query = `
    SELECT id, post_id, file_path, thumbnail_path, created_by
    FROM board_attachments
    WHERE id = ? AND is_deleted = 0
  `;

  connection.query(query, [parseInt(attachmentId)], (error, results) => {
    if (error) {
      console.error('[Attachment] Error fetching attachment:', error);
      return res.status(500).json({
        success: false,
        error_code: 'QUERY_ERROR',
        message: '파일 조회 중 오류가 발생했습니다.'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error_code: 'FILE_NOT_FOUND',
        message: '파일을 찾을 수 없습니다.'
      });
    }

    const attachment = results[0];

    // 권한 확인 (작성자 또는 관리자)
    const isOwner = req.session?.userId === attachment.created_by;
    const isAdmin = req.session?.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error_code: 'PERMISSION_DENIED',
        message: '파일 삭제 권한이 없습니다.'
      });
    }

    // Soft Delete
    const deleteQuery = `
      UPDATE board_attachments SET is_deleted = 1, updated_by = ? WHERE id = ?
    `;

    connection.query(deleteQuery, [req.session?.userId || 'anonymous', parseInt(attachmentId)], (deleteError) => {
      if (deleteError) {
        console.error('[Attachment] Error deleting attachment:', deleteError);
        return res.status(500).json({
          success: false,
          error_code: 'DELETE_ERROR',
          message: '파일 삭제 중 오류가 발생했습니다.'
        });
      }

      // 게시글 file_count 감소
      const updateQuery = `
        UPDATE board_posts SET file_count = GREATEST(file_count - 1, 0) WHERE id = ?
      `;
      connection.query(updateQuery, [attachment.post_id], () => {});

      res.json({
        success: true,
        data: { message: '파일이 삭제되었습니다.' }
      });
    });
  });
};

// Multer 미들웨어
const uploadMiddleware = (req, res, next) => {
  const board = req.boardSettings;
  const uploader = createUploader(board.max_file_size);
  const upload = uploader.array('files', board.max_file_count || 5);

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error_code: 'FILE_TOO_LARGE',
          message: '파일 크기가 허용된 용량을 초과했습니다.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          error_code: 'TOO_MANY_FILES',
          message: '파일 개수가 허용된 수를 초과했습니다.'
        });
      }
      return res.status(400).json({
        success: false,
        error_code: 'UPLOAD_ERROR',
        message: err.message
      });
    }
    if (err) {
      return res.status(400).json({
        success: false,
        error_code: 'UPLOAD_ERROR',
        message: err.message
      });
    }
    next();
  });
};

module.exports = {
  loadBoardSettings,
  uploadMiddleware,
  uploadFiles,
  getAttachments,
  downloadFile,
  deleteFile
};
