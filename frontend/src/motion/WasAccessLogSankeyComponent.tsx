import './SliderComponent.css'; // 스타일 파일을 불러옵니다.
import '../page/root/NodeCpuUsageChart.css'
import AccessCountChart from "../page/root/AccessCountChart";
import {useState} from "react";
import React from 'react';
import SankeyChart from "../page/root/SankeyChart";

const RollingBanner: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0); // 현재 콘텐츠의 인덱스를 상태로 관리합니다.

    // 다음 콘텐츠로 넘어가는 함수
    const nextContent = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 2 ? 0 : prevIndex + 1)); // CPUUsageChart 컴포넌트가 세 개이므로 인덱스는 0, 1, 2입니다.
    };

    // 이전 콘텐츠로 넘어가는 함수
    const prevContent = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? 2 : prevIndex - 1)); // CPUUsageChart 컴포넌트가 세 개이므로 인덱스는 0, 1, 2입니다.
    };

    return (
        <div style={{width: '100%', height: '400px', alignContent: 'center'}}>
            <SankeyChart param="전달할 파라미터 값1"/>
        </div>

    );
};

export default RollingBanner;
