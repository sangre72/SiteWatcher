const axios = require('axios');
/*
const { GoogleGenerativeAI } = require("@google/generative-ai");

console.log(process.env.GEMINI_API_KEY);

module.exports = { getGMNMessage };

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
async function getGMNMessage(req, res) {
    // 클라이언트로부터 입력 받은 텍스트 (query parameter 'q'를 사용)
    const inputText = req.query.q;

    // 입력 텍스트가 비어있는지 검사
    if (!inputText || !inputText.trim()) {
        return res.status(400).json({ error: 'Input text is required' });
    }

    try {
        // For text-only input, use the gemini-pro model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = inputText.trim() + ". 한글로 답해";

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const gptMessage = response.text();
        console.log(gptMessage);
        res.json({ m: gptMessage });
    } catch (error) {
        console.error('Error when calling Gemini API:', error);
        res.status(500).json({ error: 'Failed to fetch response from OpenAI' });
    }
}
*/
