import React from 'react';

interface TabProps {
    id: string;
    name: string;
    active: boolean;
    onSelect: (id: string) => void;
    onClose: (id: string, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const Tab: React.FC<TabProps> = ({ id, name, active, onSelect, onClose }) => {
    return (
        <li className="nav-item" role="presentation">
            <div className="d-flex align-items-center justify-content-between" style={{width: '100%'}}>
                <a
                    className={`nav-link ${active ? 'active' : ''}`}
                    href="#home"
                    aria-selected={active}
                    role="tab"
                    onClick={() => onSelect(id)}
                >
                    {name}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={(event) => {
                            event.stopPropagation();
                            onClose(id, event);
                        }}
                        aria-label="Close"
                    ></button>
                </a>
            </div>
        </li>
    );
};

export default Tab;
