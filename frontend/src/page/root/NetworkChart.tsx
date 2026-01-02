import React from 'react';
import ReactECharts from 'echarts-for-react';
import networkData from './networkData.json';
import './wave.css';

const NetworkGraph: React.FC = () => {
    const option = {
        title: {
            text: '유저 접속 경로 정보',
            subtext: 'last 10 minutes',
            left: 'right'
        },
        tooltip: {},
        legend: {
            data: ['Menu', 'Page', 'IP', 'Time']
        },
        series: [
            {
                type: 'graph',
                layout: 'force',
                symbolSize: 10,
                roam: true,
                label: {
                    show: true
                },
                edgeSymbol: ['none', 'arrow'],
                edgeSymbolSize: [1, 1],
                force: {
                    repulsion: 50,
                    edgeLength: [50, 100]
                },
                categories: [
                    { name: 'Menu' },
                    { name: 'Page' },
                    { name: 'IP' },
                    { name: 'Time' }
                ],
                data: networkData.nodes,
                links: networkData.links,
                lineStyle: {
                    opacity: 1.3,
                    width: 1,
                    curveness: 0.2
                }
            }
        ]
    };

    return (
        <div style={{ width: '100%', height: '300px' }}>
            <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        </div>
    );
};

export default NetworkGraph;
