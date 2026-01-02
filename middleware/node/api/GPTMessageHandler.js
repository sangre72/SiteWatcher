const axios = require('axios');
const OpenAI = require('openai');

module.exports = { getGPTMessage };

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 클라이언트로부터 입력 받은 텍스트를 GPT 모델을 사용해 처리하는 함수
 *
 * @param {object} req - 클라이언트의 요청 객체
 * @param {object} res - 클라이언트로 보낼 응답 객체
 * @returns {Promise<void>} - 응답 객체에 GPT의 메시지를 담아 반환
 */
async function getGPTMessage(req, res) {
    // 클라이언트로부터 입력 받은 텍스트 (query parameter 'q'를 사용)
    const inputText = req.query.q;
    let qm = req.query.qm;

    // 입력 텍스트가 비어있는지 검사
    if (!inputText || !inputText.trim()) {
        return res.status(400).json({ error: 'Input text is required' });
    }

    // 모델 이름이 제공되지 않으면 기본 모델로 설정
    if (!qm || !qm.trim()) {
        qm = "gpt-3.5-turbo";
    }

    try {
        // OpenAI API를 호출하여 입력 텍스트에 대한 GPT의 응답을 생성
        const chatCompletion = await openai.chat.completions.create({
            messages: [{ role: "user", content: inputText }],
            model: qm,
        });

        // 응답으로부터 GPT의 메시지를 추출하여 클라이언트에 반환
        const gptMessage = chatCompletion.choices[0].message.content;
        res.json({ m: gptMessage });
    } catch (error) {
        console.error('Error when calling OpenAI API:', error);
        res.status(500).json({ error: 'Failed to fetch response from OpenAI' });
    }
}
