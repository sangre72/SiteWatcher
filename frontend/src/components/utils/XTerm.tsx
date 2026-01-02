import React, {KeyboardEvent, useEffect, useRef, useState} from 'react';
import 'xterm/css/xterm.css';
import axios from "axios";
import {host_info} from "../../HostInfo"; // xterm 스타일을 불러옵니다

const XTerm: React.FC = () => {
    const [results, setResults] = useState([]);
    const [command, setCommand] = useState('');
    const handleSend = async () => {

        try {
            const url = host_info + '/ssh-command';
            const response = await fetch(url, {
                method: 'POST', // HTTP 메소드 지정
                headers: {
                    'X-XSS-Protection': '1; mode=block',
                    'Content-Type': 'application/json' // 내용이 JSON임을 명시
                },
                body: JSON.stringify({
                    h: 'localhost',
                    p: '22',
                    u: 'bumsuklee',
                    w: 'santape1',
                    q: command
                }) // 데이터를 JSON 문자열로 변환하여 전송
            });

            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            const data = await response.json();
            setResults( [data] );
        } catch (error) {
            console.error('Error sending data:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const url = host_info + '/ssh-command';
                const response = await fetch(url, {
                    method: 'POST', // HTTP 메소드 지정
                    headers: {
                        'X-XSS-Protection': '1; mode=block',
                        'Content-Type': 'application/json' // 내용이 JSON임을 명시
                    },
                    body: JSON.stringify({
                        h: 'localhost',
                        p: '22',
                        u: 'bumsuklee',
                        w: 'santape1',
                        q: 'ls -la'
                    }) // 데이터를 JSON 문자열로 변환하여 전송
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const data = await response.json();
                setResults( [data] );

                console.log('ssh command:', data.length);
                console.log('ssh command:', data);
            } catch (error) {
                console.error('Error fetching ping:', error);
            }
        };

        fetchData(); // 컴포넌트가 처음 마운트될 때 데이터 가져오기
    }, []);

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' ) {
            e.preventDefault();
            handleSend();
            //handleGMNSend();
        }
    };

    function escapeHtml(text: string) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, "<br>").replace(/ +/g, '\t');
    }


    return (

        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: 'black',
                color: 'white',
                padding: '10px',
                fontFamily: 'hack, monospace',
                fontSize: '13px',
            }}
        >
            <input
                className="form-check-input"
                type="text"
                name="command"
                id="command"
                value={command}
                style={{width: '300px'}}
                onChange={(e) => setCommand(e.target.value)} // 입력 값 변경 시 command 상태 업데이트
                onKeyDown={handleKeyPress} // 키 프레스 이벤트 핸들러 연결
            />
            <br/>
            {results.length > 0 && (
                <div
                    style={{whiteSpace: 'pre-wrap'}}
                    dangerouslySetInnerHTML={{
                        __html: escapeHtml(results[0].result)
                    }}
                ></div>

            )}
        </div>
    );
};
/*{
    "result": "total 1176\ndrwxr-x---+ 101 bumsuklee  staff    3232 Apr 25 11:48 .\ndrwxr-xr-x    5 root       admin     160 Apr  4 05:26 ..\n-r--------    1 bumsuklee  staff       8 Feb 28 05:29 .CFUserTextEncoding\n-rw-r--r--@   1 bumsuklee  staff   18436 Apr 23 14:18 .DS_Store\ndrwx------@  23 bumsuklee  staff     736 Jan  8 16:56 .Puffin\ndrwx------+  53 bumsuklee  staff    1696 Apr 23 09:53 .Trash\n-rw-------@   1 bumsuklee  staff     845 Jan  4 07:09 .bash_history\n-rw-r--r--    1 bumsuklee  staff     499 Jan  3 18:04 .bash_profile\ndrwxr-xr-x@  15 bumsuklee  staff     480 Apr 25 11:02 .cache\ndrwxrwsr-x    3 bumsuklee  staff      96 Jan  4 09:17 .conda\n-rw-r--r--    1 bumsuklee  staff      65 Jan 15 13:14 .condarc\ndrwx------   10 bumsuklee  staff     320 Apr 23 09:31 .config\ndrwxr-xr-x@  12 bumsuklee  staff     384 Apr  2 05:53 .docker\ndrwxr-xr-x@   5 bumsuklee  staff     160 Feb 13 14:09 .eclipse\n-rw-r--r--    1 bumsuklee  staff     126 Apr 14 00:02 .env\ndrwxr-xr-x    3 bumsuklee  staff      96 Apr 25 07:11 .gem\n-rw-r--r--    1 bumsuklee  staff     153 Apr 22 06:18 .gitconfig\ndrwxr-xr-x    3 bumsuklee  staff      96 Jan 15 13:04 .ipython\ndrwxr-xr-x    4 bumsuklee  staff     128 Jan  4 10:43 .keras\ndrwxr-xr-x@   3 bumsuklee  staff      96 Feb 28 05:58 .kodi\ndrwxr-xr-x@   3 bumsuklee  staff      96 Jan 28 10:43 .lemminx\n-rw-------    1 bumsuklee  staff      20 Apr 22 06:19 .lesshst\ndrwxr-xr-x    3 bumsuklee  staff      96 Jan  2 21:47 .local\ndrwxr-xr-x@   5 bumsuklee  staff     160 Jan  2 20:44 .m2\ndrwxr-xr-x@   3 bumsuklee  staff      96 Apr 10 15:55 .matplotlib\ndrwxr-xr-x@   4 bumsuklee  staff     128 Jan 21 13:49 .nbprofiler\n-rw-------    1 bumsuklee  staff       8 Mar 27 10:07 .node_repl_history\ndrwxr-xr-x    8 bumsuklee  staff     256 Apr 23 12:15 .npm\ndrwxr-xr-x@  31 bumsuklee  staff     992 Apr 23 12:07 .nvm\ndrwxr-xr-x   23 bumsuklee  staff     736 Apr 11 05:55 .oh-my-zsh\ndrwxr-xr-x@   7 bumsuklee  staff     224 Apr 22 17:56 .ollama\n-rw-r--r--    1 bumsuklee  staff   90605 Jan  5 15:00 .p10k.zsh\ndrwxr-xr-x@   5 bumsuklee  staff     160 Apr  3 09:47 .p2\ndrwxr-xr-x    3 bumsuklee  staff      96 Jan  4 09:13 .pyenv\ndrwxr-xr-x@   3 bumsuklee  staff      96 Jan 26 21:05 .redhat\ndrwxr-xr-x@   3 bumsuklee  staff      96 Jan 27 20:01 .rsp\ndrwx------@   4 bumsuklee  staff     128 Apr 23 13:03 .ssh\ndrwxr-xr-x@   3 bumsuklee  staff      96 Jan 28 10:47 .sts4\ndrwxr-xr-x    6 bumsuklee  staff     192 Jan  3 20:04 .subversion\ndrwxr-xr-x    5 bumsuklee  staff     160 Jan 14 15:28 .swiftpm\n-rw-------    1 bumsuklee  staff   12288 Jan 29 21:12 .swp\n-rw-r--r--    1 bumsuklee  staff     320 Jan  3 18:04 .tcshrc\n-rw-r--r--    1 bumsuklee  staff      16 Jan 28 09:48 .tmux.conf\ndrwxr-xr-x@   3 bumsuklee  staff      96 Feb 13 14:09 .tooling\ndrwxr-xr-x    3 bumsuklee  staff      96 Apr 23 07:32 .vim\n-rw-------    1 bumsuklee  staff   27256 Apr 25 09:18 .viminfo\ndrwxr-xr-x@   5 bumsuklee  staff     160 Jan 26 20:56 .vscode\ndrwxr-xr-x    8 bumsuklee  staff     256 Jan  4 06:20 .wine\n-rw-r--r--    1 bumsuklee  staff     687 Jan  3 18:04 .xonshrc\n-rw-r--r--    1 bumsuklee  staff     116 Apr 23 06:59 .yarnrc\n-rw-r--r--    1 bumsuklee  staff   49873 Apr 24 06:23 .zcompdump-Bum의 MacBook Pro-5.9\n-rw-r--r--@   1 bumsuklee  staff      80 Jan 12 20:21 .zprofile\n-rw-------    1 bumsuklee  staff  213079 Apr 25 11:48 .zsh_history\ndrwx------    5 bumsuklee  staff     160 Apr 23 07:32 .zsh_sessions\n-rw-r--r--@   1 bumsuklee  staff    6938 Apr 24 05:47 .zshrc\ndrwxr-xr-x@   5 bumsuklee  staff     160 Mar 21 21:30 Applications\ndrwx------@  19 bumsuklee  staff     608 Apr 24 11:56 Desktop\ndrwx------@  24 bumsuklee  staff     768 Mar 30 22:33 Documents\ndrwx------+ 156 bumsuklee  staff    4992 Apr 25 10:25 Downloads\ndrwxr-xr-x@   8 bumsuklee  staff     256 Mar 28 07:46 IdeaProjects\ndrwx------@ 108 bumsuklee  staff    3456 Apr  4 05:48 Library\ndrwx------    7 bumsuklee  staff     224 Mar 28 15:03 Movies\ndrwx------+   7 bumsuklee  staff     224 Jan 23 07:08 Music\ndrwxr-xr-x    7 bumsuklee  staff     224 Apr 18 12:09 PhpstormProjects\ndrwx------+   6 bumsuklee  staff     192 Mar 28 15:03 Pictures\ndrwxr-xr-x+   4 bumsuklee  staff     128 Jan  2 19:38 Public\ndrwxr-xr-x@  12 bumsuklee  staff     384 Apr 19 11:46 PycharmProjects\ndrwxr-xr-x@   5 bumsuklee  staff     160 Apr 22 11:19 WebstormProjects\ndrwxr-xr-x    7 bumsuklee  staff     224 Jan 14 15:28 XCodeProjects\n-rwxr-xr-x@   1 bumsuklee  staff     157 Jan 12 21:27 a.sh\ndrwxr-xr-x    2 bumsuklee  staff      64 Apr 10 16:36 ai\n-rwxr-xr-x@   1 bumsuklee  staff     116 Jan 17 21:21 b.sh\n-rwxr-xr-x@   1 bumsuklee  staff      76 Jan 12 21:35 c.sh\n-rwxr-xr-x    1 bumsuklee  staff     111 Jan 12 23:02 d2.sh\n-rwxr-xr-x    1 bumsuklee  staff     114 Jan 12 22:56 d4.sh\n-rwxr-xr-x    1 bumsuklee  staff     138 Jan 12 23:02 dd.sh\ndrwxr-xr-x    2 bumsuklee  staff      64 Mar 28 08:17 docker\n-rw-r--r--@   1 bumsuklee  staff      97 Mar  4 08:33 e.sh\ndrwxr-xr-x@   6 bumsuklee  staff     192 Mar 28 15:03 eclipse-workspace\ndrwxr-xr-x    4 bumsuklee  staff     128 Jan  7 00:36 etc_app\n-rwxr-xr-x    1 bumsuklee  staff      56 Apr 25 07:29 fluent.sh\ndrwxr-xr-x    2 bumsuklee  staff      64 Jan 12 09:06 gptk\ndrwxr-xr-x    3 bumsuklee  staff      96 Jan 23 17:13 html\n-rwxr-xr-x    1 bumsuklee  staff      39 Apr 11 16:40 httpds.sh\ndrwx------    5 bumsuklee  staff     160 Jan  7 00:21 iCloud Drive (Archive)\n-rwxr-xr-x    1 bumsuklee  staff      36 Apr 11 16:41 killhttpd.sh\ndrwxr-xr-x@   2 bumsuklee  staff      64 Jan  9 18:21 llama\ndrwxr-xr-x@   3 bumsuklee  staff      96 Jan  9 18:24 llama2\ndrwxr-xr-x    5 bumsuklee  staff     160 Apr 20 15:05 llm\ndrwxr-xr-x    2 bumsuklee  staff      64 Apr 22 12:23 logs\n-rwxr-xr-x@   1 bumsuklee  staff      24 Apr 11 05:57 m.sh\ndrwxr-xr-x   28 bumsuklee  staff     896 Apr 20 13:23 miniconda3\ndrwxr-xr-x@  10 bumsuklee  staff     320 Mar 30 22:33 my-game-prefix\n-rw-r--r--@   1 bumsuklee  staff       0 Feb 13 14:09 pmd-eclipse.log\ndrwxr-xr-x@  18 bumsuklee  staff     576 Mar 28 15:03 powerlevel10k\ndrwxr-xr-x@   5 bumsuklee  staff     160 Feb 29 07:48 react-prj\n-rwxr-xr-x@   1 bumsuklee  staff      97 Jan 13 20:35 s.sh\n-rwxr-xr-x    1 bumsuklee  staff     177 Jan 13 20:16 ss.sh\ndrwxr-xr-x    4 bumsuklee  staff     128 Apr 11 15:00 ssl\n-rw-r--r--    1 bumsuklee  staff      48 Apr 23 17:23 tomcat.sh\ndrwxr-xr-x    3 bumsuklee  staff      96 Feb 22 07:21 vscode-projects\n"
}*/
export default XTerm;
