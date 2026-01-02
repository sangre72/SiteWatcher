import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  drawerWidth: number;
  onMenuClick: () => void;
  isDrawerOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ drawerWidth, onMenuClick, isDrawerOpen }) => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout: authLogout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await authLogout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
      elevation={0}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DashboardIcon color="primary" />
            <Typography variant="h6" noWrap component="div" fontWeight={600}>
              AI/ML Prototype CMS
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Notifications">
            <IconButton color="inherit" size="large">
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton color="inherit" size="large">
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          {isLoggedIn ? (
            <>
              <Tooltip title="Profile">
                <IconButton onClick={handleMenuOpen} sx={{ ml: 1 }}>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: user?.isAdmin ? 'error.main' : 'primary.main',
                      fontSize: '0.875rem',
                    }}
                  >
                    {user?.userName?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                PaperProps={{
                  elevation: 3,
                  sx: { minWidth: 200, mt: 1 },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2">{user?.userName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.userId} ({user?.role})
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleMenuClose}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  내 정보
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  로그아웃
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="outlined"
              startIcon={<LoginIcon />}
              onClick={handleLogin}
              size="small"
              sx={{ ml: 1 }}
            >
              로그인
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
