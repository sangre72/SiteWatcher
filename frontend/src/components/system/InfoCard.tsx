import React, { useState, useEffect } from 'react';
import './blink.css';

interface InfoCardProps {
    title: string;
    value: string | number;
}

interface CardTextProps {
    text: string;
}
// React.memo를 사용하여 CardText 컴포넌트 정의
const CardText: React.FC<CardTextProps> = (({ text }) => {
    return <p>{text}</p>;
});



const InfoCard: React.FC<InfoCardProps> = ({ title, value }) => {
    const [blink, setBlink] = useState(false);
    useEffect(() => {
        if (value) {
            setBlink(true);
            const timer = setTimeout(() => {
                setBlink(false);
            }, 1000);  // 1초 후에 깜빡임 효과를 제거합니다.
            return () => clearTimeout(timer);
        }
    }, [value]);  // value가 변경될 때마다 효과를 적용합니다.

    return (
            <div className="card text-white bg-warning mb-3">
                <div className="card-header">{title}</div>
                <div className="card-body">
                    <h5 className={`card-title ${blink ? 'blink' : ''}`}><CardText text={value.toString()} /></h5>
                </div>
            </div>
    );
};

export default InfoCard;