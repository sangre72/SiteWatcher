/**
 * Menu Manager Component
 * 메뉴 관리 메인 컴포넌트 (좌측 트리 + 우측 폼)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import MenuTree from './MenuTree';
import MenuForm from './MenuForm';
import { Menu, MenuFormData } from '../../../types/menu';
import * as menuApi from '../../../lib/menuApi';

// 계층형 트리를 flat list로 변환하는 헬퍼 함수
const flattenMenuTree = (menuList: Menu[], parentId: number | null = null): Menu[] => {
  const result: Menu[] = [];
  for (const menu of menuList) {
    result.push({
      ...menu,
      parent_id: parentId,
    });
    if (menu.children && menu.children.length > 0) {
      result.push(...flattenMenuTree(menu.children, menu.id));
    }
  }
  return result;
};

const MenuManager: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [flatMenus, setFlatMenus] = useState<Menu[]>([]); // flat list 캐시
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 추가 모드 관련
  const [isAddMode, setIsAddMode] = useState(false);
  const [parentId, setParentId] = useState<number | null>(null);
  const [parentMenuName, setParentMenuName] = useState<string | undefined>(undefined);
  const [parentMenuPath, setParentMenuPath] = useState<{ id: number; name: string }[]>([]);

  // 삭제 확인 다이얼로그
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<number | null>(null);

  useEffect(() => {
    loadMenus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMenus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await menuApi.getAllMenus('user');
      const treeData = buildMenuTree(data);
      setMenus(treeData);
      // flat list도 함께 저장 (Breadcrumb 경로 계산용)
      setFlatMenus(flattenMenuTree(treeData));
    } catch (err: any) {
      setError(err.message || '메뉴 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const buildMenuTree = (flatMenus: Menu[]): Menu[] => {
    const menuMap = new Map<number, Menu>();
    const rootMenus: Menu[] = [];

    // Create map
    flatMenus.forEach((menu) => {
      menuMap.set(menu.id, { ...menu, children: [] });
    });

    // Build tree
    flatMenus.forEach((menu) => {
      const menuNode = menuMap.get(menu.id)!;
      if (menu.parent_id === null) {
        rootMenus.push(menuNode);
      } else {
        const parent = menuMap.get(menu.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(menuNode);
        }
      }
    });

    // Sort by sort_order
    const sortMenus = (menus: Menu[]) => {
      menus.sort((a, b) => a.sort_order - b.sort_order);
      menus.forEach((menu) => {
        if (menu.children && menu.children.length > 0) {
          sortMenus(menu.children);
        }
      });
    };

    sortMenus(rootMenus);
    return rootMenus;
  };

  // flat list에서 메뉴 경로 계산 (Breadcrumb용)
  const getMenuPath = (targetParentId: number | null): { id: number; name: string }[] => {
    if (!targetParentId) return [];

    const path: { id: number; name: string }[] = [];
    let currentId: number | null = targetParentId;

    // 최대 10레벨까지 (무한루프 방지)
    while (currentId && path.length < 10) {
      const idToFind = currentId;
      const found = flatMenus.find((m) => m.id === idToFind);
      if (found) {
        path.unshift({ id: found.id, name: found.menu_name });
        currentId = found.parent_id ?? null;
      } else {
        break;
      }
    }
    return path;
  };

  const handleSelectMenu = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsAddMode(false);
    setParentId(null);
    setParentMenuName(undefined);
    // 선택된 메뉴의 부모 경로 계산
    setParentMenuPath(getMenuPath(menu.parent_id ?? null));
  };

  const handleAddMenu = (parentIdParam: number | null) => {
    setIsAddMode(true);
    setParentId(parentIdParam);
    setSelectedMenu(null);

    if (parentIdParam) {
      const parent = findMenuById(menus, parentIdParam);
      setParentMenuName(parent?.menu_name);
      // 부모까지 포함한 전체 경로 계산
      setParentMenuPath(getMenuPath(parentIdParam));
    } else {
      setParentMenuName(undefined);
      setParentMenuPath([]);
    }
  };

  const findMenuById = (menuList: Menu[], id: number): Menu | undefined => {
    for (const menu of menuList) {
      if (menu.id === id) return menu;
      if (menu.children) {
        const found = findMenuById(menu.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const handleSaveMenu = async (formData: MenuFormData) => {
    try {
      if (isAddMode) {
        // 추가 모드
        const newFormData = { ...formData, parent_id: parentId };
        await menuApi.createMenu(newFormData);
        setSuccessMessage('메뉴가 추가되었습니다.');
      } else if (selectedMenu) {
        // 수정 모드
        await menuApi.updateMenu(selectedMenu.id, formData);
        setSuccessMessage('메뉴가 수정되었습니다.');
      }

      await loadMenus();
      setIsAddMode(false);
      setSelectedMenu(null);
      setParentId(null);
      setParentMenuName(undefined);
      setParentMenuPath([]);
    } catch (err: any) {
      throw err;
    }
  };

  const handleCancelEdit = () => {
    setIsAddMode(false);
    setSelectedMenu(null);
    setParentId(null);
    setParentMenuName(undefined);
    setParentMenuPath([]);
  };

  const handleDeleteMenu = (menuId: number) => {
    setMenuToDelete(menuId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteMenu = async () => {
    if (menuToDelete === null) return;

    try {
      await menuApi.deleteMenu(menuToDelete);
      setSuccessMessage('메뉴가 삭제되었습니다.');
      setDeleteConfirmOpen(false);
      setMenuToDelete(null);

      if (selectedMenu?.id === menuToDelete) {
        setSelectedMenu(null);
      }

      await loadMenus();
    } catch (err: any) {
      setError(err.message || '메뉴 삭제에 실패했습니다.');
      setDeleteConfirmOpen(false);
      setMenuToDelete(null);
    }
  };

  const cancelDeleteMenu = () => {
    setDeleteConfirmOpen(false);
    setMenuToDelete(null);
  };

  const handleMoveMenu = async (menuId: number, newParentId: number | null, newIndex: number) => {
    try {
      await menuApi.moveMenu(menuId, newParentId, newIndex);
      setSuccessMessage('메뉴가 이동되었습니다.');
      await loadMenus();
    } catch (err: any) {
      setError(err.message || '메뉴 이동에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          사용자 메뉴 관리
        </Typography>
        <Typography variant="body2" color="text.secondary">
          마이페이지 메뉴를 관리합니다. 좌측에서 메뉴를 선택하거나 추가하여 우측에서 편집할 수 있습니다.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content: Tree (50%) + Form (50%) */}
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        {/* Left Panel: Tree */}
        <MenuTree
          menus={menus}
          selectedMenuId={selectedMenu?.id || null}
          onSelectMenu={handleSelectMenu}
          onAddMenu={handleAddMenu}
          onDeleteMenu={handleDeleteMenu}
          onMoveMenu={handleMoveMenu}
        />

        {/* Right Panel: Form */}
        <MenuForm
          menu={isAddMode ? null : selectedMenu}
          parentMenuName={parentMenuName}
          parentMenuPath={parentMenuPath}
          isAddMode={isAddMode}
          onSave={handleSaveMenu}
          onCancel={handleCancelEdit}
        />
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={cancelDeleteMenu}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">메뉴 삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            선택한 메뉴를 삭제하시겠습니까?
            <br />
            하위 메뉴가 있는 경우 함께 삭제되지 않으며, 복구할 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteMenu} color="inherit">
            취소
          </Button>
          <Button onClick={confirmDeleteMenu} color="error" variant="contained" autoFocus>
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MenuManager;
