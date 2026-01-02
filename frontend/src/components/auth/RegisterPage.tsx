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
import { PersonAdd as RegisterIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoggedIn } = useAuth();

  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    confirmPassword: '',
    userName: '',
    email: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 이미 로그인된 경우 홈으로 리다이렉트
  React.useEffect(() => {
    if (isLoggedIn) {
      navigate('/home');
    }
  }, [isLoggedIn, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 필수 필드 검증
    if (!formData.userId.trim() || !formData.password || !formData.userName.trim()) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 길이 검증
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    // 이메일 형식 검증
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('올바른 이메일 형식이 아닙니다.');
        return;
      }
    }

    setIsLoading(true);
    try {
      await register({
        userId: formData.userId.trim(),
        password: formData.password,
        userName: formData.userName.trim(),
        email: formData.email.trim() || undefined
      });
      navigate('/login', { state: { message: '회원가입이 완료되었습니다. 로그인해주세요.' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
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
          justifyContent: 'center',
          py: 4
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
            <RegisterIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" component="h1" gutterBottom>
              회원가입
            </Typography>
            <Typography variant="body2" color="text.secondary">
              새 계정을 만들어보세요
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
              label="아이디 *"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              margin="normal"
              autoComplete="username"
              autoFocus
              disabled={isLoading}
              helperText="영문, 숫자 조합 4-50자"
            />

            <TextField
              fullWidth
              label="이름 *"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              margin="normal"
              disabled={isLoading}
            />

            <TextField
              fullWidth
              label="이메일"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              autoComplete="email"
              disabled={isLoading}
            />

            <TextField
              fullWidth
              label="비밀번호 *"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              autoComplete="new-password"
              disabled={isLoading}
              helperText="최소 6자 이상"
            />

            <TextField
              fullWidth
              label="비밀번호 확인 *"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              autoComplete="new-password"
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
              {isLoading ? <CircularProgress size={24} /> : '회원가입'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                이미 계정이 있으신가요?{' '}
                <Link component={RouterLink} to="/login">
                  로그인
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;
