const { Client } = require('ssh2');

module.exports = { sshPing };

const t = 20000; // 20초 타임아웃 설정

async function sshPing(req, res) {
    const timeout = setTimeout(() => {
        res.status(408).send('Request Timeout');
    }, t);

    try {
        const { h: hostname, p: port, u: username, w: password } = req.body;
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        const conn = new Client();

        conn.on('ready', () => {
            //console.log('Client ping:: ready');
            conn.exec('ls -l', (err, stream) => {
                if (err) {
                    clearTimeout(timeout);
                    res.status(500).send('SSH command failed');
                    return;
                }
                let output = '';
                stream.on('data', (data) => {
                    output = "success";
                }).on('close', (code, signal) => {
                    //console.log('ping from "+clientIp+" :: close :: code: ' + code + ', signal: ' + signal);
                    clearTimeout(timeout);
                    conn.end();
                    //console.log("<<<<",output);
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ result:output });
                    //res.send(output); // 클라이언트에게 출력 결과 전송
                }).stderr.on('data', (data) => {
                    console.error('STDERR: ' + data);
                });
            });
        }).on('error', (err) => {
            clearTimeout(timeout);
            //console.error('Connection :: error :: ' + err);
            res.setHeader('Content-Type', 'application/json');
            res.status(500).send('SSH connection error');
        }).connect({
            host: hostname, // 변수명 수정
            port: port,
            username: username,
            password: password
        });
    } catch (err) {
        clearTimeout(timeout);
        //console.error("Error ssh ping : " + hostname + "," + port, err);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).send("Internal Server Error");
    }
}
