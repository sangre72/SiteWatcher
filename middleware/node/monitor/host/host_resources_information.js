const {Client} = require("ssh2");

module.exports = { get_host_resources_information, get_host_resources_information_os };

const t = 20000; // 20초 타임아웃 설정


async function get_host_resources_information_os(req, res) {
    const timeout = setTimeout(() => {
        res.status(408).json({ error: 'Request Timeout' });
    }, t);
    console.log("get_host_resources_information_os");
    try {
        const { h: hostname, ip: ip, p: port, u: username, w: password } = req.body;
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        const conn = new Client();

        conn.on('ready', () => {
            // OS 정보를 가져오는 명령어 실행
            conn.exec("uname -a", (err, stream) => {
                if (err) {
                    clearTimeout(timeout);
                    res.status(500).json({ error: 'SSH command failed', details: err.message });
                    return;
                }

                let osOutput = '';
                stream.on('data', (data) => {
                    osOutput += data.toString(); // OS 정보 수집
                }).on('close', (code, signal) => {
                    if (osOutput.toLowerCase().includes('linux')) {
                        // CentOS일 경우 특정 스크립트 실행
                        conn.exec("/home/" + username + "/monitor/sh/resource.sh", (err, stream) => {
                            if (err) {
                                clearTimeout(timeout);
                                res.status(500).json({ error: 'SSH command failed', details: err.message });
                                return;
                            }

                            let scriptOutput = '';
                            stream.on('data', (data) => {
                                scriptOutput += data.toString(); // 스크립트 출력 수집
                            }).on('close', (code, signal) => {
                                clearTimeout(timeout);
                                conn.end();
                                if (scriptOutput) {
                                    res.json({ result: 'success', details: scriptOutput });
                                } else {
                                    res.json({ result: 'no output' });
                                }
                            }).stderr.on('data', (data) => {
                                console.error('STDERR: ' + data.toString());
                            });
                        });
                    } else {
                        conn.exec("top -n 1 | head -n 10", (err, stream) => {
                            if (err) {
                                clearTimeout(timeout);
                                res.status(500).json({ error: 'SSH command failed', details: err.message });
                                return;
                            }

                            let output = '';
                            stream.on('data', (data) => {
                                output = data.toString(); // 데이터 수집
                            }).on('close', (code, signal) => {
                                clearTimeout(timeout);
                                conn.end();
                                if (output) {
                                    res.json({ result: 'running', details: output });
                                } else {
                                    res.json({ result: 'stopped' });
                                }
                            }).stderr.on('data', (data) => {
                                console.error('STDERR: ' + data.toString());
                            });
                        });
                    }
                }).stderr.on('data', (data) => {
                    console.error('STDERR: ' + data.toString());
                });
            });
        }).on('error', (err) => {
            clearTimeout(timeout);
            console.error('host Connection :: error :: ' + err);
            res.status(500).json({ error: 'SSH connection error', details: err.message });
        }).connect({
            host: hostname,
            port: port,
            username: username,
            password: password
        });
    } catch (err) {
        clearTimeout(timeout);
        console.error("Error ssh ping : " + hostname + "," + port, err);
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
}

async function get_host_resources_information(req, res) {
    const timeout = setTimeout(() => {
        res.status(408).json({ error: 'Request Timeout' });
    }, t);

    try {
        const { h: hostname, ip: ip, p: port, u: username, w: password, was: wasname, a: wasurl, o: wasport } = req.body;
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        //console.log(`SSH connection attempt from ${clientIp} to ${hostname}`);
        const conn = new Client();

        conn.on('ready', () => {
            conn.exec("top -n 1 | head -n 10", (err, stream) => {
                if (err) {
                    clearTimeout(timeout);
                    res.status(500).json({ error: 'SSH command failed', details: err.message });
                    return;
                }

                let output = '';
                stream.on('data', (data) => {
                    output = data.toString(); // 데이터 수집
                }).on('close', (code, signal) => {
                    clearTimeout(timeout);
                    conn.end();
                    if (output) {
                        res.json({ result: 'running', details: output });
                    } else {
                        res.json({ result: 'stopped' });
                    }
                }).stderr.on('data', (data) => {
                    console.error('STDERR: ' + data.toString());
                });
            });
        }).on('error', (err) => {
            clearTimeout(timeout);
            console.error('host Connection :: error :: ' + err);
            res.status(500).json({ error: 'SSH connection error', details: err.message });
        }).connect({
            host: ip,
            port: port,
            username: username,
            password: password
        });
    } catch (err) {
        clearTimeout(timeout);
        console.error("Error ssh ping : " + hostname + "," + port, err);
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
}
