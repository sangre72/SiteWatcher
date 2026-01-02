import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { fetchBoardByCode, fetchPostById, createPost, updatePost } from '../../lib/boardApi';
import type { Board, Post, PostFormData } from '../../types/board';

const PostForm: React.FC = () => {
  const { boardCode, postId } = useParams<{ boardCode: string; postId?: string }>();
  const navigate = useNavigate();
  const isEditMode = !!postId;

  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PostFormData>({
    categoryId: undefined,
    title: '',
    content: '',
    isNotice: false,
    isSecret: false,
    secretPassword: ''
  });

  useEffect(() => {
    if (boardCode) {
      loadBoard();
    }
  }, [boardCode]);

  useEffect(() => {
    if (board && isEditMode && postId) {
      loadPost();
    } else {
      setLoading(false);
    }
  }, [board, isEditMode, postId]);

  const loadBoard = async () => {
    if (!boardCode) return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchBoardByCode(boardCode);
      setBoard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시판 정보를 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  const loadPost = async () => {
    if (!boardCode || !postId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchPostById(boardCode, parseInt(postId));
      setFormData({
        categoryId: data.category_id || undefined,
        title: data.title,
        content: data.content,
        isNotice: data.is_notice,
        isSecret: data.is_secret,
        secretPassword: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!boardCode) return;

    // Validation
    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    if (formData.isSecret && !isEditMode && !formData.secretPassword) {
      setError('비밀글 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (isEditMode && postId) {
        await updatePost(boardCode, parseInt(postId), {
          categoryId: formData.categoryId,
          title: formData.title,
          content: formData.content
        });
        navigate(`/boards/${boardCode}/posts/${postId}`);
      } else {
        const result = await createPost(boardCode, formData);
        navigate(`/boards/${boardCode}/posts/${result.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode && postId) {
      navigate(`/boards/${boardCode}/posts/${postId}`);
    } else {
      navigate(`/boards/${boardCode}`);
    }
  };

  if (loading) {
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
      <Typography variant="h4" gutterBottom>
        {isEditMode ? '게시글 수정' : '게시글 작성'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          {/* Category Select */}
          {board.use_category && board.categories && board.categories.length > 0 && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>카테고리</InputLabel>
              <Select
                value={formData.categoryId || ''}
                label="카테고리"
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value as number })
                }
              >
                <MenuItem value="">선택안함</MenuItem>
                {board.categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Title */}
          <TextField
            fullWidth
            label="제목"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            sx={{ mb: 2 }}
            inputProps={{ maxLength: 500 }}
          />

          {/* Content */}
          <TextField
            fullWidth
            label="내용"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            multiline
            rows={15}
            sx={{ mb: 2 }}
            inputProps={{ maxLength: 100000 }}
          />

          {/* Options */}
          <Box display="flex" gap={2} mb={3}>
            {board.use_notice && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isNotice}
                    onChange={(e) => setFormData({ ...formData, isNotice: e.target.checked })}
                  />
                }
                label="공지사항"
              />
            )}
            {board.use_secret && !isEditMode && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isSecret}
                    onChange={(e) => setFormData({ ...formData, isSecret: e.target.checked })}
                  />
                }
                label="비밀글"
              />
            )}
          </Box>

          {/* Secret Password */}
          {board.use_secret && formData.isSecret && !isEditMode && (
            <TextField
              fullWidth
              type="password"
              label="비밀번호"
              value={formData.secretPassword}
              onChange={(e) => setFormData({ ...formData, secretPassword: e.target.value })}
              required
              sx={{ mb: 3 }}
              helperText="비밀글 열람 시 필요한 비밀번호를 입력해주세요."
            />
          )}

          {/* Action Buttons */}
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={submitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : isEditMode ? '수정' : '등록'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default PostForm;
