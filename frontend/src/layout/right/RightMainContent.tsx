import React, { useState } from 'react';
import { usePanel } from './PanelContext';
import FileSidePanel from './FileSidePanel';
import AISidePanel from "./AISidePanel";

const RightMainContent = () => {
    const { isOpen, togglePanels, closePanels } = usePanel();
    const [responseContent, setResponseContent] = useState(''); // 상태 추가

    // 패널 닫기 핸들러
    const handleClose = () => {
        closePanels(); // 모든 패널을 닫습니다
    };

    // 패널 토글 핸들러
    const togglePanel = () => {
        togglePanels(); // 모든 패널 상태 토글
    };

    return (
        <div>
            {/*<FileSidePanel
                isOpen={isOpen}
                onClose={handleClose}
                onToggle={togglePanel}
                responseContent={responseContent}
            />*/}
            {/* 다른 컴포넌트나 페이지 구성 요소 */}
        </div>
    );
};

export default RightMainContent;
