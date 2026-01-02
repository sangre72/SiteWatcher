import React, {useEffect, useRef, useState} from 'react';
import Terminal, { ColorMode, TerminalOutput } from 'react-terminal-ui';
import styled from 'styled-components';
import './terminal.css'
import {host_info} from "../../HostInfo";
import {useHost} from "../../HostProvider";
import Hosts from "../../page/root/config/Hosts";

const XTerm_example = (props = {}) => {

    const StyledTerminal = styled(Terminal)`
        width: 100% !important;  // 넓이를 100%로 강제 적용
        font-size: 10px !important;  // 폰트 크기를 10px로 강제 적용
    `;

    const StyledTerminalOutput = styled(TerminalOutput)`
        font-size: 10px !important;  // 폰트 크기를 10px로 강제 적용
    `;

    const [terminalLineData, setTerminalLineData] = useState([
        <StyledTerminalOutput>Welcome to the React Terminal UI!</StyledTerminalOutput>
    ]);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };
    const { globalSelectedHost, setGlobalSelectedHost } = useHost();

    const terminalRef = useRef(null);
    const [results, setResults] = useState([]);
    const [command, setCommand] = useState('');
    const [pwd, setPwd] = useState('');

    // 스크롤을 맨 아래로 이동시키는 함수
    const scrollToActiveInput = () => {
        //react-terminal-line small-font
        const element = document.querySelector('.react-terminal-active-input');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };


    const handleSend = async (input: string) => {
        if (globalSelectedHost) {
            const scrollPosition = window.scrollY;

            if (input === undefined || input === null || input === "") {
                input = 'pwd'
            }
            input = input.trimStart();
            if (input.toLowerCase().startsWith("ls ")) {
                input = input + " " + pwd;
            }
            if (input.trim().toLowerCase().startsWith("clear ")) {
                input = "pwd";
            }
            try {
                const url = host_info + '/ssh-command';
                const response = await fetch(url, {
                    method: 'POST', // HTTP 메소드 지정
                    headers: {
                        'X-XSS-Protection': '1; mode=block',
                        'Content-Type': 'application/json' // 내용이 JSON임을 명시
                    },
                    body: JSON.stringify({
                        h: globalSelectedHost.hostname,
                        p: globalSelectedHost.ssh_port,
                        u: globalSelectedHost.username,
                        w: globalSelectedHost.password,
                        q: input
                    }) // 데이터를 JSON 문자열로 변환하여 전송
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const data = await response.json();
                setResults([data]);
                if (input.trim().toLowerCase().startsWith("cd ")) {
                    setPwd(data.result);
                }

                if (input.trim().toLowerCase().startsWith("clear")) {
                    setCommand("" + Date.now());
                }
                setTerminalLineData([...terminalLineData,
                    <TerminalOutput key={Date.now()}>{data.result}</TerminalOutput>]);
                // 처리 완료 후 스크롤 위치 복원
                window.scrollTo(0, scrollPosition);
            } catch (error) {
                console.error('Error sending data:', error);
            }
        }
    };

    // useEffect를 사용하여 컴포넌트 마운트 후 스크롤을 맨 아래로 이동
    useEffect(() => {
        scrollToActiveInput();

    }, [terminalLineData]);  // terminalLineData가 변경될 때마다 실행


    useEffect(() => {
        setTerminalLineData([]);
    },[command]);
    useEffect(() => {
        const element = document.querySelector('.react-terminal-line');
        if (element) {
            element.classList.add('.small-font');
        }
    }, []);

    useEffect(() => {
        if (globalSelectedHost) {
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
                            h: globalSelectedHost.hostname,
                            p: globalSelectedHost.ssh_port,
                            u: globalSelectedHost.username,
                            w: globalSelectedHost.password,
                            q: 'pwd'
                        }) // 데이터를 JSON 문자열로 변환하여 전송
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch data');
                    }

                    const data = await response.json();
                    setResults([data]);
                    setPwd(data.result);

                    setTerminalLineData([...terminalLineData, <TerminalOutput>{data.result}</TerminalOutput>]);
                } catch (error) {
                    setTerminalLineData([...terminalLineData, <TerminalOutput>{error}</TerminalOutput>]);
                    console.error('Error fetching ping:', error);
                }
            };

            fetchData(); // 컴포넌트가 처음 마운트될 때 데이터 가져오기
        }
    }, [globalSelectedHost]);

    // Terminal has 100% width by default so it should usually be wrapped in a container div
    return (
        <>
            <div
                 style={{
                     width: '100%',
                     height: isExpanded ? '300px' : '104px',
                     marginTop: '10px',
                     transition: 'height 0.4s ease-in-out',
                     display: 'flex',
                     flexDirection: 'column',
                     justifyContent: 'flex-start'
                 }}>
                <Hosts globalSelectedHost={globalSelectedHost} setGlobalSelectedHost={setGlobalSelectedHost}/>
                <button className={`scroll-arrow ${isExpanded ? 'up' : 'down'}`} onClick={toggleExpand}>
                    ▼
                </button>
            </div>
            <br/>
            <div style={{width: '100%', height: '100%', fontSize: '12px'}} ref={terminalRef}>
                <style>
                    {`
                  #terminal {
                    width: 100%;
                    height: 120vh;
                    border: none;
                  }
                `}
                </style>
                <StyledTerminal
                    name="Wordncode Terminal"
                    colorMode={ColorMode.Dark}
                    onInput={(input) => {
                        handleSend(input);
                    }}
                >
                    {terminalLineData}
                </StyledTerminal>
            </div>
        </>
)
    ;
};

export default XTerm_example;