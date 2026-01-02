import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';

// CodeEditor 컴포넌트의 props에 대한 인터페이스 정의
interface CodeEditorProps {
    fileContent: string; // 여기서 이름을 변경했습니다.
}
const CodeEditor: React.FC<CodeEditorProps> = ({ fileContent }) => {
    const editorDiv = useRef(null);

    useEffect(() => {
        if (!editorDiv.current) return;

        const startState = EditorState.create({
            doc: fileContent,
            extensions: [
                keymap.of(defaultKeymap),
                javascript(),
                EditorView.updateListener.of((update) => {
                    if (update.changes) {
                        // 여기서 변경 사항을 처리할 수 있습니다.
                    }
                }),
                EditorView.lineWrapping,
                EditorView.theme({
                    "&": {
                        fontSize: "16px",
                    }
                }),
            ],
        });

        const view = new EditorView({
            state: startState,
            parent: editorDiv.current,
        });

        return () => {
            view.destroy();
        };
    }, [fileContent]);

    return <div ref={editorDiv} />;
};

export default CodeEditor;
