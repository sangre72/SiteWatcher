import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Collapse,
  alpha,
  Toolbar,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import TerminalIcon from '@mui/icons-material/Terminal';
import StorageIcon from '@mui/icons-material/Storage';
import ComputerIcon from '@mui/icons-material/Computer';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import ForumIcon from '@mui/icons-material/Forum';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import BusinessIcon from '@mui/icons-material/Business';

interface SidebarProps {
  drawerWidth: number;
  isOpen: boolean;
  onMenuSelect: (menuName: string) => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  label: string;
  category?: string;
}

const menuItems: MenuItem[] = [
  { name: 'home', path: '/home', icon: <HomeIcon />, label: 'Home', category: 'main' },
  { name: 'boards', path: '/boards', icon: <ForumIcon />, label: '게시판', category: 'main' },
  { name: 'hosts_management', path: '/hosts_management', icon: <ComputerIcon />, label: 'Hosts Management', category: 'system' },
  { name: 'image_search', path: '/image_search', icon: <ImageSearchIcon />, label: 'Image Search', category: 'ai' },
  { name: 'text_search', path: '/text_search', icon: <TextFieldsIcon />, label: 'Text Search', category: 'ai' },
  { name: 'rag', path: '/rag', icon: <AutoAwesomeIcon />, label: 'RAG', category: 'ai' },
  { name: 'xterm', path: '/xterm', icon: <TerminalIcon />, label: 'XTerm', category: 'tools' },
  { name: 'terminal', path: '/terminal', icon: <StorageIcon />, label: 'Terminal', category: 'tools' },
  { name: 'admin_boards', path: '/admin/boards', icon: <SettingsIcon />, label: '게시판관리', category: 'admin' },
  { name: 'admin_menus', path: '/admin/menus', icon: <MenuIcon />, label: '메뉴관리', category: 'admin' },
  { name: 'admin_tenants', path: '/admin/tenants', icon: <BusinessIcon />, label: '테넌트관리', category: 'admin' },
];

const categories = [
  { key: 'main', label: 'Main' },
  { key: 'ai', label: 'AI/ML Features' },
  { key: 'system', label: 'System' },
  { key: 'tools', label: 'Development Tools' },
  { key: 'admin', label: 'Admin' },
];

const Sidebar: React.FC<SidebarProps> = ({ drawerWidth, isOpen, onMenuSelect }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>({
    main: true,
    ai: true,
    system: true,
    tools: true,
    admin: true,
  });

  const handleMenuClick = (item: MenuItem) => {
    onMenuSelect(item.name);
    navigate(item.path);
  };

  const handleCategoryClick = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const isActive = (path: string) => location.pathname === path;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar spacer for header */}
      <Toolbar />

      {/* Logo Section */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <SmartToyIcon sx={{ fontSize: 32, color: 'primary.light' }} />
        <Box>
          <Typography variant="h6" fontWeight={700} color="white">
            AI CMS
          </Typography>
          <Typography variant="caption" sx={{ color: 'grey.400' }}>
            Prototype v1.0
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        {categories.map((category) => {
          const categoryItems = menuItems.filter((item) => item.category === category.key);
          if (categoryItems.length === 0) return null;

          return (
            <Box key={category.key} sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleCategoryClick(category.key)}
                sx={{
                  py: 0.5,
                  px: 2,
                  '&:hover': { bgcolor: 'transparent' },
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: 'grey.500',
                    fontSize: '0.7rem',
                    letterSpacing: 1.2,
                    fontWeight: 600,
                  }}
                >
                  {category.label}
                </Typography>
                {openCategories[category.key] ? (
                  <ExpandLess sx={{ ml: 'auto', fontSize: 18, color: 'grey.500' }} />
                ) : (
                  <ExpandMore sx={{ ml: 'auto', fontSize: 18, color: 'grey.500' }} />
                )}
              </ListItemButton>

              <Collapse in={openCategories[category.key]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {categoryItems.map((item) => (
                    <ListItem key={item.name} disablePadding sx={{ px: 1 }}>
                      <ListItemButton
                        onClick={() => handleMenuClick(item)}
                        selected={isActive(item.path)}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          py: 1,
                          '&.Mui-selected': {
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
                            '&:hover': {
                              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.25),
                            },
                          },
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.06)',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 40,
                            color: isActive(item.path) ? 'primary.light' : 'grey.400',
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: isActive(item.path) ? 600 : 400,
                            color: isActive(item.path) ? 'white' : 'grey.300',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.05)',
          }}
        >
          <MonitorHeartIcon sx={{ color: 'success.light' }} />
          <Box>
            <Typography variant="body2" color="white" fontWeight={500}>
              System Status
            </Typography>
            <Typography variant="caption" sx={{ color: 'success.light' }}>
              All services running
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={isOpen}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: '#0f172a',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
