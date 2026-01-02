/**
 * App Component
 * MUI Tab 기반 메인 애플리케이션
 */

import React, { useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, Toolbar, Typography } from '@mui/material';

import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import TabBar from './components/common/TabBar';
import { MenuProvider } from './react-resource-share/MenuContext';
import { HostProvider } from './HostProvider';
import { AuthProvider } from './contexts/AuthContext';
import { useTabManager } from './hooks/useTabManager';

// Pages & Components
import HomePage from './page/root/Homepage';
import XTerm from './components/utils/XTerm_example';
import Terminal from './components/utils/Terminal';
import RAG from './components/utils/RAG';
import Hosts_management from './components/utils/hosts_management';
import ImageSearch from './components/ai/ImageSearch';
import TextSearch from './components/ai/TextSearch';
// Multi Board System
import BoardList from './components/board/BoardList';
import PostList from './components/board/PostList';
import PostGallery from './components/board/PostGallery';
import PostView from './components/board/PostView';
import PostForm from './components/board/PostForm';
// Admin
import BoardManagement from './components/admin/BoardManagement';
import BoardForm from './components/admin/BoardForm';
import MenuManager from './components/admin/menu/MenuManager';
import TenantManagement from './components/admin/TenantManagement';
import CategoryManagement from './components/admin/CategoryManagement';
// Auth
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';

const DRAWER_WIDTH = 260;

// 메인 콘텐츠 컴포넌트 (탭 시스템 포함)
const MainContent: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(true);
  const { tabs, activeIndex, addTab, selectTab, closeTab, closeAllTabs, closeOtherTabs } =
    useTabManager({ defaultPath: '/home' });

  const handleDrawerToggle = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const handleMenuSelect = useCallback(
    (menuName: string) => {
      addTab(menuName);
    },
    [addTab]
  );

  // 현재 경로에 따른 컴포넌트 렌더링
  const renderContent = () => {
    if (tabs.length === 0) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: 400,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            좌측 메뉴에서 항목을 선택하세요
          </Typography>
        </Box>
      );
    }

    return (
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/image_search" element={<ImageSearch />} />
        <Route path="/text_search" element={<TextSearch />} />
        <Route path="/terminal" element={<Terminal />} />
        <Route path="/xterm" element={<XTerm />} />
        <Route path="/rag" element={<RAG />} />
        <Route path="/hosts_management" element={<Hosts_management />} />
        <Route path="/boards" element={<BoardList />} />
        <Route path="/boards/:boardCode" element={<PostList />} />
        <Route path="/boards/:boardCode/posts/:postId" element={<PostView />} />
        <Route path="/boards/:boardCode/write" element={<PostForm />} />
        <Route path="/boards/:boardCode/posts/:postId/edit" element={<PostForm />} />
        <Route path="/boards/:boardCode/gallery" element={<PostGallery />} />
        {/* Admin Routes */}
        <Route path="/admin/boards" element={<BoardManagement />} />
        <Route path="/admin/boards/new" element={<BoardForm />} />
        <Route path="/admin/boards/:boardCode/edit" element={<BoardForm />} />
        <Route path="/admin/boards/:boardCode/categories" element={<CategoryManagement />} />
        <Route path="/admin/menus" element={<MenuManager />} />
        <Route path="/admin/tenants" element={<TenantManagement />} />
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />

      {/* Header */}
      <Header drawerWidth={DRAWER_WIDTH} onMenuClick={handleDrawerToggle} isDrawerOpen={isDrawerOpen} />

      {/* Sidebar */}
      <Sidebar drawerWidth={DRAWER_WIDTH} isOpen={isDrawerOpen} onMenuSelect={handleMenuSelect} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          transition: (theme) =>
            theme.transitions.create('margin', {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        <Toolbar />

        {/* Tab Bar */}
        <TabBar
          tabs={tabs}
          activeIndex={activeIndex}
          onTabSelect={selectTab}
          onTabClose={closeTab}
          onCloseAll={closeAllTabs}
          onCloseOthers={closeOtherTabs}
        />

        {/* Content Area */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          <HostProvider>{renderContent()}</HostProvider>
        </Box>
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MenuProvider>
        <Routes>
          {/* Auth Routes (without layout) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Main App Routes (with layout) */}
          <Route path="/*" element={<MainContent />} />
        </Routes>
      </MenuProvider>
    </AuthProvider>
  );
};

export default App;
