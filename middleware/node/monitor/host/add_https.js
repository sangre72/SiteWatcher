const path = require('path');
const fs = require('fs/promises');

module.exports = { addOrUpdateHttpInfo };

async function addOrUpdateHttpInfo(req, res) {
    const filePath = path.join(process.cwd(), 'monitor/hosts', 'https.properties');

    try {
        const { hosts } = req.body;

        console.log(req.body);

        // 기존 파일의 내용을 읽어옴
        let fileContent = '';
        try {
            fileContent = await fs.readFile(filePath, 'utf8');
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }

        // 호스트 정보를 라인 단위로 분리
        let lines = fileContent.split('\n').filter(line => line.trim() !== '');
        const hostMap = new Map(lines.map(line => {
            const [hostname, ...rest] = line.split('|');
            return [hostname, line];
        }));

        // 배열로 수신된 호스트 정보를 처리
        hosts.forEach(host => {
            console.log(host);
            const newHostLine = `${host.hostname}|${host.ip_addr}|${host.jmx_port}|${host.ssh_port}|${host.database_port}|${host.username}|${host.password}`;
            hostMap.set(host.hostname, newHostLine);
        });

        // 수정된 내용을 파일에 저장
        const newFileContent = Array.from(hostMap.values()).join('\n');
        await fs.writeFile(filePath, newFileContent);
        console.log(newFileContent);

        res.status(200).json({ result: 'success' });
    } catch (err) {
        console.error('Error adding/updating host information:', err);
        res.status(500).json({ result: 'fail', details: err.message });
    }
}
