import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 이미 로그인된 경우 홈으로 리다이렉트
  React.useEffect(() => {
    if (isLoggedIn) {
      navigate('/home');
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ userId: userId.trim(), password });
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" component="h1" gutterBottom>
              로그인
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI CMS에 오신 것을 환영합니다
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="아이디"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              margin="normal"
              autoComplete="username"
              autoFocus
              disabled={isLoading}
            />

            <TextField
              fullWidth
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              autoComplete="current-password"
              disabled={isLoading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : '로그인'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                계정이 없으신가요?{' '}
                <Link component={RouterLink} to="/register">
                  회원가입
                </Link>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
              테스트 계정: admin / admin123
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
