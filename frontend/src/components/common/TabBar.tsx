/**
 * TabBar Component
 * MUI Tabs 기반 브라우저 스타일 탭 바
 */

import React, { useCallback } from 'react';
import { Box, Tab, Tabs, IconButton, Menu, MenuItem, Divider, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { TabItem } from '../../hooks/useTabManager';

interface TabBarProps {
  tabs: TabItem[];
  activeIndex: number;
  onTabSelect: (index: number) => void;
  onTabClose: (index: number, event?: React.MouseEvent) => void;
  onCloseAll?: () => void;
  onCloseOthers?: (index: number) => void;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeIndex,
  onTabSelect,
  onTabClose,
  onCloseAll,
  onCloseOthers,
}) => {
  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
    tabIndex: number;
  } | null>(null);

  const handleContextMenu = useCallback((event: React.MouseEvent, index: number) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      tabIndex: index,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: number) => {
      onTabSelect(newValue);
    },
    [onTabSelect]
  );

  if (tabs.length === 0) {
    return null;
  }

  return (
    <Box
      sx={(theme) => ({
        bgcolor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
      })}
    >
      <Tabs
        value={activeIndex >= 0 && activeIndex < tabs.length ? activeIndex : 0}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={(theme) => ({
          flex: 1,
          minHeight: 40,
          '& .MuiTabs-indicator': {
            height: 2,
            backgroundColor: theme.palette.primary.main,
          },
          '& .MuiTabs-scrollButtons': {
            width: 28,
            '&.Mui-disabled': {
              opacity: 0.3,
            },
          },
        })}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={tab.id}
            onContextMenu={(e) => handleContextMenu(e, index)}
            label={
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  maxWidth: 180,
                }}
              >
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontSize: 13,
                    fontWeight: index === activeIndex ? 600 : 400,
                  }}
                >
                  {tab.label}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(index, e);
                  }}
                  sx={(theme) => ({
                    p: 0.25,
                    ml: 0.25,
                    opacity: 0.6,
                    '&:hover': {
                      opacity: 1,
                      bgcolor: theme.palette.action.hover,
                      color: theme.palette.error.main,
                    },
                  })}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            }
            sx={(theme) => ({
              minHeight: 40,
              minWidth: 'auto',
              maxWidth: 200,
              py: 0.5,
              px: 1.5,
              textTransform: 'none',
              color: index === activeIndex ? theme.palette.text.primary : theme.palette.text.secondary,
              bgcolor: index === activeIndex ? theme.palette.action.selected : 'transparent',
              borderRight: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
              '&.Mui-selected': {
                color: theme.palette.text.primary,
              },
            })}
          />
        ))}
      </Tabs>

      {/* 탭 메뉴 버튼 */}
      {tabs.length > 0 && (
        <IconButton
          size="small"
          onClick={(e) => handleContextMenu(e, activeIndex)}
          sx={(theme) => ({
            mx: 0.5,
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
          })}
        >
          <MoreVertIcon sx={{ fontSize: 18 }} />
        </IconButton>
      )}

      {/* 컨텍스트 메뉴 */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
        }
      >
        <MenuItem
          onClick={() => {
            if (contextMenu) {
              onTabClose(contextMenu.tabIndex);
            }
            handleCloseContextMenu();
          }}
        >
          탭 닫기
        </MenuItem>
        {onCloseOthers && (
          <MenuItem
            onClick={() => {
              if (contextMenu && onCloseOthers) {
                onCloseOthers(contextMenu.tabIndex);
              }
              handleCloseContextMenu();
            }}
            disabled={tabs.length <= 1}
          >
            다른 탭 닫기
          </MenuItem>
        )}
        {onCloseAll && (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                if (onCloseAll) {
                  onCloseAll();
                }
                handleCloseContextMenu();
              }}
            >
              모든 탭 닫기
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default TabBar;
