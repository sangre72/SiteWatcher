import React, { createContext, useContext, useState } from 'react';

// GlobalData 타입 정의
interface GlobalData {
    globalData: string;
    setGlobalData: (data: string) => void;
}

// Context 객체 생성
const GlobalContext = createContext<GlobalData | undefined>(undefined);


// Provider 컴포넌트
// @ts-ignore
export const GlobalProvider = ({ children }) => {
    const [globalData, setGlobalData] = useState("Initial Data");

    return (
        <GlobalContext.Provider value={{ globalData, setGlobalData }}>
            {children}
        </GlobalContext.Provider>
    );
};

// Hook for accessing the context
export const useGlobal = () => useContext(GlobalContext);
