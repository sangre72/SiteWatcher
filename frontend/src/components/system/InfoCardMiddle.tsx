import React, { useState, useEffect } from 'react';
import './blink.css';

interface InfoCardProps {
    title: string;
    value: string | number;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, value }) => {
    const [blink, setBlink] = useState(false);

/*
    useEffect(() => {
        if (value) {
            setBlink(true);
            const timer = setTimeout(() => {
                setBlink(false);
            }, 1000);  // 1초 후에 깜빡임 효과를 제거합니다.
            return () => clearTimeout(timer);
        }
    }, [value]);  // value가 변경될 때마다 효과를 적용합니다.
*/

    function escapeHtml(text: string) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, "<br><br>")
            .replace(/ +/g, '\t')
            //.replace(/:\s/g, "<br>")
            ;
    }

    return (
            <div className="card text-white bg-primary mb-3" style={{height: '500px'}}>
                <div className="card-header" style={{fontStyle: 'italic', height: '39px'}}>{title}</div>
                <div className="card-body">
                    <h6
                        className={`card-title ${blink ? 'blink' : ''}`}
                        dangerouslySetInnerHTML={{
                            __html: escapeHtml(value.toString())
                        }}
                    >
                    </h6>
                </div>
            </div>
    );
};

export default InfoCard;