// src/components/SystemDashboard.tsx
import React, { useEffect, useState } from 'react';
import InfoCard from './InfoCard';
import InfoCardMiddle from "./InfoCardMiddle";
import GaugeCpuChartComponent from "../../motion/GaugeCpuChartComponent";
import GaugeRamChartComponent from "../../motion/GaugeRamChartComponent";
import {host_info} from "../../HostInfo";

export interface SystemDashboardProps {
    os_info: string,
    cpu_core: string,
    cpu_load: string,
    use_heap: string,
    thread_info: string,
    class_info: string
}

interface HostsProps {
    hostname: string,
    ip_addr: string,
    jmx_port: string,
    ssh_port: string,
    database_port: string,
    username?: string,
    password?: string,
    os_status?: string,
    jmx_status?: string,
    was_status?: string
}

export interface hostResourceInfoProps {
    resource_info: ""
}

interface GlobalHostsProps {
    globalSelectedHost: HostsProps | null;
    setGlobalSelectedHost: React.Dispatch<React.SetStateAction<HostsProps | null>>;
}

const SystemDashboard: React.FC<GlobalHostsProps> = ({ globalSelectedHost, setGlobalSelectedHost }) => {
    const [resourceInfo, setResourceInfo] = useState<string>('Loading...');
    const [cpuUsage, setCpuUsage] = useState<number>(0);
    const [ramUsage, setRamUsage] = useState<number>(0);
    const [ramTotal, setRamTotal] = useState<number>(0);
    const [systemInfo, setSystemInfo] = useState<SystemDashboardProps>({
        os_info: "",
        cpu_core: "",
        cpu_load: "",
        use_heap: "",
        thread_info: "",
        class_info: ""
    });

    const fetchJmxInformationData = async () => {
        if (!globalSelectedHost) return;

        try {
            const url = host_info + '/was-jmx-information';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-XSS-Protection': '1; mode=block',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({h: globalSelectedHost.hostname, ip: globalSelectedHost.ip_addr, p: globalSelectedHost.jmx_port})
            });

            if (!response.ok) {
                throw new Error('jmx Failed to fetch data');
            }

            const data = await response.json();
            const hostInfo = data.systemInfo;
            const os_info = hostInfo.osName + " / " + hostInfo.osVersion;
            const cpu_core = hostInfo.availableProcessors + " Cores";
            const cpu_load = hostInfo.systemLoadAverage;
            const use_heap = hostInfo.usedHeapMemoryMB + " / " + hostInfo.maxHeapMemoryMB;
            const thread_info = hostInfo.totalStartedThreadCount;
            const class_info = hostInfo.totalLoadedClassCount;

            setSystemInfo({
                os_info: os_info,
                cpu_core: cpu_core.toString(),
                cpu_load: cpu_load,
                use_heap: use_heap,
                thread_info: thread_info.toString(),
                class_info: class_info.toString()
            });
        } catch (error) {
            console.error('jmx Error fetching data:', error);
        }
    };

    const fetchHostResourceInformation = async () => {
        if (!globalSelectedHost) return;
        try {
            const url = host_info + '/ssh-host-resource-information_os';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-XSS-Protection': '1; mode=block',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    h: globalSelectedHost.hostname,
                    ip: globalSelectedHost.ip_addr,
                    p: globalSelectedHost.ssh_port,
                    u: globalSelectedHost.username,
                    w: globalSelectedHost.password,
                    was: 'catalina',
                    a: 'localhost',
                    o: '8080'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            const data = await response.json();
            const stringValue = typeof data.details === 'string' ? data.details : data.details.toString();
            setResourceInfo(stringValue);
            const cpuUsagePattern = /CPU usage: (\d+\.\d+)% user/;
            const match = stringValue.match(cpuUsagePattern);
            if (match) {
                const v = parseFloat(match[1])
                setCpuUsage(v);
            } else {
                setCpuUsage(0);
            }

            // 정규식을 사용하여 실제 메모리양과 사용 중인 메모리양을 추출
            // MemRegions: 369284 total, 17G
            const memRegionsPattern = /MemRegions: (\d+) total/;
            const vmPattern = /VM: \d+T vsize, (\d+)M framework/;
            const vmMatch = stringValue.match(vmPattern);
            const memRegionsMatch = stringValue.match(memRegionsPattern);

            let totalMemory: number | 0 = 0;
            let usedMemory: number | 0 = 0;

            if (memRegionsMatch) {
                usedMemory  = memRegionsMatch[1] / 1024;
            }
            if (vmMatch) {
                totalMemory = vmMatch[1] / 1024 * 10;
            }
            if(usedMemory === 0 && totalMemory === 0){
// Total 메모리를 추출하는 패턴
                const totalMemPattern = /PhysMem: Total: (\d+)MB/;

// Used 메모리를 추출하는 패턴
                const usedMemPattern = /Used: (\d+)MB/;

                const totalMemMatch = stringValue.match(totalMemPattern);
                const usedMemMatch = stringValue.match(usedMemPattern);

                if (totalMemMatch && usedMemMatch) {
                    totalMemory = totalMemMatch[1] / 1000;
                    usedMemory = usedMemMatch[1] / 1000 ;
                } else {
                    console.log("No match found");
                }
            }
            //VM: 269T vsize, 4921M framework vsize,
            setRamTotal(parseInt(totalMemory + ""));
            setRamUsage(parseInt((usedMemory)+ "") / 10);

        } catch (error) {
            console.error('Failed to load resource info:', error);
            setResourceInfo('Failed to load data');
        }
    };

    useEffect(() => {
    }, [cpuUsage, ramUsage, ramTotal]);

    useEffect(() => {
        if (globalSelectedHost) {
            fetchHostResourceInformation();
            fetchJmxInformationData();

            const intervalId = setInterval(fetchHostResourceInformation, 2000);
            const intervalId3 = setInterval(fetchJmxInformationData, 3000);

            return () => {
                clearInterval(intervalId);
                clearInterval(intervalId3);
            };
        }
    }, [globalSelectedHost]);

    return (
        <div className="" style={{ width: '100%', verticalAlign: 'top' }}>
            <table className="table">
                <tbody>
                <tr>
                    <td style={{width: '30%', verticalAlign: 'top'}}>
                        <div className="row">
                            <h5><InfoCardMiddle title={`System Resources Information :: ${globalSelectedHost?.hostname || ''}`}  value={resourceInfo}/></h5>
                        </div>
                    </td>
                    <td style={{width: '20%'}}>
                        <div className="row" style={{width: '96%', verticalAlign: 'top', marginLeft: '10px'}}>
                            <InfoCard title="OS Name" value={systemInfo.os_info}/>
                            <InfoCard title="CPU Cores / Load Average"
                                      value={`${systemInfo.cpu_core} / ${systemInfo.cpu_load}`}/>
                            <InfoCard title="Java Heap Memory" value={systemInfo.use_heap}/>
                            <InfoCard title="Loaded Classes / Running Thread"
                                      value={`${systemInfo.class_info} / ${systemInfo.thread_info}`}/>
                        </div>
                    </td>
                    <td style={{width: '25%'}}>
                        <GaugeCpuChartComponent cpuUsage={cpuUsage}/>
                    </td>
                    <td style={{width: '25%'}}>
                        <GaugeRamChartComponent ramUsage={ramUsage} ramTotal={ramTotal}/>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default SystemDashboard;
