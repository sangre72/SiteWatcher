import React, { createContext, useState, useContext, ReactNode } from 'react';

interface HostsProps {
    hostname: string;
    ip_addr: string;
    jmx_port: string;
    ssh_port: string;
    database_port: string;
    was_directory: string,
    was_start_command: string,
    was_pid: string,
    username?: string;
    password?: string;
    os_status?: string;
    jmx_status?: string;
    was_status?: string;
}

interface HostContextProps {
    globalSelectedHost: HostsProps | null;
    setGlobalSelectedHost: React.Dispatch<React.SetStateAction<HostsProps | null>>;
}

const HostContext = createContext<HostContextProps | undefined>(undefined);

export const HostProvider = ({ children }: { children: ReactNode }) => {
    const [globalSelectedHost, setGlobalSelectedHost] = useState<HostsProps | null>(null);

    return (
        <HostContext.Provider value={{ globalSelectedHost, setGlobalSelectedHost }}>
            {children}
        </HostContext.Provider>
    );
};

export const useHost = (): HostContextProps => {
    const context = useContext(HostContext);
    if (!context) {
        throw new Error('useHost must be used within a HostProvider');
    }
    return context;
};
