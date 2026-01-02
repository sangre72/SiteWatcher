// src/components/GaugeChartComponent.tsx
import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

interface GaugeRamChartComponentProps {
    ramUsage: number;
    ramTotal: number;
}

const GaugeRamChartComponent: React.FC<GaugeRamChartComponentProps> = ({ ramUsage, ramTotal }) => {
    const [chartOptions, setChartOptions] = useState<any>(getInitialOptions(ramUsage, ramTotal));

    useEffect(() => {
        const updatedOptions = getInitialOptions(ramUsage, ramTotal);
        setChartOptions(updatedOptions);
    }, [ramUsage, ramTotal]);

    return (
        <div style={{ width: '100%', height: '500px' }}>
            <ReactECharts
                option={chartOptions}
                style={{ height: '100%', width: '100%' }}
            />
        </div>
    );
};

const getInitialOptions = (ramUsage: number, ramTotal: number) => {
    const maxRam = isNaN(ramTotal) ? 100 : ramTotal; // 기본 값 설정
    const currentRamUsage = isNaN(ramUsage) ? 0 : ramUsage;

    return {
        backgroundColor: '#1b1b1b',
        tooltip: {
            formatter: '{a} <br/>{c} {b}'
        },
        toolbox: {
            show: true,
            feature: {
                mark: { show: true },
                restore: { show: true },
                saveAsImage: { show: true }
            }
        },
        series: [
            {
                name: 'RAM Usage',
                type: 'gauge',
                min: 0,
                max: maxRam,
                splitNumber: 8,
                radius: '70%',
                axisLine: {
                    lineStyle: {
                        color: [[0.09, 'lime'], [0.82, '#1e90ff'], [1, '#ff4500']],
                        width: 3,
                        shadowColor: '#fff',
                        shadowBlur: 10
                    }
                },
                axisLabel: {
                    fontWeight: 'bolder',
                    color: '#fff',
                    shadowColor: '#fff',
                    shadowBlur: 10
                },
                axisTick: {
                    length: 15,
                    lineStyle: {
                        color: 'auto',
                        shadowColor: '#fff',
                        shadowBlur: 10
                    }
                },
                splitLine: {
                    length: 25,
                    lineStyle: {
                        width: 3,
                        color: '#fff',
                        shadowColor: '#fff',
                        shadowBlur: 10
                    }
                },
                pointer: {
                    shadowColor: '#fff',
                    shadowBlur: 5
                },
                title: {
                    textStyle: {
                        fontWeight: 'bolder',
                        fontSize: 20,
                        fontStyle: 'italic',
                        color: '#fff',
                        shadowColor: '#fff',
                        shadowBlur: 10
                    }
                },
                detail: {
                    borderColor: '#fff',
                    shadowColor: '#fff',
                    shadowBlur: 5,
                    offsetCenter: [0, '50%'],
                    textStyle: {
                        fontWeight: 'bolder',
                        color: '#fff'
                    }
                },
                data: [{ value: currentRamUsage, name: 'GB' }]
            },
        ]
    };
};

export default GaugeRamChartComponent;
