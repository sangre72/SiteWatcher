// TabClickBodyView.tsx

import React from 'react';

interface TabClickBodyViewProps {
    tabs: TabInterface[]; // 탭 정보 배열
    activeTabId: string | null; // 활성 탭 ID
}

interface TabInterface {
    id: string; // 탭의 고유 ID
    name: string; // 탭의 이름
    component: React.ReactNode; // 탭에 표시될 컴포넌트
}

const TabClickBodyView: React.FC<TabClickBodyViewProps> = ({ tabs, activeTabId }) => {
    return (
        <div className="content-body content-body-with-margin">
            {tabs.filter(tab => tab.id === activeTabId).map(tab => (
                <div key={tab.id}>
                    {tab.component}
                </div>
            ))}
        </div>
    );
};

export default TabClickBodyView;
