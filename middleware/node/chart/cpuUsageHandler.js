module.exports = { getCpuUsageNodes, getCpuUsageNode };
// CPU 사용률 데이터 생성 및 응답하는 라우트
function getCpuUsageNodes(req, res) {
    const cpuUsages = [];
    const currentTime = new Date(); // 현재 시간

    // 클라이언트로부터 받은 PC ID 리스트를 처리
    // 예시에서는 모든 PC ID에 대한 요청을 가정
    for (let i = 1; i <= 10 ; i++) {
        const pcId = `HPC-${i.toString().padStart(3, '0')}`; // PC ID (COMP-HPC-001부터 COMP-HPC-100까지)
        const cpuUsage = Math.floor(Math.random() * 100); // CPU 사용률 (0에서 99까지 랜덤)
        const time = currentTime.getTime(); // 현재 시간의 타임스탬프
        cpuUsages.push({
            node : pcId,
            x: time, // X 값으로 현재 시간의 타임스탬프 사용
            y: cpuUsage // 랜덤 CPU 사용률
        });
    }

    res.json(cpuUsages);
};

function getCpuUsageNode(req, res) {
    const cpuUsages = [];
    const currentTime = new Date(); // 현재 시간

    // 클라이언트로부터 받은 PC ID 리스트를 처리
    // 예시에서는 모든 PC ID에 대한 요청을 가정
    for (let i = 1; i <= 2 ; i++) {
        const pcId = `HPC-${i.toString().padStart(3, '0')}`; // PC ID (COMP-HPC-001부터 COMP-HPC-100까지)
        const cpuUsage = Math.floor(Math.random() * 100); // CPU 사용률 (0에서 99까지 랜덤)
        const time = currentTime.getTime(); // 현재 시간의 타임스탬프
        cpuUsages.push({
            node : pcId,
            x: time, // X 값으로 현재 시간의 타임스탬프 사용
            y: cpuUsage // 랜덤 CPU 사용률
        });
    }

    res.json(cpuUsages);
};