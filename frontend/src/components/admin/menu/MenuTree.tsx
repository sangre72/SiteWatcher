/**
 * Menu Tree Component with @minoru/react-dnd-treeview
 * Windows Explorer 스타일 디자인 - MUI 테마 색상 사용
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Tree, NodeModel, DragLayerMonitorProps } from '@minoru/react-dnd-treeview';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Menu } from '../../../types/menu';

interface MenuTreeProps {
  menus: Menu[];
  selectedMenuId: number | null;
  onSelectMenu: (menu: Menu) => void;
  onAddMenu: (parentId: number | null) => void;
  onDeleteMenu: (menuId: number) => void;
  onMoveMenu: (menuId: number, newParentId: number | null, newIndex: number) => void;
}

// Menu를 NodeModel로 변환
const convertToNodeModel = (menus: Menu[]): NodeModel<Menu>[] => {
  const result: NodeModel<Menu>[] = [];

  const flattenMenus = (menuList: Menu[]) => {
    menuList.forEach((menu) => {
      result.push({
        id: menu.id,
        parent: menu.parent_id ?? 0,
        text: menu.menu_name,
        droppable: true,
        data: menu,
      });
      if (menu.children && menu.children.length > 0) {
        flattenMenus(menu.children);
      }
    });
  };

  flattenMenus(menus);
  return result;
};

const MenuTree: React.FC<MenuTreeProps> = ({
  menus,
  selectedMenuId,
  onSelectMenu,
  onAddMenu,
  onDeleteMenu,
  onMoveMenu,
}) => {
  const [openIds, setOpenIds] = useState<(string | number)[]>([]);

  const treeData = useMemo(() => convertToNodeModel(menus), [menus]);

  // 초기 열림 상태 설정 (모든 노드 열기)
  React.useEffect(() => {
    const allIds = treeData.map((node) => node.id);
    setOpenIds(allIds);
  }, [treeData]);

  // 드롭 핸들러
  const handleDrop = useCallback(
    (
      newTree: NodeModel<Menu>[],
      options: {
        dragSourceId: string | number;
        dropTargetId: string | number;
        destinationIndex: number;
      }
    ) => {
      const { dragSourceId, dropTargetId, destinationIndex } = options;
      const draggedNode = treeData.find((node) => node.id === dragSourceId);
      if (!draggedNode) return;

      const newParentId = dropTargetId === 0 ? null : Number(dropTargetId);
      onMoveMenu(Number(dragSourceId), newParentId, destinationIndex);
    },
    [treeData, onMoveMenu]
  );

  // canDrop - 순환 참조 방지
  const canDrop = useCallback(
    (
      tree: NodeModel<Menu>[],
      {
        dragSource,
        dropTargetId,
      }: { dragSource: NodeModel<Menu> | undefined; dropTargetId: string | number }
    ) => {
      if (dragSource?.id === dropTargetId) return false;

      const isDescendant = (parentId: number | string, childId: number | string): boolean => {
        const children = tree.filter((node) => node.parent === parentId);
        for (const child of children) {
          if (child.id === childId) return true;
          if (isDescendant(child.id, childId)) return true;
        }
        return false;
      };
      if (dragSource && isDescendant(dragSource.id, dropTargetId)) return false;

      return true;
    },
    []
  );

  // 트리 노드 렌더링 (Windows Explorer 스타일 - 테마 색상)
  const renderNode = useCallback(
    (
      node: NodeModel<Menu>,
      { depth, isOpen, onToggle }: { depth: number; isOpen: boolean; onToggle: () => void }
    ) => {
      const menu = node.data!;
      const hasChildren = treeData.some((n) => n.parent === node.id);
      const isSelected = selectedMenuId === menu.id;
      const childCount = treeData.filter((n) => n.parent === node.id).length;

      const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectMenu(menu);
      };

      const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddMenu(menu.id);
      };

      const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteMenu(menu.id);
      };

      const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasChildren) onToggle();
      };

      return (
        <Box
          onClick={handleSelect}
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            height: 28,
            cursor: 'pointer',
            userSelect: 'none',
            // 테마 기반 색상: 선택 시 primary.light 배경
            bgcolor: isSelected ? theme.palette.action.selected : 'transparent',
            border: isSelected
              ? `1px solid ${theme.palette.primary.light}`
              : '1px solid transparent',
            borderRadius: 0.5,
            '&:hover': {
              bgcolor: isSelected
                ? theme.palette.action.selected
                : theme.palette.action.hover,
              border: isSelected
                ? `1px solid ${theme.palette.primary.light}`
                : `1px solid ${theme.palette.divider}`,
              '& .menu-actions': {
                opacity: 1,
              },
            },
            // 들여쓰기 (depth * 20px)
            pl: `${depth * 20 + 4}px`,
            pr: 0.5,
            position: 'relative',
          })}
        >
          {/* 트리 가이드 라인 */}
          {depth > 0 && (
            <Box
              sx={(theme) => ({
                position: 'absolute',
                left: `${(depth - 1) * 20 + 14}px`,
                top: 0,
                bottom: 0,
                width: 1,
                bgcolor: theme.palette.divider,
              })}
            />
          )}

          {/* 펼침/접힘 화살표 */}
          <Box
            onClick={handleToggle}
            sx={(theme) => ({
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 0.5,
              cursor: hasChildren ? 'pointer' : 'default',
              color: theme.palette.text.secondary,
              '&:hover': hasChildren ? { color: theme.palette.text.primary } : {},
            })}
          >
            {hasChildren && (
              isOpen ? (
                <ExpandMoreIcon sx={{ fontSize: 16 }} />
              ) : (
                <ChevronRightIcon sx={{ fontSize: 16 }} />
              )
            )}
          </Box>

          {/* 폴더/파일 아이콘 (테마 색상) */}
          <Box sx={{ mr: 0.75, display: 'flex', alignItems: 'center' }}>
            {hasChildren ? (
              isOpen ? (
                <FolderOpenIcon sx={(theme) => ({ fontSize: 18, color: theme.palette.warning.main })} />
              ) : (
                <FolderIcon sx={(theme) => ({ fontSize: 18, color: theme.palette.warning.main })} />
              )
            ) : (
              <DescriptionIcon sx={(theme) => ({ fontSize: 18, color: theme.palette.info.light })} />
            )}
          </Box>

          {/* 메뉴명 */}
          <Typography
            variant="body2"
            sx={(theme) => ({
              flex: 1,
              fontSize: 13,
              fontWeight: isSelected ? 500 : 400,
              color: theme.palette.text.primary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            })}
          >
            {menu.menu_name}
          </Typography>

          {/* 뱃지: 하위 메뉴 개수 */}
          {hasChildren && (
            <Typography
              variant="caption"
              sx={(theme) => ({ ml: 0.5, color: theme.palette.text.disabled, fontSize: 11 })}
            >
              ({childCount})
            </Typography>
          )}

          {/* 액션 버튼 */}
          <Box
            className="menu-actions"
            sx={{
              display: 'flex',
              gap: 0.25,
              opacity: 0,
              transition: 'opacity 0.2s',
              ml: 0.5,
            }}
          >
            <Tooltip title="하위 메뉴 추가" placement="top">
              <IconButton size="small" onClick={handleAdd} sx={{ width: 20, height: 20, p: 0 }}>
                <AddIcon sx={{ fontSize: 14, color: 'success.main' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="메뉴 삭제" placement="top">
              <IconButton size="small" onClick={handleDelete} sx={{ width: 20, height: 20, p: 0 }}>
                <DeleteOutlineIcon sx={{ fontSize: 14, color: 'error.main' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      );
    },
    [treeData, selectedMenuId, onSelectMenu, onAddMenu, onDeleteMenu]
  );

  // 드래그 프리뷰 (테마 색상)
  const dragPreviewRender = useCallback(
    (monitorProps: DragLayerMonitorProps<Menu>) => (
      <Box
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          p: 0.75,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.primary.light}`,
          borderRadius: 0.5,
          boxShadow: 2,
        })}
      >
        <FolderIcon sx={(theme) => ({ fontSize: 16, color: theme.palette.warning.main, mr: 0.75 })} />
        <Typography variant="body2" sx={{ fontSize: 13 }}>
          {monitorProps.item.text}
        </Typography>
      </Box>
    ),
    []
  );

  // placeholder 렌더링
  const placeholderRender = useCallback(
    (node: NodeModel<Menu>, { depth }: { depth: number }) => (
      <Box
        sx={(theme) => ({
          ml: `${depth * 20 + 4}px`,
          height: 2,
          bgcolor: theme.palette.primary.main,
          borderRadius: 1,
          my: 0.25,
        })}
      />
    ),
    []
  );

  return (
    <Box
      sx={(theme) => ({
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
      })}
    >
      {/* 헤더 */}
      <Box
        sx={(theme) => ({
          px: 1.5,
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.grey[50],
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        })}
      >
        <FolderIcon sx={(theme) => ({ fontSize: 18, color: theme.palette.warning.main })} />
        <Typography sx={(theme) => ({ fontSize: 13, fontWeight: 500, color: theme.palette.text.primary })}>
          메뉴 관리
        </Typography>
      </Box>

      {/* 트리 영역 */}
      <Box
        sx={(theme) => ({
          flex: 1,
          overflow: 'auto',
          py: 0.5,
          px: 0.5,
          // 스크롤바 스타일
          '&::-webkit-scrollbar': { width: 8 },
          '&::-webkit-scrollbar-track': { bgcolor: theme.palette.grey[100] },
          '&::-webkit-scrollbar-thumb': { bgcolor: theme.palette.grey[400], borderRadius: 4 },
          '&::-webkit-scrollbar-thumb:hover': { bgcolor: theme.palette.grey[500] },
        })}
      >
        {menus.length === 0 ? (
          <Box sx={(theme) => ({ p: 2, textAlign: 'center', color: theme.palette.text.disabled, fontSize: 13 })}>
            메뉴가 없습니다.
          </Box>
        ) : (
          <DndProvider backend={HTML5Backend}>
            <Tree
              tree={treeData}
              rootId={0}
              onDrop={handleDrop}
              render={renderNode}
              dragPreviewRender={dragPreviewRender}
              placeholderRender={placeholderRender}
              sort={false}
              insertDroppableFirst={false}
              canDrop={canDrop}
              dropTargetOffset={10}
              initialOpen={openIds}
              onChangeOpen={(newOpenIds) => setOpenIds(newOpenIds)}
              classes={{
                root: 'menu-tree-root',
                draggingSource: 'menu-tree-dragging',
                dropTarget: 'menu-tree-drop-target',
              }}
            />
          </DndProvider>
        )}
      </Box>

      {/* 하단: 새 메뉴 추가 버튼 */}
      <Box sx={(theme) => ({ p: 1, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.grey[50] })}>
        <Button
          fullWidth
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
          onClick={() => onAddMenu(null)}
          sx={(theme) => ({
            justifyContent: 'flex-start',
            textTransform: 'none',
            fontSize: 13,
            color: theme.palette.text.primary,
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
              borderColor: theme.palette.primary.light,
            },
          })}
        >
          새 메뉴 추가
        </Button>
      </Box>
    </Box>
  );
};

export default MenuTree;
