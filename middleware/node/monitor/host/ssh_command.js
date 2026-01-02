const { Client } = require('ssh2');

module.exports = { ssh_command };

const t = 20000; // 20초 타임아웃 설정

async function ssh_command(req, res) {
    const timeout = setTimeout(() => {
        res.status(408).send('Request Timeout');
    }, t);

    try {
        const { h: hostname, p: port, u: username, w: password, q: command } = req.body;
        let cmd = '';
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        const conn = new Client();

        if(command.trim().toLowerCase().startsWith("cd ")){
            cmd = command +"; pwd";
        }else{
            cmd = command;
        }

        conn.on('ready', () => {
            conn.exec(cmd, (err, stream) => {
                if (err) {
                    clearTimeout(timeout);
                    res.status(500).send('SSH command failed');
                    return;
                }
                let output = '';
                stream.on('data', (data) => {
                    output += data.toString();
                }).on('close', (code, signal) => {
                    clearTimeout(timeout);
                    conn.end();
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ result: output });
                }).stderr.on('data', (data) => {
                    console.error('STDERR: ' + data);
                });
            });
        }).on('error', (err) => {
            clearTimeout(timeout);
            res.setHeader('Content-Type', 'application/json');
            res.status(500).send('SSH connection error');
        }).connect({
            host: hostname,
            port: port,
            username: username,
            password: password
        });
    } catch (err) {
        clearTimeout(timeout);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).send("Internal Server Error");
    }
}