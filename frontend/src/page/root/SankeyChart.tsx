import React, { FC, useEffect, useState } from 'react';
import { Chart } from 'react-google-charts';
import './wave.css'
import {host_info} from "../../HostInfo";

interface CPUUsageChartProps {
    param: string; // 예시로 사용될 수 있는 추가 파라미터
}

interface HostData {
    h: string;
    c: { cd: string; ct: number }[];
}

const statusCodes: { [code: string]: string } = {
    "200": "200 OK", //요청이 성공적이었으며 서버가 요청을 완료했습니다.(요청 성공, 콘텐츠 제공됨, 요청 성공, 동적 콘텐츠 처리 및 제공됨.)
    "400": "400 Bad Request", //요청이 구문적으로 잘못되었거나 유효하지 않은 데이터를 포함합니다.(요청 구문이 잘못되었거나 유효하지 않은 데이터를 포함함., 요청 구문이 잘못되었거나 WAS 응용 프로그램에서 데이터 유효성 검사가 실패함.)
    "401": "401 Unauthorized", //클라이언트는 요청된 리소스에 액세스하기 위해 유효한 자격 증명으로 인증해야 합니다.(클라이언트가 유효한 자격 증명으로 인증해야 함., 클라이언트가 유효한 자격 증명으로 인증해야 하거나 WAS 인증 메커니즘이 오작동함.)
    "403": "403 Forbidden", //클라이언트가 요청된 리소스에 액세스할 권한이 없습니다.(클라이언트가 리소스에 액세스할 권한이 없음, 클라이언트가 리소스에 액세스할 권한이 없거나 WAS 구성이 액세스를 제한함.)
    "404": "404 Not Found", //요청된 리소스(예: 웹 페이지)를 서버에서 찾을 수 없습니다.(리소스(예: HTML 파일)를 서버에서 찾을 수 없음.,리소스(예: Java 서블릿, ASP.NET 페이지)를 WAS에서 찾을 수 없음.)
    "405": "503 Method Not Allowed", //요청에 사용된 HTTP 메서드(예: GET, POST)가 요청된 리소스에서 지원되지 않습니다.(HTTP 메서드(예: GET, POST)가 리소스에 대해 지원되지 않음., HTTP 메서드가 리소스에 대해 지원되지 않거나 WAS 구성이 특정 메서드를 제한함.)
    "410": "410 Gone", //요청된 리소스가 더 이상 사용할 수 없고 영구적으로 제거되었습니다.(리소스(예: HTML 파일)가 더 이상 사용할 수 없고 영구적으로 제거되었습니다., 리소스(예: Java 서블릿, ASP.NET 페이지)가 더 이상 사용할 수 없고 영구적으로 제거되었습니다.)
    "500": "500 Internal Server Error", //서버에서 예상치 못한 오류가 발생하여 요청을 완료할 수 없습니다.(서버에서 예상치 못한 오류 발생., WAS에서 예상치 못한 오류 발생, 응용 프로그램 코드, 데이터베이스 문제 또는 WAS 구성과 관련될 수 있음.)
    "503": "503 Service Unavailable", //서버가 현재 사용할 수 없고 요청을 완료할 수 없습니다.(서버가 일시적으로 사용할 수 없음., WAS가 일시적으로 사용할 수 없거나 과부하 발생.)
};

// 데이터 변환 함수
const transformInputData = (data: HostData[]): Array<Array<string | number>> => {
    const output: Array<Array<string | number>> = [['From', 'To', 'Weight']];
    data.forEach(item => {
        item.c.forEach(codeInfo => {
            output.push([item.h, statusCodes[codeInfo.cd]+" ("+codeInfo.ct +")" || codeInfo.cd, codeInfo.ct]);
        });
    });
    return output;
};

const SankeyChart: FC<CPUUsageChartProps> = ({ param }) => {
    const [chartData, setChartData] = useState<Array<Array<string | number>>>([['From', 'To', 'Weight']]);
    const [chartOptions, setChartOptions] = useState<any>({
        width: '100%',
        height: '360px',
        sankey: {
            label: {
                fontSize:26
            },
            node: { colors: [ '#5c843d', '#a61d4c', '#a61d4c'] },
            link: {
                colorMode: 'gradient',
                colors: ['#cbb69d', '#603913', '#c69c6e'],
                chartEvents:{
                    click: (event: any) => {
                        console.log('클릭 이벤트 발생:', event);
                    },
                    hoverIn: (event: any) => {
                        console.log('마우스 오버 이벤트 발생:', event);
                    },
                    hoverOut: (event: any) => {
                        console.log('마우스 아웃 이벤트 발생:', event);
                    },
                    // 추가 이벤트 콜백 함수 정의 가능
                }
            },
            tooltip: {
                isHtml: true, // HTML 툴팁 사용 설정
                trigger: 'selection' // 선택된 요소에 대해 툴팁 표시
            },
        }
    });

    useEffect(() => {
        try {
            const fetchCpuUsage = async () => {
                try {
                    const response = await fetch(`${host_info}/access-data?param=${param}`);
                    const data = await response.json();

                    if (data.result === "failed") {
                        console.log("Invalid data format : " + data);
                    } else {
                        if(data.length > 0){
                        const rawData: HostData[] = data;
                        const newData = transformInputData(rawData);
                        setChartData(newData);
                        }
                    }
                } catch (error) {
                    console.error("Fetching CPU usage failed:", error);
                }
            };

            const intervalId = setInterval(fetchCpuUsage, 3000); // 5초마다 데이터 가져오기
            fetchCpuUsage(); // 초기 로드

            return () => {
                clearInterval(intervalId); // 클린업 함수
            };
        }catch (error) {
            console.error(`Error fetching additional info for ${param}:`, error);
        }
    }, [param]); // param이 변경되면 useEffect 재실행


    return (
        <div style={{marginTop: '25px'}}>
            <Chart
                chartType="Sankey"
                width="100vp"
                height="340px"
                data={chartData}
                options={chartOptions}
            />
        </div>
    );
};
/*
className="flow-animation"
chartEvents={[
        {
            eventName: 'ready',
            callback: ({ chartWrapper, google }) => {
                const svg = document.querySelector('svg');
                const defs = svg.insertBefore(document.createElementNS('http://www.w3.org/2000/svg', 'defs'), svg.firstChild);
                const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                linearGradient.setAttribute('id', 'gradient');
                linearGradient.innerHTML = `<stop offset="5%" stop-color="#cbb69d" stop-opacity="0"/>
                                                        <stop offset="95%" stop-color="#603913" stop-opacity="1"/>`;
                defs.appendChild(linearGradient);
            }
        }
        ]}*/

export default SankeyChart;
