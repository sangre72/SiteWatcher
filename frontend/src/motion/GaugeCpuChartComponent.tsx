// src/components/GaugeChartComponent.tsx
import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

interface GaugeCpuChartComponentProps {
    cpuUsage: number;
}

const GaugeCpuChartComponent: React.FC<GaugeCpuChartComponentProps> = ({ cpuUsage }) => {
    const [chartOptions, setChartOptions] = useState<any>(getInitialOptions(cpuUsage));

    useEffect(() => {
        const updatedOptions = getInitialOptions(cpuUsage);
        setChartOptions(updatedOptions);
    }, [cpuUsage]);

    return (
        <div style={{ width: '100%', height: '500px' }}>
            <ReactECharts
                option={chartOptions}
                style={{ height: '100%', width: '100%' }}
            />
        </div>
    );
};

const getInitialOptions = (cpuUsage: number) => ({
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
            name: 'CPU Usage',
            type: 'gauge',
            min: 0,
            max: 100,
            splitNumber: 5,
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
            data: [{ value: cpuUsage, name: '%' }]
        },
    ]
});

export default GaugeCpuChartComponent;
