import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  Create as CreateIcon,
  Announcement as NoticeIcon,
  Lock as LockIcon,
  Comment as CommentIcon,
  Visibility as ViewIcon,
  ThumbUp as LikeIcon
} from '@mui/icons-material';
import { fetchBoardByCode, fetchPosts } from '../../lib/boardApi';
import type { Board, PostListItem, PostQueryParams } from '../../types/board';

const PostList: React.FC = () => {
  const { boardCode } = useParams<{ boardCode: string }>();
  const navigate = useNavigate();

  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');

  useEffect(() => {
    if (boardCode) {
      loadBoard();
    }
  }, [boardCode]);

  useEffect(() => {
    if (board) {
      loadPosts();
    }
  }, [board, page, rowsPerPage, search, categoryId]);

  const loadBoard = async () => {
    if (!boardCode) return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchBoardByCode(boardCode);
      setBoard(data);
      setRowsPerPage(data.posts_per_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시판 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    if (!boardCode) return;

    try {
      setLoading(true);
      setError(null);

      const params: PostQueryParams = {
        page: page + 1,
        limit: rowsPerPage
      };

      if (categoryId) {
        params.categoryId = Number(categoryId);
      }

      if (search) {
        params.search = search;
      }

      const data = await fetchPosts(boardCode, params);
      setPosts(data.posts);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  if (loading && !board) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!board) {
    return (
      <Box p={3}>
        <Alert severity="error">게시판을 찾을 수 없습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {board.board_name}
          </Typography>
          {board.description && (
            <Typography variant="body2" color="text.secondary">
              {board.description}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<CreateIcon />}
          onClick={() => navigate(`/boards/${boardCode}/write`)}
        >
          글쓰기
        </Button>
      </Box>

      {/* Search & Filter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          {board.use_category && board.categories && board.categories.length > 0 && (
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>카테고리</InputLabel>
              <Select
                value={categoryId}
                label="카테고리"
                onChange={(e) => {
                  setCategoryId(e.target.value as number | '');
                  setPage(0);
                }}
              >
                <MenuItem value="">전체</MenuItem>
                {board.categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            placeholder="제목 또는 내용으로 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleSearch}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Post List Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" width={80}>번호</TableCell>
              {board.use_category && <TableCell align="center" width={120}>카테고리</TableCell>}
              <TableCell>제목</TableCell>
              <TableCell align="center" width={120}>작성자</TableCell>
              <TableCell align="center" width={100}>조회</TableCell>
              {board.use_like && <TableCell align="center" width={80}>좋아요</TableCell>}
              <TableCell align="center" width={150}>작성일</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={board.use_category ? 7 : 6} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={board.use_category ? 7 : 6} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="text.secondary">
                    게시글이 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post, index) => (
                <TableRow
                  key={post.id}
                  hover
                  onClick={() => navigate(`/boards/${boardCode}/posts/${post.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell align="center">
                    {post.is_notice ? (
                      <Chip
                        icon={<NoticeIcon />}
                        label="공지"
                        color="error"
                        size="small"
                      />
                    ) : (
                      total - (page * rowsPerPage + index)
                    )}
                  </TableCell>
                  {board.use_category && (
                    <TableCell align="center">
                      {post.category_name && (
                        <Chip label={post.category_name} size="small" variant="outlined" />
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {post.is_secret && <LockIcon fontSize="small" color="action" />}
                      <Typography variant="body2">{post.title}</Typography>
                      {post.comment_count > 0 && (
                        <Chip
                          icon={<CommentIcon />}
                          label={post.comment_count}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{post.author}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                      <ViewIcon fontSize="small" color="action" />
                      <Typography variant="body2">{post.view_count}</Typography>
                    </Box>
                  </TableCell>
                  {board.use_like && (
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <LikeIcon fontSize="small" color="action" />
                        <Typography variant="body2">{post.like_count}</Typography>
                      </Box>
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(post.created_at)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="페이지당 게시글:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 전체 ${count}개`}
      />
    </Box>
  );
};

export default PostList;
