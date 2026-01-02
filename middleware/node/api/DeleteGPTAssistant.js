const { Configuration, OpenAIApi } = require("openai");
const OpenAI = require("openai");

module.exports = { deleteAssistant };

// API 설정
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 특정 Assistant를 삭제하는 함수
 *
 * 이 함수는 클라이언트로부터 삭제할 Assistant의 이름을 쿼리 파라미터로 받아
 * OpenAI API를 사용하여 해당 Assistant를 삭제합니다.
 *
 * @param {object} req - 클라이언트의 요청 객체
 * @param {object} res - 클라이언트로 보낼 응답 객체
 */
async function deleteAssistant(req, res) {
    try {
        // 쿼리 파라미터로부터 삭제할 Assistant의 이름을 가져옵니다.
        const inputText = req.query.q;

        // OpenAI API를 사용하여 해당 Assistant를 삭제합니다.
        await openai.deleteAssistant(inputText);

        // 성공적으로 삭제되었음을 클라이언트에게 알립니다.
        res.status(200).send({ message: 'Assistant deleted successfully' });
    } catch (error) {
        // 오류 발생 시 오류 메시지를 클라이언트에게 보냅니다.
        res.status(500).send({ error: 'Failed to delete assistant' });
    }
}
