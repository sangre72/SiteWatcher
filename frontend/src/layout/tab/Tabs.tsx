import React, { useState } from 'react';
import Tab from './Tab'
interface TabInterface {
    id: string;
    name: string;
    component: React.ReactNode;
}

interface TabsProps {
    tabs: TabInterface[];
    activeTabId: string | null;
    onTabSelect: (id: string) => void;
    onTabClose: (id: string, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTabId, onTabSelect, onTabClose }) => {
    return (
        <ul className="nav nav-tabs" role="tablist">
            {tabs.map(tab => (
                <Tab
                    id={tab.id}
                    name={tab.name}
                    active={activeTabId === tab.id}
                    onSelect={onTabSelect}
                    onClose={onTabClose}
                />
            ))}
        </ul>
    );
};

export default Tabs;
