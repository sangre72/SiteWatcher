import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import type { Board, ListViewType, BoardType } from '../../types/board';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const BoardManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Board | null>(null);

  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadBoards();
  }, [isLoggedIn, user, navigate]);

  const loadBoards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/boards`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || '게시판 목록 조회에 실패했습니다.');
      }
      setBoards(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (board: Board) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/boards/${board.board_code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !board.is_active })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      loadBoards();
    } catch (err) {
      setError(err instanceof Error ? err.message : '상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/boards/${deleteTarget.board_code}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      setDeleteTarget(null);
      loadBoards();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  };

  const getBoardTypeLabel = (type: BoardType): string => {
    const labels: Record<BoardType, string> = {
      notice: '공지사항',
      free: '자유게시판',
      qna: 'Q&A',
      gallery: '갤러리',
      faq: 'FAQ',
      review: '후기'
    };
    return labels[type] || type;
  };

  const getViewTypeLabel = (type: ListViewType): string => {
    const labels: Record<ListViewType, string> = {
      list: '목록형',
      gallery: '갤러리형',
      webzine: '웹진형',
      blog: '블로그형'
    };
    return labels[type] || type;
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
              <SettingsIcon color="primary" />
              <Typography variant="h5" component="h1">
                게시판 관리
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/boards/new')}
            >
              게시판 추가
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>순서</TableCell>
                  <TableCell>코드</TableCell>
                  <TableCell>이름</TableCell>
                  <TableCell>유형</TableCell>
                  <TableCell>보기</TableCell>
                  <TableCell>기능</TableCell>
                  <TableCell align="center">활성</TableCell>
                  <TableCell align="center">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {boards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        등록된 게시판이 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  boards.map((board) => (
                    <TableRow key={board.id} hover>
                      <TableCell>{board.display_order}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {board.board_code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {board.board_name}
                        </Typography>
                        {board.description && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {board.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getBoardTypeLabel(board.board_type)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getViewTypeLabel(board.list_view_type)}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {board.use_category && <Chip label="카테고리" size="small" />}
                          {board.use_attachment && <Chip label="첨부" size="small" />}
                          {board.use_comment && <Chip label="댓글" size="small" />}
                          {board.use_secret && <Chip label="비밀글" size="small" />}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={board.is_active}
                          onChange={() => handleToggleActive(board)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="보기">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/boards/${board.board_code}`)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="수정">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/boards/${board.board_code}/edit`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(board)}
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

        <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
          <DialogTitle>게시판 삭제</DialogTitle>
          <DialogContent>
            <Typography>
              "{deleteTarget?.board_name}" 게시판을 삭제하시겠습니까?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              게시판의 모든 게시글과 댓글이 함께 삭제됩니다.
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

export default BoardManagement;
