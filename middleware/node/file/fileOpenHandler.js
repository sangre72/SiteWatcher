const path = require('path');
const fs = require('fs/promises');  // Node.js의 파일 시스템 프로미스 API 사용

module.exports = {
    getFileContent
};

// 파일 경로와 파일명을 조합하여 해당 파일의 내용을 UTF-8 형식으로 읽고 반환
async function getFileContent(req, res) {
    try {
        const filePath = req.query.p;  // 'p' 파라미터로 전달된 파일 경로
        const fullFilePath = path.join(filePath);  // 전체 파일 경로 생성

        const fileContent = await fs.readFile(fullFilePath, 'utf-8');  // 파일 읽기, UTF-8로 디코딩
        console.log(fileContent);
        res.json(fileContent);  // 읽은 내용을 응답으로 전송
    } catch (err) {
        console.error('Error opening file:', err);
        res.status(500).json({ error: 'Failed to read file' });
    }
}
