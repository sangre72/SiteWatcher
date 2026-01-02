import React, { useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import 'echarts-gl';
import sampleData from './korea.json';
import './wave.css';

const Scatter3D: React.FC = () => {
    const symbolSize = 3.5;

    // sampleData.source를 시간순으로 정렬합니다.
    const sortedData = sampleData.source.sort((a, b) => new Date(a.Year).getTime() - new Date(b.Year).getTime());

    const option = {
        grid3D: {},
        xAxis3D: {
            type: 'category',
            name: 'Menu'
        },
        yAxis3D: {
            name: 'Life Expectancy'
        },
        zAxis3D: {
            name: 'Count'
        },
        dataset: {
            dimensions: [
                'Menu',
                'Life Expectancy',
                'Count',
                'Country',
                { name: 'Year', type: 'ordinal' }
            ],
            source: sortedData
        },
        series: [
            {
                type: 'scatter3D',
                symbolSize: symbolSize,
                encode: {
                    x: 'Menu',
                    y: 'Life Expectancy',
                    z: 'Count',
                    tooltip: [0, 1, 2, 3, 4]
                }
            }
        ]
    };

    const onChartReady = (chartInstance: any) => {
        console.log('Chart is ready');
        // 추가적으로 chartInstance를 사용하여 설정할 것이 있으면 이곳에 추가합니다.
    };

    return (
        <div style={{ width: '100%', height: '400px', alignContent: 'center', marginTop: '6px' }}>
            <ReactECharts
                option={option}
                onChartReady={onChartReady}
                style={{ height: '380px', width: '100%' }}
            />
        </div>
    );
};

export default Scatter3D;
