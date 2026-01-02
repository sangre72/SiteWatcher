import React, { useState } from 'react';
import AceEditor from 'react-ace';

// 필요한 Ace Editor 모드 및 테마를 import 합니다.
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/theme-monokai';

interface FileEditorProps {
    filename: string;
    fileContent: string;
}

export const determineMode = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'js':
            return 'javascript';
        case 'py':
            return 'python';
        case 'java':
            return 'java';
        case 'html':
        case 'htm':
            return 'html';
        case 'css':
            return 'css';
        case 'json':
            return 'json';
        case 'md':
            return 'markdown';
        default:
            return 'text'; // 기본 텍스트 모드
    }
};

export default { determineMode };
