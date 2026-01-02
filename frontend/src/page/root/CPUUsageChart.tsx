import {FC, useEffect, useState} from 'react';
import ApexCharts from 'react-apexcharts';
import {ApexOptions} from 'apexcharts';
import moment from "moment";
import React from 'react';
import {host_info} from "../../HostInfo";
// 작업 할 것들
// 엑스 시작위치 정의
// 엑스 끝까지 갔을경우 스크롤 처리
// 점 클릭시 노드 정보 오류
// 점 클릭시 같은 노드 확대 표기
// 점 클릭시 상세 메뉴이동 링크

// 다른건 실시간 카드 정보

// 문제점 : 데이터가 많아지면 기능 동작이 느려짐 몹쓸정도
interface CPUUsage {
    node: string;
    x: string;
    y: number;
}

interface SeriesData {
    name: string;
    data: { x: number; y: number }[];
}


const chartSize = 2;
const draw_interval = 5000;
const animation_interval = 1000;
const calcSeconds = (chartSize * 60 * 1000);
const keepCount = calcSeconds / draw_interval * -1;
// 전체 길이
const startTime = new Date().getTime() - (chartSize * 60 * 1000); // 현재 시간으로부터 5분 전
const endTime = new Date().getTime() + (0 * 60 * 1000); // 현재 시간으로부터 5분 후

interface CPUUsageChartProps {
    param: string; // 예시로 문자열 타입의 param을 받도록 설정
}

const CPUUsageChart: FC<CPUUsageChartProps> = () => {
    const [series, setSeries] = useState<SeriesData[]>([]);
    const [chart2Options, setChart2Options] = useState<ApexOptions>({
        chart: {
            type: 'scatter',
            width: '100%',
            height: 250,
            zoom: {
                enabled: false // 줌 기능 비활성화
            },
            animations: {
                enabled: false,
                easing: 'linear',
                dynamicAnimation: {
                    speed: animation_interval,
                }
            }
        },
        xaxis: {
            type: 'datetime',
            min: startTime,
            max: endTime,
            tickAmount: 50,
            labels: {
                formatter: function (value) {
                    return moment(value).format('ss');
                }
                , trim: false, // Prevents labels from being trimmed
                minHeight: 30 // Ensures there's enough space for labels, adjust as needed
            }
        },
        yaxis: {
            min: 0
        },
        legend: {
            position: 'top',
            horizontalAlign: 'center',
            offsetY: 30, // Adjusts legend position to prevent clipping of the chart's top
            floating: true
        },
        grid: {
            padding: {
                top: 70
            }
        },
        tooltip: {
            enabled: true,
            x: {
                format: 'dd MMM yyyy HH:mm:ss'
            },
            y: {
                formatter: function (val) {
                    return `${val}%`;
                }
            },
            marker: {
                show: false
            }
        },
        markers: {
            size: 2
        }
    });

// 데이터 포인트의 y 값에 따라 색상을 결정하는 함수입니다.
    const getColorForValue = (value: number) => {
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
        return data.map(({x, y}) => ({
            x: new Date(x).getTime(), // 시간 변환
            y, // CPU 사용률
            fillColor: getColorForValue(y), // 데이터 포인트의 배경색 설정
            strokeColor: getColorForValue(y), // 데이터 포인트의 테두리 색상 설정
        }));
    };

    const initializeData = async () => {
        try {
            const response = await fetch(host_info + '/cpu-usage-nodes');
            const initialData: CPUUsage[] = await response.json();
            // CPUUsage 데이터를 SeriesData 형식으로 변환하고 색상 설정
            const preparedData = prepareSeriesData(initialData);
            const initialSeriesData: SeriesData[] = initialData.map(cpuUsage => ({
                name: cpuUsage.node,
                data: preparedData,
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

                const response = await fetch(host_info + '/cpu-usage-nodes');
                const rawData = await response.json();
                // 현재 시간 기준 15분 전의 타임스탬프 계산
                const fifteenMinutesAgo = new Date().getTime() - (chartSize * 60 * 1000);


                const latestDataTime = Math.max(...rawData.map((data: CPUUsage) => new Date(data.x).getTime()));

                // 차트 옵션 업데이트 로직
                setChart2Options(prevOptions => ({
                    ...prevOptions,
                    xaxis: {
                        ...prevOptions.xaxis,
                        min: latestDataTime - (chartSize * 60 * 1000), // 현재 시간으로부터 5분 전
                        max: latestDataTime, // 최신 데이터의 시간
                    },
                }));

                const updatedSeriesData = series.map((seriesItem) => {
                    const matchingData = rawData.find((dataItem: CPUUsage) => dataItem.node === seriesItem.name);

                    // 일치하는 데이터가 있는 경우, 해당 데이터에 대한 새로운 데이터 포인트 배열을 생성합니다.
                    const newDataPoints = matchingData ? prepareSeriesData([matchingData]) : [];
                    const filteredDataPoints = [...seriesItem.data, ...newDataPoints].filter(dataPoint => dataPoint.x > fifteenMinutesAgo).slice(keepCount);
                    ;
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
    return <ApexCharts options={chart2Options} series={series} type="scatter" height={250} width="100%" />;
};

export default CPUUsageChart;
