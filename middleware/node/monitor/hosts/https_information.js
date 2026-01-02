const path = require('path');
const fs = require('fs/promises');  // Node.js의 파일 시스템 프로미스 API 사용

module.exports = { https_information };
async function https_information(req, res) {
    const filePath = path.join(process.cwd(), 'monitor/hosts', 'https.properties');
    console.log(filePath);
    const data = await fs.readFile(filePath, 'utf8');

    const lines = data.split('\n');
    const hosts = lines.map(line => {
        if (line.trim()) {
            const parts = line.split('|');
            if (parts.length >= 5) {
                const [hostname, ip_addr, http_port, https_port, ssh_port, username, password] = parts;
                return { hostname, ip_addr, http_port, https_port, ssh_port, username, password };
            }
        }
        return null;
    }).filter(host => host);
    res.status(200).json({ hosts });

    return {
        props: { hosts },
        revalidate: 10 // Refetch data every 10 seconds (optional)
    };
}