/**
 * Category Management Component
 * 게시판 카테고리 관리 페이지
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  ArrowBack as BackIcon,
  Close as CloseIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import type { Board } from '../../types/board';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface Category {
  id: number;
  board_id: number;
  category_name: string;
  category_order: number;
  is_active: boolean;
  created_at: string;
}

interface CategoryFormData {
  category_name: string;
  category_order: number;
}

const defaultFormData: CategoryFormData = {
  category_name: '',
  category_order: 0
};

const CategoryManagement: React.FC = () => {
  const navigate = useNavigate();
  const { boardCode } = useParams<{ boardCode: string }>();
  const { user, isLoggedIn } = useAuth();

  const [board, setBoard] = useState<Board | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 폼 다이얼로그
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 삭제 다이얼로그
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const loadBoard = useCallback(async () => {
    if (!boardCode) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/boards/${boardCode}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setBoard(data.data);
      }
    } catch (err) {
      console.error('게시판 정보 로드 실패:', err);
    }
  }, [boardCode]);

  const loadCategories = useCallback(async () => {
    if (!boardCode) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/boards/${boardCode}/categories`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || '카테고리 목록 조회에 실패했습니다.');
      }
      setCategories(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [boardCode]);

  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadBoard();
    loadCategories();
  }, [isLoggedIn, user, navigate, loadBoard, loadCategories]);

  const handleOpenForm = () => {
    setFormData({
      ...defaultFormData,
      category_order: categories.length + 1
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setFormData(defaultFormData);
    setFormError(null);
  };

  const handleFormChange = (field: keyof CategoryFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!boardCode) return;
    setFormError(null);
    setIsSaving(true);

    try {
      if (!formData.category_name.trim()) {
        throw new Error('카테고리 이름을 입력하세요.');
      }

      // 현재는 추가만 지원 (수정은 삭제 후 재추가)
      const response = await fetch(`${API_BASE_URL}/api/admin/boards/${boardCode}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          category_name: formData.category_name,
          category_order: formData.category_order
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || '저장에 실패했습니다.');
      }

      setSuccessMessage('카테고리가 추가되었습니다.');
      handleCloseForm();
      loadCategories();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !boardCode) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/boards/${boardCode}/categories/${deleteTarget.id}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      setDeleteTarget(null);
      setSuccessMessage('카테고리가 삭제되었습니다.');
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => navigate('/admin/boards')} size="small">
                <BackIcon />
              </IconButton>
              <CategoryIcon color="primary" />
              <Box>
                <Typography variant="h5" component="h1">
                  카테고리 관리
                </Typography>
                {board && (
                  <Typography variant="body2" color="text.secondary">
                    {board.board_name} ({board.board_code})
                  </Typography>
                )}
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenForm()}
            >
              카테고리 추가
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}

          {!board?.use_category && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              이 게시판은 카테고리 기능이 비활성화되어 있습니다.
              게시판 설정에서 카테고리 사용을 활성화하세요.
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={80}>순서</TableCell>
                  <TableCell>카테고리명</TableCell>
                  <TableCell width={150}>생성일</TableCell>
                  <TableCell align="center" width={120}>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        등록된 카테고리가 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category, index) => (
                    <TableRow key={category.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={category.category_order}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {category.category_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(category.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="삭제">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(category)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 폼 다이얼로그 */}
        <Dialog open={formOpen} onClose={handleCloseForm} maxWidth="xs" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              카테고리 추가
              <IconButton onClick={handleCloseForm} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="카테고리 이름 *"
                  value={formData.category_name}
                  onChange={(e) => handleFormChange('category_name', e.target.value)}
                  placeholder="예: 일반"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="표시 순서"
                  type="number"
                  value={formData.category_order}
                  onChange={(e) => handleFormChange('category_order', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>취소</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={isSaving}
            >
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 삭제 확인 다이얼로그 */}
        <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
          <DialogTitle>카테고리 삭제</DialogTitle>
          <DialogContent>
            <Typography>
              "{deleteTarget?.category_name}" 카테고리를 삭제하시겠습니까?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              이 카테고리를 사용하는 게시글의 카테고리는 해제됩니다.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              삭제
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default CategoryManagement;
