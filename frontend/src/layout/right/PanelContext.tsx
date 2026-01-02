import React, { createContext, useContext, useState, ReactNode, FunctionComponent } from 'react';

// 컨텍스트에 포함될 상태 및 함수들의 타입 정의
interface PanelContextType {
    isOpen: boolean;
    togglePanels: () => void;
    closePanels: () => void;
}

// 컨텍스트 생성, 초기값은 null이지만 타입은 PanelContextType이어야 함
const PanelContext = createContext<PanelContextType | null>(null);

// 컨텍스트를 사용하는 커스텀 훅
export const usePanel = (): PanelContextType => {
    const context = useContext(PanelContext);
    if (!context) {
        throw new Error('usePanel must be used within a PanelProvider');
    }
    return context;
};

// PanelProvider 컴포넌트의 프로퍼티 타입
interface PanelProviderProps {
    children: ReactNode;
}

// PanelProvider 컴포넌트 정의
export const PanelProvider: FunctionComponent<PanelProviderProps> = ({ children }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const togglePanels = () => {
        setIsOpen(!isOpen);
    };

    const closePanels = () => {
        setIsOpen(false);
    };

    return (
        <PanelContext.Provider value={{ isOpen, togglePanels, closePanels }}>
            {children}
        </PanelContext.Provider>
    );
};
