import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface MenuContextType {
    activeMenu: string | null;
    setActiveMenu: (menuName: string | null) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // setActiveMenu 함수를 직접 노출
    const changeActiveMenu = useCallback((menuName: string | null) => {
        setActiveMenu(menuName);
    }, []);

    return (
        <MenuContext.Provider value={{ activeMenu, setActiveMenu: changeActiveMenu }}>
            {children}
        </MenuContext.Provider>
    );
};

export const useMenu = () => {
    const context = useContext(MenuContext);
    if (context === undefined) {
        throw new Error('useMenu must be used within a MenuProvider');
    }
    return context;
};
