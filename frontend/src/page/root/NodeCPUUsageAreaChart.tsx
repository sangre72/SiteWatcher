import React, {useEffect, useRef, useState} from 'react';
import ApexCharts from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

import moment from "moment"
import {host_info} from '../../HostInfo';

// 작업 할 것들
// 엑스 종료위치 정의
// 상세 메뉴이동 링크 정의
// 다른건 실시간 카드 정보
// x 축으로 시간을 많이 주는건 흠. 에러나기 쉽상이내
// 같은 시간을 주고 시간을 짧게 주는건
// 문제점 : 데이터가 많아지면 기능 동작이 느려짐 몹쓸정도
interface CPUUsage {
    node: string;
    x: string;
    y: number;
}

interface SeriesData {
    name: string;
    data: { x: number; y: number; }[];
}
const width = 200;
const chartSize = 0.5; // minutes
const draw_interval = 2000;
const animation_interval = 1000;
const calcSeconds = (chartSize * 60 * 1000);
const keepCount = calcSeconds / draw_interval * 1.2 * -1 ;
const startTime = new Date().getTime() - (chartSize * 60 * 1000); // 현재 시간으로부터 5분 전
const endTime = new Date().getTime(); // 현재 시간으로부터 5분 후

const pointColorUse = true;

const NodeCPUUsageChart: React.FC = () => {
    const [series, setSeries] = useState<SeriesData[]>([]);
    const [chart2Options, setChart2Options] = useState<ApexOptions>({
        colors: ['#FF4560', '#CFCFEF'],
        chart: {
            type: 'area',
            zoom: {
                enabled: false // 줌 기능 비활성화
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            colors: ['#FF4560','#CFCFEF'],
            width: 2, // 라인의 굵기를 1px로 설정
            curve: 'smooth',
        },
        fill: {
            colors: ['#FF4560', '#CFCFEF'] // 여기에 원하는 색상 코드를 배열로 설정
        },
        markers: {
            size: 1,
            strokeWidth: 1,
            hover: {
                size: 3,
            }
        },
        xaxis: {
            type: 'datetime',
            min: startTime,
            max: endTime,
            tickAmount: 6, // 시작과 종료 포인트만 표기하기 위해 2로 설정
            labels: {
                formatter: function (value, index) {
                    // index 파라미터를 활용해 첫 번째와 마지막 라벨만 커스텀하여 표시
                    return moment(value).format('mm:ss'); // 시작점 라벨
                }
            }
        },
        yaxis: {
            min: 0,
            max: 100
        },
        tooltip: {
            enabled: true,
            x: {
                format: 'dd MM yyyy HH:mm:ss'
            },
            y: {
                formatter: function(val) {
                    return `${val}%`;
                }
            },
            marker: {
                show: false
            }
        },
    });

    // 데이터 포인트의 y 값에 따라 색상을 결정하는 함수입니다.
    const getColorForValue = (value: number) => {
        if(!pointColorUse) return '#FFD700'; // 기본 색상
        if (value >= 90) return '#FF4560'; // 짙은 붉은색
        if (value >= 80) return '#C55300'; // 짙은 핑크색
        if (value >= 70) return '#FF8C00'; // 짙은 핑크색
        if (value >= 60) return '#FFA500'; // 짙은 핑크색
        if (value >= 50) return '#FFD700'; // 짙은 핑크색
        if (value >= 40) return '#6B8E23'; // 짙은 핑크색
        if (value <= 20) return '#ABEBC6';  // 밝은 초록색
        if (value <= 10) return '#ADD8E6';  // 밝은 파랑색
        return '#00E396'; // 기본 색상
    };

    // rawData의 각 데이터 포인트에 대해 색상을 적용하는 함수입니다.
    const prepareSeriesData = (data: CPUUsage[]) => {
        return data.map(({ x, y }) => ({
            x: new Date(x).getTime(), // 시간 변환
            y, // CPU 사용률
            strokeColor: getColorForValue(y), // 데이터 포인트의 테두리 색상 설정
        }));
    };

    const chartContainerRef = useRef<HTMLDivElement>(null); // 부모 컨테이너의 ref

    useEffect(() => {
        const resizeChart = () => {
            if (chartContainerRef.current) {
                const height = chartContainerRef.current.clientHeight;
                setChart2Options(prevOptions => ({
                    ...prevOptions,
                    chart: {
                        ...prevOptions.chart,
                        height: height // 부모 컨테이너의 높이로 차트 높이 설정
                    }
                }));
            }
        };

        // 초기 실행 및 리사이즈 이벤트에 대한 핸들러 등록
        resizeChart();
        window.addEventListener('resize', resizeChart);

        // cleanup
        return () => {
            window.removeEventListener('resize', resizeChart);
        };
    }, []);
    const initializeData = async () => {
        try {
            const response = await fetch(host_info + '/cpu-usage-node');
            const initialData: CPUUsage[] = await response.json();
            // CPUUsage 데이터를 SeriesData 형식으로 변환하고 색상 설정
            const preparedData = prepareSeriesData(initialData);
            const initialSeriesData: SeriesData[] = initialData.map(cpuUsage => ({
                name: cpuUsage.node,
                data: preparedData.map(dataPoint => ({
                    ...dataPoint,
                })),
            }));
            setSeries(initialSeriesData);
        } catch (error) {
            console.error("Fetching initial CPU usage failed:", error);
        }
    };

    useEffect(() => {
        initializeData();
    }, []);

    useEffect(() => {
        const fetchCpuUsage = async () => {
            try {
                const response = await fetch(host_info + '/cpu-usage-node');
                const rawData = await response.json();
                // 현재 시간 기준 15분 전의 타임스탬프 계산
                const fifteenMinutesAgo = new Date().getTime() - ((chartSize+1) * 60 * 1000);
                const latestDataTime = Math.max(...rawData.map((data:CPUUsage) => new Date(data.x).getTime()));
                // 차트 옵션 업데이트 로직
                setChart2Options(prevOptions => ({
                    ...prevOptions,
                    xaxis: {
                        ...prevOptions.xaxis,
                        min: latestDataTime - ((chartSize) * 60 * 1000), // 현재 시간으로부터 5분 전
                        max: latestDataTime, // 최신 데이터의 시간
                    },
                }));

                const updatedSeriesData = series.map((seriesItem) => {
                    const matchingData = rawData.find((dataItem : CPUUsage)=> dataItem.node === seriesItem.name);

                    // 일치하는 데이터가 있는 경우, 해당 데이터에 대한 새로운 데이터 포인트 배열을 생성합니다.
                    const newDataPoints = matchingData ? prepareSeriesData([matchingData]) : [];
                    const filteredDataPoints = [...seriesItem.data, ...newDataPoints]
                        .filter(dataPoint => dataPoint.x > fifteenMinutesAgo)
                        .slice(keepCount)
                        .map(dataPoint => {
                            return {
                                ...dataPoint,
                                fillColor: "#ffffff"/* 새로운 색상 */,
                            };
                        });
                    // 기존 시리즈 데이터에 새로운 데이터 포인트를 추가합니다.
                    return {
                        ...seriesItem,
                        data: filteredDataPoints,
                    };
                });
                setSeries(updatedSeriesData);
            } catch (error) {
                console.error("Fetching CPU usage failed:", error);
            }
        };
        const intervalId = setInterval(fetchCpuUsage, draw_interval); // 5초마다 데이터 가져오기

        return () => {
            clearInterval(intervalId);
        }
    }, [series]); // series를 의존성 배열에 추가해야합니다.
    return (
        <div ref={chartContainerRef}>
            <ApexCharts options={chart2Options} series={series} type="area"  />
        </div>
    );
};

export default NodeCPUUsageChart;
