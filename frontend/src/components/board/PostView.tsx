import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ThumbUp as LikeIcon,
  Comment as CommentIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { fetchPostById, deletePost } from '../../lib/boardApi';
import CommentList from './CommentList';
import type { Post } from '../../types/board';

const PostView: React.FC = () => {
  const { boardCode, postId } = useParams<{ boardCode: string; postId: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const [secretPassword, setSecretPassword] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (boardCode && postId) {
      loadPost();
    }
  }, [boardCode, postId]);

  const loadPost = async (password?: string) => {
    if (!boardCode || !postId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchPostById(boardCode, parseInt(postId), password);
      setPost(data);
      setSecretDialogOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다.';

      // 비밀글 비밀번호 필요
      if (errorMessage.includes('SECRET_POST_PASSWORD_REQUIRED')) {
        setSecretDialogOpen(true);
      } else if (errorMessage.includes('SECRET_POST_INVALID_PASSWORD')) {
        setError('비밀번호가 올바르지 않습니다.');
        setSecretDialogOpen(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSecretPasswordSubmit = () => {
    if (!secretPassword.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    loadPost(secretPassword);
  };

  const handleDelete = async () => {
    if (!boardCode || !postId) return;

    try {
      await deletePost(boardCode, parseInt(postId));
      navigate(`/boards/${boardCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글 삭제에 실패했습니다.');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Navigation */}
      <Box mb={2}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(`/boards/${boardCode}`)}
        >
          목록으로
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Post Content */}
      {post && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            {/* Header */}
            <Box mb={2}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {post.is_notice && (
                  <Chip label="공지" color="error" size="small" />
                )}
                {post.category_name && (
                  <Chip label={post.category_name} size="small" variant="outlined" />
                )}
              </Box>
              <Typography variant="h5" gutterBottom>
                {post.title}
              </Typography>
            </Box>

            {/* Meta Info */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" gap={2}>
                <Typography variant="body2" color="text.secondary">
                  작성자: {post.author}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  작성일: {formatDate(post.created_at)}
                </Typography>
                {post.created_at !== post.updated_at && (
                  <Typography variant="body2" color="text.secondary">
                    수정일: {formatDate(post.updated_at)}
                  </Typography>
                )}
              </Box>
              <Box display="flex" gap={2}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <ViewIcon fontSize="small" color="action" />
                  <Typography variant="body2">{post.view_count}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <LikeIcon fontSize="small" color="action" />
                  <Typography variant="body2">{post.like_count}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <CommentIcon fontSize="small" color="action" />
                  <Typography variant="body2">{post.comment_count}</Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Content */}
            <Box sx={{ minHeight: 200, whiteSpace: 'pre-wrap', mb: 3 }}>
              <Typography variant="body1">{post.content}</Typography>
            </Box>

            {/* Attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    첨부파일 ({post.attachments.length})
                  </Typography>
                  {post.attachments.map((file) => (
                    <Box
                      key={file.id}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      p={1}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <Box>
                        <Typography variant="body2">{file.original_filename}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.file_size)} · 다운로드 {file.download_count}회
                        </Typography>
                      </Box>
                      <IconButton size="small">
                        <DownloadIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {/* Action Buttons */}
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between">
              <Button
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={() => navigate(`/boards/${boardCode}`)}
              >
                목록
              </Button>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/boards/${boardCode}/posts/${postId}/edit`)}
                >
                  수정
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  삭제
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Comments */}
          {boardCode && (
            <CommentList boardCode={boardCode} postId={parseInt(postId!)} />
          )}
        </>
      )}

      {/* Secret Password Dialog */}
      <Dialog open={secretDialogOpen} onClose={() => setSecretDialogOpen(false)}>
        <DialogTitle>비밀글 비밀번호</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            이 게시글은 비밀글입니다. 비밀번호를 입력해주세요.
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="비밀번호"
            value={secretPassword}
            onChange={(e) => setSecretPassword(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSecretPasswordSubmit();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSecretDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSecretPasswordSubmit}>
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>게시글 삭제</DialogTitle>
        <DialogContent>
          <Typography>정말로 이 게시글을 삭제하시겠습니까?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PostView;
