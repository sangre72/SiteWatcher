import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Announcement as AnnouncementIcon,
  Forum as ForumIcon,
  QuestionAnswer as QnaIcon,
  Photo as GalleryIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { fetchBoards } from '../../lib/boardApi';
import type { Board } from '../../types/board';

const BoardList: React.FC = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBoards();
      setBoards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시판 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getBoardIcon = (boardType: string) => {
    switch (boardType) {
      case 'notice':
        return <AnnouncementIcon fontSize="large" color="primary" />;
      case 'free':
        return <ForumIcon fontSize="large" color="secondary" />;
      case 'qna':
        return <QnaIcon fontSize="large" color="success" />;
      case 'gallery':
        return <GalleryIcon fontSize="large" color="info" />;
      default:
        return <ArticleIcon fontSize="large" color="action" />;
    }
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'public':
        return '전체공개';
      case 'member':
        return '회원전용';
      case 'admin':
        return '관리자';
      default:
        return permission;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        게시판 목록
      </Typography>

      <Grid container spacing={3}>
        {boards.map((board) => (
          <Grid item xs={12} sm={6} md={4} key={board.id}>
            <Card>
              <CardActionArea onClick={() => navigate(`/boards/${board.board_code}`)}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    {getBoardIcon(board.board_type)}
                    <Typography variant="h6" ml={1}>
                      {board.board_name}
                    </Typography>
                  </Box>

                  {board.description && (
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {board.description}
                    </Typography>
                  )}

                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={`읽기: ${getPermissionLabel(board.read_permission)}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`쓰기: ${getPermissionLabel(board.write_permission)}`}
                      size="small"
                      variant="outlined"
                    />
                    {board.use_category && (
                      <Chip label="카테고리" size="small" color="primary" />
                    )}
                    {board.use_attachment && (
                      <Chip label="첨부파일" size="small" color="secondary" />
                    )}
                    {board.use_like && (
                      <Chip label="좋아요" size="small" color="success" />
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {boards.length === 0 && (
        <Box textAlign="center" py={5}>
          <Typography variant="body1" color="text.secondary">
            등록된 게시판이 없습니다.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BoardList;
