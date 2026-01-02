const { Client } = require('ssh2');

module.exports = { checkJmxStatus };

const t = 20000; // 20초 타임아웃 설정

async function checkJmxStatus(req, res) {
    const timeout = setTimeout(() => {
        res.status(408).json({ error: 'Request Timeout' });
    }, t);

    try {
        const { h: hostname, p: sshPort, u: username, w: password, was: wasname, jmx_port: jmxPort } = req.body;
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        const conn = new Client();

        conn.on('ready', () => {
            //const command = `ps -ef | grep ${jmxPort} | grep ${wasname}`;
            //const command = `netstat -an | grep ${jmxPort} && ps -ef | grep ${wasname} | grep -v grep`;
            const command = `ps -ef | grep ${jmxPort} | grep ${wasname} | grep -v grep | awk '{print $2}'`;

            conn.exec(command, (err, stream) => {
                if (err) {
                    clearTimeout(timeout);
                    res.status(500).json({ error: 'SSH command failed', details: err.message });
                    return;
                }

                let output = '';
                stream.on('data', (data) => {
                    output += data.toString();
                }).on('close', (code, signal) => {
                    clearTimeout(timeout);
                    conn.end();

                    if (output.includes(jmxPort) && output.includes(wasname)) {
                        checkJMXConnection(hostname, jmxPort, res, timeout);
                    } else {
                        res.status(404).json({ result: 'stopped', details: 'WAS or JMX port not found' });
                    }
                }).stderr.on('data', (data) => {
                    console.error('STDERR: ' + data.toString());
                });
            });
        }).on('error', (err) => {
            clearTimeout(timeout);
            console.error('jmx Connection :: error :: ' + err);
            res.status(500).json({ error: 'SSH connection error', details: err.message });
        }).connect({
            host: hostname,
            port: sshPort,
            username: username,
            password: password
        });
    } catch (err) {
        clearTimeout(timeout);
        console.error("Error ssh ping : " + hostname + "," + sshPort, err);
        res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
}

function checkJMXConnection(hostname, jmxPort, res, timeout) {
    const client = jmx.createClient({
        host: hostname,
        port: jmxPort
    });

    client.connect();

    client.on('connect', () => {
        client.getAttribute('java.lang:type=Runtime', 'Uptime', (err, data) => {
            clearTimeout(timeout);
            client.disconnect();

            if (err) {
                console.error('JMX connection error:', err);
                res.status(500).json({ error: 'JMX connection error', details: err.message });
            } else {
                res.json({ result: 'running', uptime: data });
            }
        });
    });

    client.on('error', (err) => {
        clearTimeout(timeout);
        console.error('JMX client error:', err);
        res.status(500).json({ error: 'JMX client error', details: err.message });
    });
}
