import React, {useEffect, useState} from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { darkenColor, getBrightness } from '../../../components/utils/colorUtils';

const NavigationBar = () => {
    const [fontColor, setFontColor] = useState('#ffffff'); // 기본 폰트 색상을 흰색으로 설정

    useEffect(() => {
        const navbar = document.querySelector('.navbar'); // 네비게이션 바 선택
        if (navbar) {
            const style = window.getComputedStyle(navbar);
            const bgColor = style.backgroundColor; // 배경색 가져오기
            // 배경색의 밝기 계산
            const brightness = getBrightness(bgColor);
            // 밝기에 따라 폰트 색상 조정
            const color = brightness > 128 ? '#333333' : '#ffffff'; // 밝기가 128을 초과하면 짙은 회색, 그렇지 않으면 흰색
            setFontColor(color);
        }
    }, []);

    return (
        <Navbar bg="primary" expand="lg" variant="dark" fixed="top">
            <Container>
               {/* <Navbar.Brand href="/">트리 관리</Navbar.Brand>*/}
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <LinkContainer to="/home" style={{ color: fontColor }}>
                            <Nav.Link>홈</Nav.Link>
                        </LinkContainer>
{/*                        <LinkContainer to="/treeview" style={{ color: fontColor }}>
                            <Nav.Link>TreeView</Nav.Link>
                        </LinkContainer>*/}
{/*                        <LinkContainer to="/db-info" style={{ color: fontColor }}>
                            <Nav.Link>DB Information</Nav.Link>
                        </LinkContainer>*/}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default NavigationBar;
