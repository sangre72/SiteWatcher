import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import type { BoardFormData, BoardType, ListViewType, PermissionType, CommentPermissionType, Tenant } from '../../types/board';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const defaultFormData: BoardFormData = {
  tenant_id: undefined,
  board_code: '',
  board_name: '',
  description: '',
  board_type: 'free',
  read_permission: 'public',
  write_permission: 'member',
  comment_permission: 'member',
  list_view_type: 'list',
  posts_per_page: 20,
  gallery_cols: 4,
  use_category: false,
  use_notice: true,
  use_secret: false,
  use_attachment: true,
  use_like: true,
  use_comment: true,
  use_thumbnail: false,
  use_top_fixed: true,
  use_display_period: false,
  max_file_size: 10485760,
  max_file_count: 5,
  allowed_file_types: 'jpg,jpeg,png,gif,pdf,zip,doc,docx,xls,xlsx,ppt,pptx',
  thumbnail_width: 200,
  thumbnail_height: 200,
  display_order: 0
};

const BoardForm: React.FC = () => {
  const navigate = useNavigate();
  const { boardCode } = useParams<{ boardCode: string }>();
  const { user, isLoggedIn } = useAuth();
  const isEditMode = !!boardCode;

  const [formData, setFormData] = useState<BoardFormData>(defaultFormData);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantWarning, setTenantWarning] = useState<string | null>(null);

  const loadTenants = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tenants`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.data) {
        setTenants(data.data);
        // 테넌트 테이블 없음 경고
        if (data.warning) {
          setTenantWarning(data.warning);
        }
        // 테넌트가 1개만 있으면 자동 선택
        if (data.data.length === 1) {
          setFormData(prev => {
            if (!prev.tenant_id) {
              return { ...prev, tenant_id: data.data[0].id };
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.error('테넌트 목록 로드 실패:', err);
    }
  }, []);

  const loadBoard = useCallback(async () => {
    if (!boardCode) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/boards/${boardCode}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || '게시판 조회에 실패했습니다.');
      }
      setFormData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시판 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [boardCode]);

  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'admin') {
      navigate('/login');
      return;
    }

    loadTenants();
    if (isEditMode) {
      loadBoard();
    }
  }, [isLoggedIn, user, navigate, isEditMode, loadTenants, loadBoard]);

  const handleChange = (field: keyof BoardFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.board_code.trim()) {
      setError('게시판 코드를 입력해주세요.');
      return;
    }
    if (!formData.board_name.trim()) {
      setError('게시판 이름을 입력해주세요.');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(formData.board_code)) {
      setError('게시판 코드는 영문 소문자, 숫자, 언더스코어만 사용할 수 있습니다.');
      return;
    }

    setIsSaving(true);
    try {
      const url = isEditMode
        ? `${API_BASE_URL}/api/admin/boards/${boardCode}`
        : `${API_BASE_URL}/api/admin/boards`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      navigate('/admin/boards');
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            {isEditMode ? '게시판 수정' : '게시판 생성'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {tenantWarning && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {tenantWarning}
              <Typography variant="body2" sx={{ mt: 1 }}>
                터미널에서 다음 명령어를 실행하세요:
                <code style={{ display: 'block', marginTop: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  mysql -u dbuser -p egov &lt; middleware/node/db/schema/tenant_schema.sql
                </code>
              </Typography>
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {/* 테넌트 설정 (멀티사이트) */}
            {tenants.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>사이트 설정</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>사이트 (테넌트) *</InputLabel>
                      <Select
                        value={formData.tenant_id || ''}
                        label="사이트 (테넌트) *"
                        onChange={(e) => handleChange('tenant_id', e.target.value as number)}
                        disabled={isEditMode}
                      >
                        {tenants.map((tenant) => (
                          <MenuItem key={tenant.id} value={tenant.id}>
                            {tenant.tenant_name} ({tenant.tenant_code})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 3 }} />
              </>
            )}

            {/* 기본 정보 */}
            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>기본 정보</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="게시판 코드 *"
                  value={formData.board_code}
                  onChange={(e) => handleChange('board_code', e.target.value.toLowerCase())}
                  disabled={isEditMode}
                  helperText="영문 소문자, 숫자, 언더스코어 (URL에 사용)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="게시판 이름 *"
                  value={formData.board_name}
                  onChange={(e) => handleChange('board_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="설명"
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>게시판 유형</InputLabel>
                  <Select
                    value={formData.board_type}
                    label="게시판 유형"
                    onChange={(e) => handleChange('board_type', e.target.value as BoardType)}
                  >
                    <MenuItem value="notice">공지사항</MenuItem>
                    <MenuItem value="free">자유게시판</MenuItem>
                    <MenuItem value="qna">Q&A</MenuItem>
                    <MenuItem value="gallery">갤러리</MenuItem>
                    <MenuItem value="faq">FAQ</MenuItem>
                    <MenuItem value="review">후기</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="표시 순서"
                  value={formData.display_order}
                  onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 0)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* 권한 설정 */}
            <Typography variant="h6" sx={{ mb: 2 }}>권한 설정</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>읽기 권한</InputLabel>
                  <Select
                    value={formData.read_permission}
                    label="읽기 권한"
                    onChange={(e) => handleChange('read_permission', e.target.value as PermissionType)}
                  >
                    <MenuItem value="public">전체 공개</MenuItem>
                    <MenuItem value="member">회원만</MenuItem>
                    <MenuItem value="admin">관리자만</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>쓰기 권한</InputLabel>
                  <Select
                    value={formData.write_permission}
                    label="쓰기 권한"
                    onChange={(e) => handleChange('write_permission', e.target.value as PermissionType)}
                  >
                    <MenuItem value="public">전체 공개</MenuItem>
                    <MenuItem value="member">회원만</MenuItem>
                    <MenuItem value="admin">관리자만</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>댓글 권한</InputLabel>
                  <Select
                    value={formData.comment_permission}
                    label="댓글 권한"
                    onChange={(e) => handleChange('comment_permission', e.target.value as CommentPermissionType)}
                  >
                    <MenuItem value="disabled">사용안함</MenuItem>
                    <MenuItem value="public">전체 공개</MenuItem>
                    <MenuItem value="member">회원만</MenuItem>
                    <MenuItem value="admin">관리자만</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* 보기 설정 */}
            <Typography variant="h6" sx={{ mb: 2 }}>보기 설정</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>목록 스타일</InputLabel>
                  <Select
                    value={formData.list_view_type}
                    label="목록 스타일"
                    onChange={(e) => handleChange('list_view_type', e.target.value as ListViewType)}
                  >
                    <MenuItem value="list">목록형</MenuItem>
                    <MenuItem value="gallery">갤러리형</MenuItem>
                    <MenuItem value="webzine">웹진형</MenuItem>
                    <MenuItem value="blog">블로그형</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="페이지당 게시글 수"
                  value={formData.posts_per_page}
                  onChange={(e) => handleChange('posts_per_page', parseInt(e.target.value) || 20)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="갤러리 열 수"
                  value={formData.gallery_cols}
                  onChange={(e) => handleChange('gallery_cols', parseInt(e.target.value) || 4)}
                  disabled={formData.list_view_type !== 'gallery'}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* 기능 설정 */}
            <Typography variant="h6" sx={{ mb: 2 }}>기능 설정</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.use_category}
                      onChange={(e) => handleChange('use_category', e.target.checked)}
                    />
                  }
                  label="카테고리"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.use_notice}
                      onChange={(e) => handleChange('use_notice', e.target.checked)}
                    />
                  }
                  label="공지기능"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.use_secret}
                      onChange={(e) => handleChange('use_secret', e.target.checked)}
                    />
                  }
                  label="비밀글"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.use_attachment}
                      onChange={(e) => handleChange('use_attachment', e.target.checked)}
                    />
                  }
                  label="파일첨부"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.use_like}
                      onChange={(e) => handleChange('use_like', e.target.checked)}
                    />
                  }
                  label="좋아요"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.use_comment}
                      onChange={(e) => handleChange('use_comment', e.target.checked)}
                    />
                  }
                  label="댓글"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.use_thumbnail}
                      onChange={(e) => handleChange('use_thumbnail', e.target.checked)}
                    />
                  }
                  label="썸네일"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.use_top_fixed}
                      onChange={(e) => handleChange('use_top_fixed', e.target.checked)}
                    />
                  }
                  label="상위고정"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.use_display_period}
                      onChange={(e) => handleChange('use_display_period', e.target.checked)}
                    />
                  }
                  label="노출기간"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* 파일 설정 */}
            <Typography variant="h6" sx={{ mb: 2 }}>파일 설정</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="최대 파일 크기"
                  value={Math.round(formData.max_file_size / 1024 / 1024)}
                  onChange={(e) => handleChange('max_file_size', (parseInt(e.target.value) || 10) * 1024 * 1024)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">MB</InputAdornment>
                  }}
                  disabled={!formData.use_attachment}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="최대 파일 수"
                  value={formData.max_file_count}
                  onChange={(e) => handleChange('max_file_count', parseInt(e.target.value) || 5)}
                  disabled={!formData.use_attachment}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="허용 확장자"
                  value={formData.allowed_file_types}
                  onChange={(e) => handleChange('allowed_file_types', e.target.value)}
                  helperText="콤마로 구분"
                  disabled={!formData.use_attachment}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="썸네일 너비"
                  value={formData.thumbnail_width}
                  onChange={(e) => handleChange('thumbnail_width', parseInt(e.target.value) || 200)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">px</InputAdornment>
                  }}
                  disabled={!formData.use_thumbnail}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="썸네일 높이"
                  value={formData.thumbnail_height}
                  onChange={(e) => handleChange('thumbnail_height', parseInt(e.target.value) || 200)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">px</InputAdornment>
                  }}
                  disabled={!formData.use_thumbnail}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* 버튼 */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={() => navigate('/admin/boards')}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isSaving}
              >
                {isSaving ? <CircularProgress size={24} /> : (isEditMode ? '수정' : '생성')}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default BoardForm;
