const path = require('path');
const fs = require('fs/promises');  // Node.js의 파일 시스템 프로미스 API 사용

module.exports = {
    saveFileContent
};

// 파일명과 내용을 받아 서버에 파일로 저장
async function saveFileContent(req, res) {
    try {
        const { fileName, content } = req.body;  // 클라이언트로부터 파일명과 내용 받기
        //const dirPath = path.join(__dirname, 'uploads');  // 파일을 저장할 디렉토리 경로 설정
        const filePath = path.join(fileName);  // 파일 전체 경로 생성

        // 디렉토리가 존재하지 않을 경우 생성
        // await fs.mkdir(dirPath, { recursive: true });

        await fs.writeFile(filePath, content, 'utf-8');  // 파일 쓰기
        res.json({ message: 'File saved successfully', path: filePath });  // 성공 응답 전송
    } catch (err) {
        console.error('Error saving file:', err);
        res.status(500).json({ error: 'Failed to save file' });
    }
}
