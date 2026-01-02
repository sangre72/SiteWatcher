import React, { useState } from 'react';
import CPUUsageChart from '../page/root/CPUUsageChart'; // CPUUsageChart 컴포넌트를 불러옵니다.
import './SliderComponent.css'; // 스타일 파일을 불러옵니다.
import '../page/root/NodeCpuUsageChart.css'

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
        <div className="rolling-banner">
            <button className="btn btn-outline-secondary" onClick={prevContent}>◀</button>
            <div className="rolling-content">
                {currentIndex === 0 && <div style={{width: '100%', height: '280px'}}><CPUUsageChart param="전달할 파라미터 값1" /></div>}
                {currentIndex === 1 && <div style={{width: '100%', height: '280px'}}><CPUUsageChart param="전달할 파라미터 값2" /></div>}
                {currentIndex === 2 && <div style={{width: '100%', height: '280px'}}><CPUUsageChart param="전달할 파라미터 값3" /></div>}
            </div>
            <button className="btn btn-outline-secondary" onClick={nextContent}>▶</button>
        </div>
    );
};

export default RollingBanner;
