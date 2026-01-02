import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import 'echarts-gl';
import './wave.css';
import sampleData from './bar3d.json';

const Bar3D: React.FC = () => {
    const [chartOptions, setChartOptions] = useState<any>(null);

    useEffect(() => {
        const option = {
            title: {
                text: 'SQL 실행 정보',
                subtext: 'Realtime running',
                left: 'right'
            },
            tooltip: {
                trigger: 'item',
                alwaysShowContent: true,
                formatter: (params: { data: any; }) => {
                    const data = params.data;
                    return `
                            Coordinates: (${data.value[0]}, ${data.value[1]}, ${data.value[2]})<br />
                            Description: ${data.description}<br />
                            <a href="${data.link}" target="_blank">More Info</a>
                            `;
                }
            },
            visualMap: {
                max: 20,
                inRange: {
                    color: [
                        '#313695',
                        '#4575b4',
                        '#74add1',
                        '#abd9e9',
                        '#e0f3f8',
                        '#ffffbf',
                        '#fee090',
                        '#fdae61',
                        '#f46d43',
                        '#d73027',
                        '#a50026'
                    ]
                }
            },
            xAxis3D: {
                type: 'category',
                data: sampleData.days
            },
            yAxis3D: {
                type: 'category',
                data: sampleData.hours
            },
            zAxis3D: {
                type: 'value'
            },
            grid3D: {
                boxWidth: 200,
                boxDepth: 100,
                light: {
                    main: {
                        intensity: 0.6
                    },
                    ambient: {
                        intensity: 0.3
                    }
                }
            },
            series: [
                {
                    type: 'bar3D',
                    data: sampleData.data.map(function (item: any) {
                        return {
                            value: item.coordinates,
                            description: item.description,
                            link: item.link
                        };
                    }),
                    shading: 'color',
                    label: {
                        show: false,
                        fontSize: 12,
                        borderWidth: 1
                    },
                    itemStyle: {
                        opacity: 0.7
                    },
                    emphasis: {
                        label: {
                            fontSize: 16,
                            color: '#900'
                        },
                        itemStyle: {
                            color: '#900'
                        }
                    }
                }
            ]
        };

        setChartOptions(option);
    }, []);

    return (
        <div style={{ width: '100%', height: '300px' }}>
            {chartOptions && <ReactECharts option={chartOptions} style={{ width: '100%', height: '100%' }} />}
        </div>
    );
};

export default Bar3D;
