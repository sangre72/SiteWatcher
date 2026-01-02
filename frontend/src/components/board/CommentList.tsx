import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  IconButton,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon
} from '@mui/icons-material';
import {
  fetchComments,
  createComment,
  updateComment,
  deleteComment
} from '../../lib/boardApi';
import type { Comment, CommentFormData } from '../../types/board';

interface CommentListProps {
  boardCode: string;
  postId: number;
}

const CommentList: React.FC<CommentListProps> = ({ boardCode, postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySecret, setReplySecret] = useState(false);

  useEffect(() => {
    loadComments();
  }, [boardCode, postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchComments(boardCode, postId);
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async () => {
    if (!newComment.trim()) {
      setError('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const formData: CommentFormData = {
        content: newComment,
        isSecret
      };

      await createComment(boardCode, postId, formData);
      setNewComment('');
      setIsSecret(false);
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateReply = async (parentId: number) => {
    if (!replyContent.trim()) {
      setError('답글 내용을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const formData: CommentFormData = {
        content: replyContent,
        parentId,
        isSecret: replySecret
      };

      await createComment(boardCode, postId, formData);
      setReplyingTo(null);
      setReplyContent('');
      setReplySecret(false);
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : '답글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editContent.trim()) {
      setError('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await updateComment(boardCode, postId, commentId, { content: editContent });
      setEditingId(null);
      setEditContent('');
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setError(null);
      await deleteComment(boardCode, postId, commentId);
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글 삭제에 실패했습니다.');
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const startReply = (commentId: number) => {
    setReplyingTo(commentId);
    setReplyContent('');
    setReplySecret(false);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
    setReplySecret(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  // 댓글을 트리 구조로 정렬 (부모 댓글 바로 아래 답글 표시)
  const parentComments = comments.filter(c => !c.parent_id);
  const childComments = comments.filter(c => c.parent_id);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        댓글 ({comments.length})
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* New Comment Form */}
      <Box mb={3}>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="댓글을 입력하세요"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={submitting}
        />
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isSecret}
                onChange={(e) => setIsSecret(e.target.checked)}
                disabled={submitting}
              />
            }
            label="비밀댓글"
          />
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleCreateComment}
            disabled={submitting || !newComment.trim()}
          >
            댓글 작성
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Comment List */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress />
        </Box>
      ) : comments.length === 0 ? (
        <Box textAlign="center" py={3}>
          <Typography variant="body2" color="text.secondary">
            첫 댓글을 작성해보세요.
          </Typography>
        </Box>
      ) : (
        <Box>
          {parentComments.map((comment) => (
            <Box key={comment.id} mb={2}>
              {/* Parent Comment */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box>
                    <Typography variant="subtitle2">
                      {comment.author}
                      {comment.is_secret && (
                        <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                          (비밀)
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(comment.created_at)}
                      {comment.created_at !== comment.updated_at && ' (수정됨)'}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => startReply(comment.id)}>
                      <ReplyIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => startEdit(comment)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteComment(comment.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {editingId === comment.id ? (
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      disabled={submitting}
                    />
                    <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                      <Button size="small" onClick={cancelEdit}>
                        취소
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleUpdateComment(comment.id)}
                        disabled={submitting}
                      >
                        수정
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {comment.content}
                  </Typography>
                )}

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <Box mt={2} pl={2} sx={{ borderLeft: 2, borderColor: 'divider' }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="답글을 입력하세요"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      disabled={submitting}
                    />
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={replySecret}
                            onChange={(e) => setReplySecret(e.target.checked)}
                            disabled={submitting}
                          />
                        }
                        label="비밀댓글"
                      />
                      <Box>
                        <Button size="small" onClick={cancelReply} sx={{ mr: 1 }}>
                          취소
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleCreateReply(comment.id)}
                          disabled={submitting || !replyContent.trim()}
                        >
                          답글 작성
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Child Comments (Replies) */}
              {childComments
                .filter(c => c.parent_id === comment.id)
                .map((reply) => (
                  <Box
                    key={reply.id}
                    sx={{
                      ml: 4,
                      mt: 1,
                      p: 2,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      borderLeft: 2,
                      borderColor: 'primary.main'
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box>
                        <Typography variant="subtitle2">
                          {reply.author}
                          {reply.is_secret && (
                            <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                              (비밀)
                            </Typography>
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(reply.created_at)}
                          {reply.created_at !== reply.updated_at && ' (수정됨)'}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => startEdit(reply)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteComment(reply.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {editingId === reply.id ? (
                      <Box>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          disabled={submitting}
                        />
                        <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                          <Button size="small" onClick={cancelEdit}>
                            취소
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleUpdateComment(reply.id)}
                            disabled={submitting}
                          >
                            수정
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {reply.content}
                      </Typography>
                    )}
                  </Box>
                ))}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default CommentList;
