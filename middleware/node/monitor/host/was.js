const { Client } = require('ssh2');

module.exports = { checkWasStatus };

const t = 20000; // 20초 타임아웃 설정

async function checkWasStatus(req, res) {
    const timeout = setTimeout(() => {
        res.status(408).json({ error: 'Request Timeout' });
    }, t);

    try {
        const { h: hostname, p: port, u: username, w: password, was: wasname, a: wasurl, o: wasport } = req.body;
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        //console.log(`SSH connection attempt from ${clientIp} to ${hostname}`);
        const conn = new Client();

        conn.on('ready', () => {
            //console.log('Client was :: ready');
            // 톰캣 프로세스를 확인하기 위한 명령어, 톰캣 환경에 따라 적절히 수정이 필요할 수 있음
            //console.log('Client ping:: ready : ' + "ps -ef | grep '"+wasname+"' | grep -v grep | awk '{print $2}'",);
            //lsof -i :8080 | awk 'NR>1 {print $2}' | xargs -I {} ps -ef {} | grep catalina | awk '{print $2}' -- 되는것

            // lsof -i :8080 | awk 'NR>1 {print $2}' | xargs -I {} ps -p {} | grep catalina | awk '{print $1}' 이게 맞는것이라내

            //ps -ef | grep catalina | awk '{print $2}'
            //
            //console.log("lsof -i :"+wasport+" | awk 'NR>1 {print $2}' | xargs -I {} ps -p {} | grep "+wasname+" | awk '!seen[$1]++ {print $1}' ");
            const command = `ps -ef | grep ${wasport} | grep ${wasname} | grep -v grep | awk '{print $2}'`;
            //"lsof -i :"+wasport+" | awk 'NR>1 {print $2}' | xargs -I {} ps -p {} | grep "+wasname+" | awk '!seen[$1]++ {print $1}' "
            conn.exec(command, (err, stream) => {
                if (err) {
                    clearTimeout(timeout);
                    res.status(500).json({ error: 'SSH command failed', details: err.message });
                    return;
                }

                let output = '';
                stream.on('data', (data) => {
                    output = data.toString().replaceAll("\n",""); // 데이터 수집
                }).on('close', (code, signal) => {
                    //console.log(`WasStatus from ${clientIp} :: close :: code: ${code}, signal: ${signal} ::: ` + output);
                    clearTimeout(timeout);
                    conn.end();
                    //console.log(`Connection attempt from ${clientIp} to ${hostname} ` + output);
                    if (output) {
                        console.log(output);
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
            console.error('was Connection :: error :: ' + err);
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
