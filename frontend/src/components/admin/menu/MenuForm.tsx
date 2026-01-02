/**
 * Menu Form Component
 * 메뉴 상세/편집 폼 (우측 패널) - MUI 테마 색상 사용
 */

import CancelIcon from '@mui/icons-material/Cancel';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderIcon from '@mui/icons-material/Folder';
import SaveIcon from '@mui/icons-material/Save';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { LinkType, Menu, MenuFormData, PermissionType, ShowCondition } from '../../../types/menu';

interface MenuFormProps {
  menu: Menu | null;
  parentMenuName?: string;
  parentMenuPath?: { id: number; name: string }[]; // 전체 경로 Breadcrumb용
  isAddMode?: boolean;
  onSave: (data: MenuFormData) => Promise<void>;
  onCancel: () => void;
}

const MenuForm: React.FC<MenuFormProps> = ({ menu, parentMenuName, parentMenuPath, isAddMode, onSave, onCancel }) => {
  const [formData, setFormData] = useState<MenuFormData>({
    menu_type: 'user',
    parent_id: null,
    menu_name: '',
    menu_code: '',
    description: '',
    icon: '',
    link_type: 'url',
    link_url: '',
    permission_type: 'member',
    show_condition: 'always',
    sort_order: 0,
    is_visible: true,
    is_active: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (menu) {
      setFormData({
        menu_type: menu.menu_type,
        parent_id: menu.parent_id,
        menu_name: menu.menu_name,
        menu_code: menu.menu_code,
        description: menu.description || '',
        icon: menu.icon || '',
        link_type: menu.link_type,
        link_url: menu.link_url || '',
        permission_type: menu.permission_type,
        show_condition: menu.show_condition,
        sort_order: menu.sort_order,
        is_visible: menu.is_visible,
        is_active: menu.is_active,
      });
    } else if (isAddMode) {
      // 추가 모드일 때 폼 초기화
      setFormData({
        menu_type: 'user',
        parent_id: null,
        menu_name: '',
        menu_code: '',
        description: '',
        icon: '',
        link_type: 'url',
        link_url: '',
        permission_type: 'member',
        show_condition: 'always',
        sort_order: 0,
        is_visible: true,
        is_active: true,
      });
    }
  }, [menu, isAddMode]);

  const handleChange = (field: keyof MenuFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.menu_name.trim()) {
      setError('메뉴명은 필수입니다.');
      return;
    }

    if (!formData.menu_code.trim()) {
      setError('메뉴 코드는 필수입니다.');
      return;
    }

    // 메뉴 코드 검증 (영문, 숫자, 언더스코어만 허용)
    if (!/^[a-zA-Z0-9_]+$/.test(formData.menu_code)) {
      setError('메뉴 코드는 영문, 숫자, 언더스코어(_)만 사용할 수 있습니다.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(formData);
    } catch (err: any) {
      setError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 메뉴 선택/추가 모드가 아닌 경우 안내 메시지 표시
  if (!menu && !isAddMode) {
    return (
      <Box
        sx={(theme) => ({
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.palette.text.disabled,
        })}
      >
        <Typography variant="body1">메뉴를 선택하거나 추가해주세요</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={(theme) => ({
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.paper,
      })}
    >
      {/* Header */}
      <Box
        sx={(theme) => ({
          p: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.grey[50],
        })}
      >
        <Typography
          variant="subtitle2"
          sx={(theme) => ({
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: 1,
          })}
        >
          {menu ? '메뉴 수정' : '새 메뉴 추가'}
        </Typography>

        {/* 현재 위치 표시 (Breadcrumb) - 테마 색상 사용 */}
        <Box
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            flexWrap: 'wrap',
            mb: 1,
            p: 1,
            bgcolor: theme.palette.background.default,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Chip
            label="사용자"
            size="small"
            sx={(theme) => ({
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              fontWeight: 500,
              fontSize: 11,
              height: 22,
            })}
          />
          <ChevronRightIcon sx={(theme) => ({ fontSize: 16, color: theme.palette.text.disabled })} />
          {/* parentMenuPath가 있으면 전체 경로 표시 */}
          {parentMenuPath && parentMenuPath.length > 0 ? (
            <>
              {parentMenuPath.map((item, index) => (
                <React.Fragment key={item.id}>
                  <Chip
                    label={item.name}
                    size="small"
                    sx={(theme) => ({
                      bgcolor: theme.palette.grey[200],
                      color: theme.palette.text.primary,
                      fontSize: 11,
                      height: 22,
                    })}
                  />
                  <ChevronRightIcon sx={(theme) => ({ fontSize: 16, color: theme.palette.text.disabled })} />
                </React.Fragment>
              ))}
              <Chip
                label={formData.menu_name || '(새 메뉴)'}
                size="small"
                sx={(theme) => ({
                  bgcolor: theme.palette.info.light,
                  color: theme.palette.info.contrastText,
                  fontWeight: 500,
                  fontSize: 11,
                  height: 22,
                })}
              />
            </>
          ) : parentMenuName ? (
            <>
              <Chip
                label={parentMenuName}
                size="small"
                sx={(theme) => ({
                  bgcolor: theme.palette.grey[200],
                  color: theme.palette.text.primary,
                  fontSize: 11,
                  height: 22,
                })}
              />
              <ChevronRightIcon sx={(theme) => ({ fontSize: 16, color: theme.palette.text.disabled })} />
              <Chip
                label={formData.menu_name || '(새 메뉴)'}
                size="small"
                sx={(theme) => ({
                  bgcolor: theme.palette.info.light,
                  color: theme.palette.info.contrastText,
                  fontWeight: 500,
                  fontSize: 11,
                  height: 22,
                })}
              />
            </>
          ) : (
            <Chip
              label={formData.menu_name || '(최상위 메뉴)'}
              size="small"
              sx={(theme) => ({
                bgcolor: theme.palette.info.light,
                color: theme.palette.info.contrastText,
                fontWeight: 500,
                fontSize: 11,
                height: 22,
              })}
            />
          )}
        </Box>

        {/* 부모 메뉴 명시적 표시 */}
        {parentMenuName && (
          <Box
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: theme.palette.text.secondary,
            })}
          >
            <FolderIcon sx={(theme) => ({ fontSize: 16, color: theme.palette.warning.main })} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              상위 메뉴: <strong>{parentMenuName}</strong>
            </Typography>
          </Box>
        )}
        {!parentMenuName && !isAddMode && menu && (
          <Box
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: theme.palette.text.disabled,
            })}
          >
          </Box>
        )}
      </Box>

      {/* Form */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={(theme) => ({
          flex: 1,
          overflow: 'auto',
          p: 2,
          // 스크롤바 스타일
          '&::-webkit-scrollbar': { width: 8 },
          '&::-webkit-scrollbar-track': { bgcolor: theme.palette.grey[100] },
          '&::-webkit-scrollbar-thumb': { bgcolor: theme.palette.grey[400], borderRadius: 4 },
          '&::-webkit-scrollbar-thumb:hover': { bgcolor: theme.palette.grey[500] },
        })}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* 기본 정보 */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                기본 정보
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="메뉴명"
                    value={formData.menu_name}
                    onChange={(e) => handleChange('menu_name', e.target.value)}
                    size="small"
                    inputProps={{ maxLength: 100 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="메뉴 코드"
                    value={formData.menu_code}
                    onChange={(e) => handleChange('menu_code', e.target.value)}
                    size="small"
                    disabled={!!menu}
                    inputProps={{ maxLength: 50 }}
                    helperText="영문, 숫자, 언더스코어(_)만 사용 가능 (수정 불가)"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="설명"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    size="small"
                    multiline
                    rows={2}
                    inputProps={{ maxLength: 500 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="아이콘 (Material Design Icon)"
                    value={formData.icon}
                    onChange={(e) => handleChange('icon', e.target.value)}
                    size="small"
                    placeholder="예: mdi-account-circle"
                    inputProps={{ maxLength: 100 }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* 연동 설정 */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                연동 설정
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>연동 타입</InputLabel>
                    <Select
                      value={formData.link_type}
                      onChange={(e) => handleChange('link_type', e.target.value as LinkType)}
                      label="연동 타입"
                    >
                      <MenuItem value="url">URL</MenuItem>
                      <MenuItem value="new_window">새창</MenuItem>
                      <MenuItem value="modal">모달</MenuItem>
                      <MenuItem value="external">외부 링크</MenuItem>
                      <MenuItem value="none">없음</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {formData.link_type !== 'none' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="링크 URL"
                      value={formData.link_url}
                      onChange={(e) => handleChange('link_url', e.target.value)}
                      size="small"
                      placeholder="/mypage/profile"
                      inputProps={{ maxLength: 1000 }}
                    />
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* 권한 설정 */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                권한 설정
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>권한 타입</InputLabel>
                    <Select
                      value={formData.permission_type}
                      onChange={(e) => handleChange('permission_type', e.target.value as PermissionType)}
                      label="권한 타입"
                    >
                      <MenuItem value="public">전체 공개</MenuItem>
                      <MenuItem value="member">로그인 회원</MenuItem>
                      <MenuItem value="groups">특정 그룹</MenuItem>
                      <MenuItem value="users">특정 사용자</MenuItem>
                      <MenuItem value="roles">특정 역할</MenuItem>
                      <MenuItem value="admin">관리자</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>표시 조건</InputLabel>
                    <Select
                      value={formData.show_condition}
                      onChange={(e) => handleChange('show_condition', e.target.value as ShowCondition)}
                      label="표시 조건"
                    >
                      <MenuItem value="always">항상 표시</MenuItem>
                      <MenuItem value="logged_in">로그인 시</MenuItem>
                      <MenuItem value="logged_out">로그아웃 시</MenuItem>
                      <MenuItem value="custom">사용자 정의</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* 기타 설정 */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                기타 설정
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="정렬 순서"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => handleChange('sort_order', parseInt(e.target.value) || 0)}
                    size="small"
                  />
                </Grid>

                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_visible}
                        onChange={(e) => handleChange('is_visible', e.target.checked)}
                      />
                    }
                    label="표시"
                  />
                </Grid>

                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_active}
                        onChange={(e) => handleChange('is_active', e.target.checked)}
                      />
                    }
                    label="활성화"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Actions */}
      <Box
        sx={(theme) => ({
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.grey[50],
          display: 'flex',
          gap: 1,
          justifyContent: 'flex-end',
        })}
      >
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={onCancel}
          disabled={isSaving}
        >
          취소
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          type="submit"
          onClick={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </Box>
    </Box>
  );
};

export default MenuForm;
