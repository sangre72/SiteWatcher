import React, { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import ecStat from 'echarts-stat';

const SliderBubbleComponent: React.FC = () => {
    const [chartOptions, setChartOptions] = useState<any>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        // 데이터 설정
        const data = [
            [96.24, 11.35],
            [33.09, 85.11],
            [57.6, 36.61],
            [36.77, 27.26],
            [20.1, 6.72],
            [45.53, 36.37],
            [110.07, 80.13],
            [72.05, 20.88],
            [39.82, 37.15],
            [48.05, 70.5],
            [0.85, 2.57],
            [51.66, 63.7],
            [61.07, 127.13],
            [64.54, 33.59],
            [35.5, 25.01],
            [226.55, 664.02],
            [188.6, 175.31],
            [81.31, 108.68]
        ];

        // 회귀 분석 수행
        const regression = ecStat.regression('polynomial', data, 3);
        regression.points.sort((a: any, b: any) => a[0] - b[0]); // x 축 기준으로 정렬

        // 옵션 설정
        const options = {
            title: {
                text: 'WAS 접속 추이',
                subtext: 'By ecStat.regression',
                sublink: 'https://github.com/ecomfe/echarts-stat',
                left: 'right',
                top: 16
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                }
            },
            xAxis: {
                splitLine: {
                    lineStyle: {
                        type: 'dashed'
                    }
                },
                splitNumber: 20
            },
            yAxis: {
                min: -40,
                splitLine: {
                    lineStyle: {
                        type: 'dashed'
                    }
                }
            },
            series: [
                {
                    name: 'scatter',
                    type: 'scatter',
                    data: data
                },
                {
                    name: 'line',
                    type: 'line',
                    smooth: true,
                    data: regression.points,
                    symbolSize: 0.1,
                    symbol: 'circle',
                    label: { show: true, fontSize: 16 },
                    labelLayout: { dx: -20 },
                    encode: { label: 2, tooltip: 1 }
                }
            ]
        };

        // 옵션 설정
        setChartOptions(options);
    }, []);

    if (!chartOptions) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ width: '100%', height: '300px' }}>
            <ReactECharts
                ref={chartRef}
                option={chartOptions}
                style={{ height: '100%', width: '100%' }}
            />
        </div>
    );
};

export default SliderBubbleComponent;
