import React, { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

const hours = [
    '12a', '1a', '2a', '3a', '4a', '5a', '6a',
    '7a', '8a', '9a', '10a', '11a',
    '12p', '1p', '2p', '3p', '4p', '5p',
    '6p', '7p', '8p', '9p', '10p', '11p'
];

const days = [
    'Host 1', 'Host 2'
];

const data = [
    [0, 0, 5], [0, 1, 1], [0, 2, 0], [0, 3, 0], [0, 4, 0], [0, 5, 0], [0, 6, 0], [0, 7, 0], [0, 8, 0], [0, 9, 0],
    [0, 10, 0], [0, 11, 2], [0, 12, 4], [0, 13, 1], [0, 14, 1], [0, 15, 3], [0, 16, 4], [0, 17, 6], [0, 18, 4], [0, 19, 4],
    [0, 20, 3], [0, 21, 3], [0, 22, 2], [0, 23, 5], [1, 0, 7], [1, 1, 0], [1, 2, 0], [1, 3, 0], [1, 4, 0], [1, 5, 0],
    [1, 6, 0], [1, 7, 0], [1, 8, 0], [1, 9, 0], [1, 10, 5], [1, 11, 2], [1, 12, 2], [1, 13, 6], [1, 14, 9], [1, 15, 11],
    [1, 16, 6], [1, 17, 7], [1, 18, 8], [1, 19, 12], [1, 20, 5], [1, 21, 5], [1, 22, 7], [1, 23, 2]
];

const HostsUsageChart: React.FC = () => {
    const [chartOptions, setChartOptions] = useState<any>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        const series = days.map((day, idx) => ({
            name: day,
            type: 'scatter',
            data: data.filter(d => d[0] === idx).map(d => [d[1], d[2]]),
            symbolSize: function (dataItem) {
                return dataItem[1] * 4;
            }
        }));

        const options = {
            tooltip: {
                position: 'top'
            },
            legend: {
                data: days,
                top: '5%'
            },
            grid: {
                left: '3%',
                right: '3%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: hours,
                boundaryGap: false,
                axisLabel: {
                    interval: 2
                }
            },
            yAxis: {
                type: 'value'
            },
            series: series
        };

        setChartOptions(options);
    }, []);

    if (!chartOptions) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ width: '100%', height: '250px' }}>
            <ReactECharts
                ref={chartRef}
                option={chartOptions}
                style={{ height: '100%', width: '100%' }}
            />
        </div>
    );
};

export default HostsUsageChart;
