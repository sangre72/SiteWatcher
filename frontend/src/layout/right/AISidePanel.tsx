import React, { useEffect, useRef, useState } from "react";
import AceEditor from "react-ace";

// Ensure the imports match your requirements for syntax highlighting
import "ace-builds/src-noconflict/mode-json"; // using json for demonstration
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import "./SidePanel.css"

const AISidePanel: React.FC<SidePanelProps> = ({ responseContent, onClose, onToggle }) => {
    const [isOpen, setIsOpen] = useState(false); // 시작부터 닫혀있도록 변경
    const [zIndex, setZIndex] = useState(1060);

    const sidePanelRef = useRef<HTMLDivElement>(null); // sidePanel 요소에 대한 ref 생성

    useEffect(() => {
        setIsOpen(false);
        setZIndex(1050);
    }, [onClose]);

    useEffect(() => {
        setIsOpen(true);
        setZIndex(1060);
    }, [responseContent]);

    const togglePanel = () => {
        setIsOpen(!isOpen);
        if (onClose) setZIndex(1050);
    };

    return (
        <>
            {isOpen && (
                <div
                    className={`side-panel ${isOpen ? 'open' : 'close'}`}
                    style={{
                        width: '650px',
                        height: '100%',
                        position: 'fixed',
                        right: '0',
                        top: '0',
                        backgroundColor: 'white',
                        overflowX: 'hidden',
                        transition: '0.5s',
                        padding: '10px',
                        zIndex: zIndex, // High z-index to ensure it's on top
                        borderLeft: '2px solid #ccc'
                    }}
                >
                    <AceEditor
                        mode="text"
                        theme="github"
                        fontSize={13}
                        onChange={console.log}
                        name="ACE_RIGHT_001"
                        value={responseContent}
                        maxLines={60}
                        editorProps={{ $blockScrolling: false }}
                        setOptions={{
                            useSoftTabs: true,
                            useWorker: false,
                            wrap: true,
                            readOnly: false,
                        }}
                    />
                </div>
            )}
            <button
                className="btn button btn-success"
                onClick={togglePanel}
                style={{
                    position: 'fixed',
                    right: isOpen ? '650px' : '0',
                    top: '5px',
                    zIndex: 1051,
                    padding: '10px 20px',
                    borderRadius: '8px 0 0 8px',
                    border: 'none',
                    fontWeight: 'bold',
                }}
            >
                {isOpen ? 'AI Close' : 'AI '}
            </button>
        </>
    );
};

export default AISidePanel;
