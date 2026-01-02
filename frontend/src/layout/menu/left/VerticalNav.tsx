import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import { darkenColor, getBrightness } from '../../../components/utils/colorUtils';
import { GPT } from '../utility/GPT'
import ClickDivInfo from "../../../dom/ClickDivInfo";
import { Nav, Navbar } from 'react-bootstrap';

interface VerticalNavProps {
    onMenuSelect: (menuName: string) => void; // 메뉴 선택 시 호출될 함수
}

const VerticalNav: React.FC<VerticalNavProps> = ({ onMenuSelect }) => {
    const [bgColor, setBgColor] = useState('');
    const [fontColor, setFontColor] = useState('#ffffff');
    const [activeMenu, setActiveMenu] = useState<string | null>(null); // 현재 활성화된 메뉴를 추적하는 상태
    const [isHomeClicked, setIsHomeClicked] = useState(false);


    const handleMenuClick = (menuName: string) => {
        //setActiveMenu(menuName); // 클릭된 메뉴를 활성화된 메뉴로 설정
        onMenuSelect(menuName); // 부모 컴포넌트로 선택된 메뉴 이름 전달
    };

    useEffect(() => {
        // 이벤트 핸들러 정의
        const handleTabRemoved = (event: CustomEvent) => {
            const removedTabName = event.detail.removedTabName;
            setActiveMenu(removedTabName)
        };
        // 커스텀 이벤트 'tabRemoved'에 대한 리스너 추가
        window.addEventListener('tabRemoved', handleTabRemoved as EventListener);
        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            window.removeEventListener('tabRemoved', handleTabRemoved as EventListener);
        };
    }, [setActiveMenu]); // 의존성 배열에 setActiveMenu 추가


    useEffect(() => {
        // 네비게이션 바의 배경색을 동적으로 가져오는 로직
        const navbar = document.querySelector('.navbar'); // 네비게이션 바 요소 선택
        if (navbar) {
            const navbarBgColor = window.getComputedStyle(navbar).backgroundColor;
            // RGB 색상을 HEX로 변환 (darkenColor 함수가 HEX 값을 요구하기 때문)
            const rgbMatch = navbarBgColor.match(/\d+/g);
            if (rgbMatch) {
                let [r, g, b] = rgbMatch.map(Number);
                let hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                // 배경색을 어둡게 조정하여 상태 업데이트
                setBgColor(darkenColor(hex, 4)); // 예: 배경색을 20% 어둡게 조정
            }
        }
    }, []);

    return (
        <div className="d-flex flex-column flex-shrink-0 p-3" style={{ minHeight: '100vh', backgroundColor: bgColor, color: fontColor }}>
            <Link to="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-decoration-none" style={{ color: fontColor }}>
                <span className="fs-4">My App</span>
            </Link>
            <hr />
            <Nav className="nav-pills flex-column mb-auto">
                {/* 각 Nav.Item의 active 상태를 조건부로 설정합니다. */}
                <LinkContainer to="/home" style={{ color: fontColor }} onClick={() => handleMenuClick('home')}
                               isActive={activeMenu === 'home'}>
                    <Nav.Link as="div">Home</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/hosts_management" style={{ color: fontColor }} onClick={() => handleMenuClick('hosts_management')}
                               isActive={activeMenu === 'hosts_management'}>
                    <Nav.Link as="div">hosts_management</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/image_search" style={{ color: fontColor }} onClick={() => handleMenuClick('image_search')}
                               isActive={activeMenu === 'image_search'}>
                    <Nav.Link as="div">image_search</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/text_search" style={{ color: fontColor }} onClick={() => handleMenuClick('text_search')}
                               isActive={activeMenu === 'text_search'}>
                    <Nav.Link as="div">text_search</Nav.Link>
                </LinkContainer>
                {/*<LinkContainer to="/sortable_tree" style={{ color: fontColor }} onClick={() => handleMenuClick('sortable_tree')}
                               isActive={activeMenu === 'sortable_tree'}>
                    <Nav.Link as="div">SortableTree</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/easy_ui_tree" style={{ color: fontColor }} onClick={() => handleMenuClick('easy_ui_tree')}
                               isActive={activeMenu === 'easy_ui_tree'}>
                    <Nav.Link as="div">easi-ui-tree</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/files" style={{ color: fontColor }} onClick={() => handleMenuClick('files')}
                               isActive={activeMenu === 'files'}>
                    <Nav.Link as="div">Files View</Nav.Link>
                </LinkContainer>*/}
                {/*<LinkContainer to="/db-info" style={{ color: fontColor }} onClick={() => handleMenuClick('db-info')}
                               isActive={activeMenu === 'db-info'}>
                    <Nav.Link as="div">Database Info</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/data-info" style={{ color: fontColor }} onClick={() => handleMenuClick('data-info')}
                               isActive={activeMenu === 'data-info'}>
                    <Nav.Link as="div">data Info</Nav.Link>
                </LinkContainer>*/}
                {/*<LinkContainer to="/learnDirectoryStructure" style={{ color: fontColor }} onClick={() => handleMenuClick('learnDirectoryStructure')}
                               isActive={activeMenu === 'learnDirectoryStructure'}>
                    <Nav.Link as="button">Learn directory(part.1)</Nav.Link>
                </LinkContainer>*/}

                <LinkContainer to="/xterm" style={{ color: fontColor }} onClick={() => handleMenuClick('xterm')}
                               isActive={activeMenu === 'xterm'}>
                    <Nav.Link as="div">xterm</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/rag" style={{ color: fontColor }} onClick={() => handleMenuClick('rag')}
                               isActive={activeMenu === 'rag'}>
                    <Nav.Link as="div">RAG</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/terminal" style={{ color: fontColor }} onClick={() => handleMenuClick('terminal')}
                               isActive={activeMenu === 'terminal'}>
                    <Nav.Link as="div">terminal</Nav.Link>
                </LinkContainer>
                {/*<LinkContainer to="/https_management" style={{ color: fontColor }} onClick={() => handleMenuClick('https_management')}
                               isActive={activeMenu === 'https_management'}>
                    <Nav.Link as="div">https_management</Nav.Link>
                </LinkContainer>*/}
                {/*LearningDirectoryStructure*/}
                {/* 추가적인 네비게이션 아이템 */}
                <GPT />
                <ClickDivInfo />
            </Nav>

        </div>
    );
};

export default VerticalNav;
