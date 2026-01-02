import React, {KeyboardEvent, useCallback, useEffect, useRef, useState} from "react";
import AceEditor from "react-ace";
import axios from 'axios';

// Ensure the imports match your requirements for syntax highlighting
import "ace-builds/src-noconflict/mode-json"; // using json for demonstration
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-dawn";
import "ace-builds/src-noconflict/theme-chaos";
import "ace-builds/src-noconflict/ext-language_tools";
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/theme-monokai';

import "./SidePanel.css"
import {host_info} from "../../HostInfo";
interface SidePanelProps {
    isOpen: boolean;
    responseContent: string; // Assuming responseContent is a string for the editor
    onClose: () => void; // 새로 추가된 onClose 함수
    onToggle: () => void; // 새로 추가된 onClose 함수
    filePath: string;
}

interface AceEditorProps {
    mode: string;
    filePath: string;
}

const FileSidePanel: React.FC<SidePanelProps> = ({ responseContent, onClose, onToggle, filePath}) => {
    const [isOpen, setIsOpen] = useState(false); // 시작부터 닫혀있도록 변경
    const [zIndex, setZIndex] = useState(1060);
    const [mode, setMode] = useState("javascript");

    const [content, setContent] = useState(responseContent);
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            saveFile();
        }
    }, [filePath, content]);
    const handleEditorChange = (newValue: string) => {
        setContent(newValue);
    };

    useEffect(() => {
        setIsOpen(responseContent !== ""); // 내용이 있으면 열기
    }, [responseContent]);

    useEffect(() => {
        setIsOpen(false);
        setZIndex(1050);
    }, [onClose]);

    useEffect(() => {
        // responseContent 값이 변경될 때 isOpen을 true로 설정합니다.
        setIsOpen(true);
        setZIndex(1060);
    }, [responseContent]);

    const togglePanel = () => {
        setIsOpen(!isOpen);
        if (onClose) setZIndex(1050);
    };

    useEffect(() => {
        const editor = document.getElementById('ACE_RIGHT_002   ');
        if (editor) {
            editor.style.width = '630px';
            editor.style.height = '1600px';
        }
    }, []);


    const saveFile = async () => {
        const formattedDate = new Date().toISOString().replace(/[\-\:T]/g, '').slice(0, 14);
        const newFileName = `${filePath}_${formattedDate}`;

        try {
            const response = await axios.post(host_info + '/save-file', {
                fileName: newFileName,
                content: content
            });
        } catch (error) {
            console.error('Error saving file:', error);
        }
    };

    return (
        <>
            {isOpen && (
                <div
                    className={`side-panel ${isOpen ? 'open' : 'close'}`}
                    style={{
                        width: '650px',
                        height: '1600px',
                        position: 'fixed',
                        right: '0',
                        top: '0',
                        backgroundColor: '#0f0f0f',
                        overflowX: 'hidden',
                        transition: '0.5s',
                        padding: '10px',
                        zIndex: zIndex, // High z-index to ensure it's on top
                        borderLeft: '2px solid #ccc'
                    }}
                ><p style={{
                    color: '#efefef',
                    fontSize: '12px'
                }}>{filePath}</p>
                    <AceEditor
                        mode={mode}
                        theme="chaos"
                        fontSize={13}
                        style={{width: '630px', height: '1600px'}}
                        onChange={handleEditorChange}
                        name="ACE_RIGHT_002"
                        value={responseContent}
                        maxLines={60}
                        editorProps={{$blockScrolling: false}}
                        readOnly={false}
                        setOptions={{
                            useWorker: false,
                            wrap: true,
                        }}
                    />
                </div>
            )}
            <button
                className="btn button btn-warning"
                onClick={togglePanel}
                style={{
                    position: 'fixed',
                    right: isOpen ? '650px' : '0',
                    top: '60px',
                    fontSize: 15,
                    zIndex: 1060,
                    padding: '10px 20px',
                    borderRadius: '8px 0 0 8px',
                    border: 'none',
                    fontWeight: 'bold',
                }}
            >
                {isOpen ? 'File Close' : 'File'}
            </button>

        </>
    );
};
export default FileSidePanel;
