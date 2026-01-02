import React, { useState, useEffect } from 'react';

interface ToastMessageProps {
    position: 'left-top' | 'center-top' | 'right-top' |
        'left-middle' | 'center-middle' | 'right-middle' |
        'left-bottom' | 'center-bottom' | 'right-bottom';
}

const ToastMessage: React.FC<ToastMessageProps> = ({ position }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [timestamp, setTimestamp] = useState('');

    useEffect(() => {
        const now = new Date();
        setTimestamp(now.toLocaleTimeString());
        const timer = setTimeout(() => setIsVisible(false), 5000); // 5초 후에 페이드 아웃
        return () => clearTimeout(timer);
    }, []);

    function renderContent() {
        if (!isVisible) return null;
        return <div className={`toast show fadeOut position-${position}`} role="alert" aria-live="assertive"
                    aria-atomic="true">
            <div className="toast-header">
                <strong className="me-auto">Bootstrap</strong>
                <small>{timestamp}</small>
                <button type="button" className="btn-close ms-2 mb-1" aria-label="Close"
                        onClick={() => setIsVisible(false)}></button>
            </div>
            <div className="toast-body">
                Hello, world! This is a toast message.
            </div>
        </div>
    }

    return renderContent();
};

export default ToastMessage;
