import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../context/AuthContext';
import AIChatWidget from './AIChatWidget';

const navLinks = (user) => [
  { to: user ? '/dashboard' : '/', label: 'Home', icon: <HomeIcon /> },
  { to: '/appointments', label: 'Appointments', icon: <CalendarMonthIcon /> },
];

export default function Layout() {
  const { user, logout, socket } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isConnected = socket?.connected ?? false;

  const handleLogout = () => {
    logout();
    navigate('/');
    setDrawerOpen(false);
  };

  const drawer = (
    <Box sx={{ width: 280, pt: 2, pb: 2 }} role="presentation">
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pr: 2 }}>
        <IconButton onClick={() => setDrawerOpen(false)} aria-label="Close menu">
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {navLinks(user).map(({ to, label, icon }) => (
          <ListItemButton
            key={to}
            component={Link}
            to={to}
            onClick={() => setDrawerOpen(false)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
        {user?.role === 'admin' && (
          <ListItemButton component={Link} to="/admin" onClick={() => setDrawerOpen(false)}>
            <ListItemIcon sx={{ minWidth: 40 }}><AdminPanelSettingsIcon /></ListItemIcon>
            <ListItemText primary="Admin" />
          </ListItemButton>
        )}
        {user ? (
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ minWidth: 40 }}><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        ) : (
          <>
            <ListItemButton component={Link} to="/login" onClick={() => setDrawerOpen(false)}>
              <ListItemIcon sx={{ minWidth: 40 }}><LoginIcon /></ListItemIcon>
              <ListItemText primary="Sign in" />
            </ListItemButton>
            <ListItemButton component={Link} to="/register" onClick={() => setDrawerOpen(false)}>
              <ListItemIcon sx={{ minWidth: 40 }}><PersonIcon /></ListItemIcon>
              <ListItemText primary="Register" />
            </ListItemButton>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'primary.main',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            edge="start"
            sx={{ mr: 1, display: { sm: 'none' } }}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component={Link}
            to={user ? '/dashboard' : '/'}
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
            }}
          >
            CareConnect
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
            {isConnected && (
              <Chip
                size="small"
                icon={
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#22c55e',
                      animation: 'pulse 2s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%,100%': { opacity: 1 },
                        '50%': { opacity: 0.6 },
                      },
                    }}
                  />
                }
                label="Live"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '& .MuiChip-icon': { ml: 0.5 },
                }}
              />
            )}
            {navLinks(user).map(({ to, label }) => (
              <Button key={to} component={Link} to={to} color="inherit" sx={{ textTransform: 'none' }}>
                {label}
              </Button>
            ))}
            {user?.role === 'admin' && (
              <Button component={Link} to="/admin" color="inherit" startIcon={<AdminPanelSettingsIcon />} sx={{ textTransform: 'none' }}>
                Admin
              </Button>
            )}
            {user ? (
              <>
                <Chip
                  icon={<PersonIcon sx={{ fontSize: 18 }} />}
                  label={user.name || user.email}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ textTransform: 'none' }}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  to="/login"
                  color="inherit"
                  sx={{ textTransform: 'none' }}
                >
                  Sign in
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="outlined"
                  color="inherit"
                  sx={{ borderColor: 'rgba(255,255,255,0.5)', textTransform: 'none' }}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <main>
        <Outlet />
      </main>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          bgcolor: 'primary.dark',
          color: 'primary.contrastText',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2">
          © {new Date().getFullYear()} CareConnect — Online Hospital Portal. For emergencies, call your local emergency services.
        </Typography>
      </Box>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 } }}
      >
        {drawer}
      </Drawer>
      <AIChatWidget />
    </>
  );
}
