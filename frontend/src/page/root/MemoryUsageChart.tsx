import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import {host_info} from "../../HostInfo";

const MemoryChartChart = () => {
    const options: ApexOptions = {
        chart: {
            type: 'radialBar',
            height: 200,
            animations: {
                enabled: true, // 애니메이션 활성화
                easing: 'easeinout', // 애니메이션 이징 설정
                speed: 100 // 애니메이션 속도 설정 (단위: 밀리초)
            }
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: {
                    margin: 0,
                    size: '65%',
                    background: '#fff',
                    position: 'front',
                    dropShadow: {
                        enabled: true,
                        top: 3,
                        left: 0,
                        blur: 4,
                        opacity: 0.24
                    }
                },
                track: {
                    background: '#e7e7e7',
                    strokeWidth: '100%',
                    margin: 5, // margin is in pixels
                },
                dataLabels: {
                    name: {
                        show: false,
                    },
                    value: {
                        offsetY: -2,
                        fontSize: '12px', // 폰트 크기 여기서 조절
                    }
                }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'horizontal',
                shadeIntensity: 0.5,
                gradientToColors: ['#ABE5A1'],
                inverseColors: true,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100]
            }
        },
        markers: {
            size: 1,
            colors: ['#FF4560'], // 여기서 마커 색상을 설정합니다.
            strokeColors: '#fff',
            strokeWidth: 1,
            hover: {
                size: 3,
            }
        },
        series: [75], // 사용량
        labels: ['Memory Usage'], // 레이블
    };

    const [memoryData, setMemoryData] = useState<{ total: number ; free: number }>({ total: 0, free: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(host_info + '/memory-usage-node');
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    const { total, free } = data[0];
                    setMemoryData({
                        total,
                        free
                    });
                } else {
                    console.error('Invalid data format:', data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData(); // 컴포넌트가 처음 마운트될 때 데이터 가져오기

        const intervalId = setInterval(fetchData, 1000); // 10초마다 데이터 가져오기

        // 컴포넌트가 언마운트되면 interval 정리
        return () => clearInterval(intervalId);
    }, []);

    // 프리 메모리의 퍼센트 계산
    const freeMemoryPercent = memoryData.free !== undefined && memoryData.total !== undefined ? (memoryData.free / memoryData.total) * 100 : 0;
    const usageMemoryPercent = memoryData.free !== undefined && memoryData.total !== undefined ? ((memoryData.total - memoryData.free) / memoryData.total) * 100 : 0;
    const freeMemory = memoryData.free;
    const usageMemory = memoryData.free !== undefined && memoryData.total !== undefined ? ((memoryData.total - memoryData.free))  : 0;


    return (
        <div>
            <Chart
                options={options}
                series={[Math.round(usageMemoryPercent * 100)/100]}
                type="radialBar"
                height={220}
            />
            <h4 style={{  marginTop: '30px', textAlign: 'center', fontSize: '12px' }}>Total: {memoryData.total}GB / Free: {freeMemory}GB</h4>
        </div>
    );
};

export default MemoryChartChart;
