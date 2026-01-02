import React, { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import sampleData  from "./masterPainterColorChoice.json";
import axios from 'axios';

const fetchLocalData = async () => {
    const response = await axios.get('./masterPainterColorChoice.json');
    return response.data;
};

const SliderBubbleComponent: React.FC = () => {
    const [chartOptions, setChartOptions] = useState<any>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        const loadData = async () => {
            const json = sampleData; //await fetchLocalData();
            const data = json[0].x.map((x: string, idx: number) => [+x, +json[0].y[idx]]);

            const options = {
                title: {
                    text: '실시간 접속 정보',
                    subtext: 'last 10 minutes',
                    left: 'right'
                },
                xAxis: {
                    type: 'value',
                    splitLine: {
                        show: true
                    },
                    scale: true,
                    splitNumber: 5,
                    max: 'dataMax',
                    axisLabel: {
                        formatter: function (val: number) {
                            return val + 's';
                        }
                    }
                },
                yAxis: {
                    type: 'value',
                    min: 0,
                    max: 400,
                    interval: 60,
                    name: 'Hue',
                    splitLine: {
                        show: false
                    }
                },
                series: [
                    {
                        name: 'scatter',
                        type: 'scatter',
                        symbolSize: function (val: any, param: any) {
                            return json[0].marker.size[param.dataIndex] / json[0].marker.sizeref;
                        },
                        itemStyle: {
                            color: function (param: any) {
                                return json[0].marker.color[param.dataIndex];
                            }
                        },
                        data: data
                    }
                ]
            };

            setChartOptions(options);
        };

        loadData();
    }, []);

    if (!chartOptions) {
        return <div>Loading...</div>;
    }

    return (

        <div style={{ width: '100%', height: '400px', alignContent: 'center'}}>
            <ReactECharts
                ref={chartRef}
                option={chartOptions}
                style={{ height: '400px', width: '100%' }}
            />
        </div>
    );
};

export default SliderBubbleComponent;
