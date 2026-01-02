const OpenAI = require("openai");

module.exports = { createThread, addMessage, runAssistant, checkRunStatus };

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 새로운 스레드를 생성하는 함수
 *
 * @param {object} res - 클라이언트로 보낼 응답 객체
 * @param {string} assistantId - 사용 중인 어시스턴트의 ID
 * @returns {Promise<object>} - 생성된 스레드의 ID를 포함하는 JSON 응답
 */
async function createThread(res, assistantId) {
    try {
        console.log('Creating a new thread... : ' + assistantId);
        const thread = await openai.beta.threads.create();
        console.log(thread);
        return res.json({ threadId: thread.id });
    } catch (error) {
        console.error('Failed to create thread:', error);
        return res.status(500).json({ error: 'Failed to create thread' });
    }
}

/**
 * 스레드에 새로운 메시지를 추가하는 함수
 *
 * @param {string} threadId - 메시지를 추가할 스레드의 ID
 * @param {string} message - 추가할 메시지 내용
 * @returns {Promise<object>} - OpenAI API 응답 객체
 */
async function addMessage(threadId, message) {
    console.log('Adding a new message to thread: ' + threadId);
    const response = await openai.beta.threads.messages.create(
        threadId,
        {
            role: "user",
            content: message
        }
    );
    return response;
}

/**
 * 어시스턴트를 실행하는 함수
 *
 * @param {string} threadId - 어시스턴트를 실행할 스레드의 ID
 * @param {string} assistantId - 실행할 어시스턴트의 ID
 * @returns {Promise<object>} - OpenAI API 응답 객체
 */
async function runAssistant(threadId, assistantId) {
    console.log('Running assistant for thread: ' + threadId);
    const response = await openai.beta.threads.runs.create(
        threadId,
        {
            assistant_id: assistantId
        }
    );
    return response;
}

/**
 * 실행 상태를 확인하는 함수
 *
 * @param {object} res - 클라이언트로 보낼 응답 객체
 * @param {string} threadId - 실행 상태를 확인할 스레드의 ID
 * @param {string} runId - 실행 상태를 확인할 실행의 ID
 */
async function checkRunStatus(res, threadId, runId) {
    try {
        // 상태를 주기적으로 확인하는 내부 함수
        const polling = async () => {
            const runObject = await openai.beta.threads.runs.retrieve(threadId, runId);
            const status = runObject.status;
            console.log('Current status:', status);

            if (status === 'completed') {
                const messagesList = await openai.beta.threads.messages.list(threadId);
                let lastMessageText = "";

                if (messagesList.data && messagesList.data.length > 0) {
                    console.log('Message list:', messagesList.data.length);
                    messagesList.data.map(msg => {
                        const messageText = msg.content[0].text;
                        console.log('Message:', msg.content[0].text);
                        const tokens = messageText.value.split(/\s+/);
                        console.log('Token count:', tokens.length);
                    });
                    const lastMessage = messagesList.data[0].content[0];
                    lastMessageText = lastMessage.text.value;
                }
                res.json({ m: lastMessageText });
            } else if (status === 'failed') {
                console.error('Run failed:', runObject);
                res.status(500).json({ error: 'Run failed' });
            } else {
                // 상태가 완료 또는 실패가 아닌 경우, 다시 체크
                setTimeout(polling, 1000);
            }
        };

        // 최초 호출
        polling();
    } catch (error) {
        console.error('Error checking run status:', error);
        res.status(500).json({ error: 'Failed to check run status' });
    }
}
