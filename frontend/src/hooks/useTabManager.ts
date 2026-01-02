/**
 * Tab Manager Hook
 * MUI Tabs 기반 탭 관리 로직
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface TabItem {
  id: string;
  name: string;
  label: string;
  path: string;
}

interface TabManagerOptions {
  storageKey?: string;
  defaultPath?: string;
}

// 메뉴명 → 경로 매핑
const MENU_PATH_MAP: Record<string, { path: string; label: string }> = {
  home: { path: '/home', label: 'Home' },
  boards: { path: '/boards', label: '게시판' },
  hosts_management: { path: '/hosts_management', label: 'Hosts Management' },
  image_search: { path: '/image_search', label: 'Image Search' },
  text_search: { path: '/text_search', label: 'Text Search' },
  rag: { path: '/rag', label: 'RAG' },
  xterm: { path: '/xterm', label: 'XTerm' },
  terminal: { path: '/terminal', label: 'Terminal' },
  // Admin
  admin_boards: { path: '/admin/boards', label: '게시판관리' },
  admin_menus: { path: '/admin/menus', label: '메뉴관리' },
  admin_tenants: { path: '/admin/tenants', label: '테넌트관리' },
};

export const useTabManager = (options: TabManagerOptions = {}) => {
  const { storageKey = 'app_tabs', defaultPath = '/home' } = options;
  const navigate = useNavigate();
  const location = useLocation();

  // 탭 목록
  const [tabs, setTabs] = useState<TabItem[]>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 현재 활성 탭 인덱스
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // 탭 ID 생성기
  const generateTabId = useCallback(() => {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 탭 추가
  const addTab = useCallback(
    (name: string, customPath?: string, customLabel?: string) => {
      const menuInfo = MENU_PATH_MAP[name];
      const path = customPath || menuInfo?.path || `/${name}`;
      const label = customLabel || menuInfo?.label || name;

      // 이미 같은 경로의 탭이 있으면 활성화
      const existingIndex = tabs.findIndex((tab) => tab.path === path);
      if (existingIndex >= 0) {
        setActiveIndex(existingIndex);
        navigate(path);
        return;
      }

      const newTab: TabItem = {
        id: generateTabId(),
        name,
        label,
        path,
      };

      setTabs((prev) => {
        const newTabs = [...prev, newTab];
        setActiveIndex(newTabs.length - 1);
        return newTabs;
      });

      navigate(path);
    },
    [tabs, navigate, generateTabId]
  );

  // 탭 선택
  const selectTab = useCallback(
    (index: number) => {
      if (index >= 0 && index < tabs.length) {
        setActiveIndex(index);
        navigate(tabs[index].path);
      }
    },
    [tabs, navigate]
  );

  // 탭 닫기
  const closeTab = useCallback(
    (index: number, event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }

      if (tabs.length === 0) return;

      setTabs((prev) => {
        const newTabs = prev.filter((_, i) => i !== index);

        // 닫힌 탭이 활성 탭이었으면 다른 탭 활성화
        if (index === activeIndex) {
          const newActiveIndex = Math.min(index, newTabs.length - 1);
          setActiveIndex(Math.max(0, newActiveIndex));

          if (newTabs.length > 0) {
            const newPath = newTabs[Math.max(0, newActiveIndex)]?.path || defaultPath;
            navigate(newPath);
          } else {
            navigate(defaultPath);
          }
        } else if (index < activeIndex) {
          // 닫힌 탭이 활성 탭보다 앞에 있으면 인덱스 조정
          setActiveIndex((prev) => prev - 1);
        }

        return newTabs;
      });
    },
    [tabs.length, activeIndex, navigate, defaultPath]
  );

  // 모든 탭 닫기
  const closeAllTabs = useCallback(() => {
    setTabs([]);
    setActiveIndex(0);
    navigate(defaultPath);
  }, [navigate, defaultPath]);

  // 다른 탭 닫기
  const closeOtherTabs = useCallback(
    (keepIndex: number) => {
      setTabs((prev) => {
        const keptTab = prev[keepIndex];
        if (!keptTab) return prev;
        return [keptTab];
      });
      setActiveIndex(0);
    },
    []
  );

  // URL 변경 감지하여 탭 동기화
  useEffect(() => {
    const currentPath = location.pathname;
    const matchingIndex = tabs.findIndex((tab) => tab.path === currentPath);

    if (matchingIndex >= 0 && matchingIndex !== activeIndex) {
      setActiveIndex(matchingIndex);
    }
  }, [location.pathname, tabs, activeIndex]);

  // 탭 상태 저장
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(tabs));
    } catch {
      // 저장 실패 무시
    }
  }, [tabs, storageKey]);

  return {
    tabs,
    activeIndex,
    activeTab: tabs[activeIndex] || null,
    addTab,
    selectTab,
    closeTab,
    closeAllTabs,
    closeOtherTabs,
    hasTab: (path: string) => tabs.some((tab) => tab.path === path),
  };
};

export default useTabManager;
