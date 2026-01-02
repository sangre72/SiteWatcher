const multer = require('multer');

// 파일 저장을 위한 Multer 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')  // 파일이 저장될 경로
    },
    filename: function (req, file, cb) {
        // 파일 이름 설정
        const f = file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.').pop();
        cb(null, f)
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
