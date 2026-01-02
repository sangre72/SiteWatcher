import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Pagination,
  CircularProgress,
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Favorite as LikeIcon,
  ChatBubble as CommentIcon,
  Lock as LockIcon,
  PushPin as PinIcon
} from '@mui/icons-material';
import { fetchBoardByCode, fetchPosts } from '../../lib/boardApi';
import type { Board, PostListItem, Pagination as PaginationType } from '../../types/board';
import { useAuth } from '../../contexts/AuthContext';

const PostGallery: React.FC = () => {
  const { boardCode } = useParams<{ boardCode: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');

  useEffect(() => {
    if (!boardCode) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const boardData = await fetchBoardByCode(boardCode);
        setBoard(boardData);

        const postsData = await fetchPosts(boardCode, {
          page,
          categoryId: categoryId || undefined,
          search: search || undefined
        });
        setPosts(postsData.posts);
        setPagination(postsData.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [boardCode, page, categoryId, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const canWrite = () => {
    if (!board) return false;
    if (board.write_permission === 'public') return true;
    if (board.write_permission === 'member' && isLoggedIn) return true;
    return false;
  };

  const getPlaceholderImage = () => {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23ddd" width="300" height="200"/%3E%3Ctext fill="%23666" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
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

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );
  }

  if (!board) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 4 }}>게시판을 찾을 수 없습니다.</Alert>
      </Container>
    );
  }

  const galleryCols = board.gallery_cols || 4;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h5" component="h1" gutterBottom>
                {board.board_name}
              </Typography>
              {board.description && (
                <Typography variant="body2" color="text.secondary">
                  {board.description}
                </Typography>
              )}
            </Box>
            {canWrite() && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/boards/${boardCode}/write`)}
              >
                글쓰기
              </Button>
            )}
          </Box>

          <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2 }}>
            {board.use_category && board.categories && board.categories.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>카테고리</InputLabel>
                <Select
                  value={categoryId}
                  label="카테고리"
                  onChange={(e) => {
                    setCategoryId(e.target.value as number | '');
                    setPage(1);
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
              size="small"
              placeholder="검색어 입력"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton type="submit" size="small">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ flexGrow: 1, maxWidth: 300 }}
            />
          </Box>
        </Paper>

        {posts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">게시글이 없습니다.</Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={2}>
              {posts.map((post) => (
                <Grid item xs={12} sm={6} md={12 / galleryCols} key={post.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardActionArea
                      component={RouterLink}
                      to={`/boards/${boardCode}/posts/${post.id}`}
                    >
                      <CardMedia
                        component="img"
                        height={board.thumbnail_height || 200}
                        image={post.thumbnail_path || getPlaceholderImage()}
                        alt={post.title}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent>
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                          {post.is_notice && (
                            <Chip label="공지" size="small" color="error" />
                          )}
                          {post.is_top_fixed && (
                            <Chip icon={<PinIcon />} label="고정" size="small" color="warning" />
                          )}
                          {post.is_secret && (
                            <Chip icon={<LockIcon />} label="비밀" size="small" />
                          )}
                          {post.category_name && (
                            <Chip label={post.category_name} size="small" variant="outlined" />
                          )}
                        </Box>
                        <Typography
                          variant="subtitle1"
                          component="h3"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {post.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {post.author} | {new Date(post.created_at).toLocaleDateString()}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ViewIcon fontSize="small" color="action" />
                            <Typography variant="caption">{post.view_count}</Typography>
                          </Box>
                          {board.use_like && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LikeIcon fontSize="small" color="action" />
                              <Typography variant="caption">{post.like_count}</Typography>
                            </Box>
                          )}
                          {board.use_comment && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CommentIcon fontSize="small" color="action" />
                              <Typography variant="caption">{post.comment_count}</Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {pagination && pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}

        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            component={RouterLink}
            to="/boards"
          >
            목록으로
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default PostGallery;
