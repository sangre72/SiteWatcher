module.exports = { getMemoryUsageNode };
// CPU 사용률 데이터 생성 및 응답하는 라우트

function getMemoryUsageNode(req, res) {
    const cpuUsages = [];
    const currentTime = new Date(); // 현재 시간

    // 클라이언트로부터 받은 PC ID 리스트를 처리
    // 예시에서는 모든 PC ID에 대한 요청을 가정
    for (let i = 1; i <= 1 ; i++) {
        const pcId = `COMP-HPC-001`; // PC ID (COMP-HPC-001부터 COMP-HPC-100까지)
        const memoryTotal = 256; // CPU 사용률 (0에서 99까지 랜덤)
        const free = Math.floor(Math.random() * 256); // CPU 사용률 (0에서 99까지 랜덤)
        const time = currentTime.getTime(); // 현재 시간의 타임스탬프
        cpuUsages.push({
            node : pcId,
            time: time,
            total: memoryTotal, // X 값으로 현재 시간의 타임스탬프 사용
            free: free // 랜덤 CPU 사용률
        });
    }

    res.json(cpuUsages);
};