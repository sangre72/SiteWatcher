/**
 * Tenant Management Component
 * 테넌트(멀티사이트) 관리 페이지
 */
import React, { useState, useEffect, useCallback } from 'react';
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
  Tooltip,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Close as CloseIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import type { Tenant } from '../../types/board';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface TenantFormData {
  tenant_code: string;
  tenant_name: string;
  domain: string;
  subdomain: string;
  description: string;
  logo_url: string;
  theme_color: string;
  language: string;
  timezone: string;
  admin_email: string;
  admin_name: string;
  is_active: boolean;
}

const defaultFormData: TenantFormData = {
  tenant_code: '',
  tenant_name: '',
  domain: '',
  subdomain: '',
  description: '',
  logo_url: '',
  theme_color: '#1976d2',
  language: 'ko',
  timezone: 'Asia/Seoul',
  admin_email: '',
  admin_name: '',
  is_active: true
};

const TenantManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tableWarning, setTableWarning] = useState<{ message: string; schemaPath: string } | null>(null);

  // 폼 다이얼로그
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<TenantFormData>(defaultFormData);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 삭제 다이얼로그
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);

  const loadTenants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setTableWarning(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tenants`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || '테넌트 목록 조회에 실패했습니다.');
      }
      setTenants(data.data || []);
      // 테이블 존재하지 않음 경고
      if (data.warning && data.schema_path) {
        setTableWarning({
          message: data.warning,
          schemaPath: data.schema_path
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadTenants();
  }, [isLoggedIn, user, navigate, loadTenants]);

  const handleOpenForm = (tenant?: Tenant) => {
    if (tenant) {
      setEditingId(tenant.id);
      setFormData({
        tenant_code: tenant.tenant_code,
        tenant_name: tenant.tenant_name,
        domain: tenant.domain || '',
        subdomain: '',
        description: tenant.description || '',
        logo_url: '',
        theme_color: '#1976d2',
        language: 'ko',
        timezone: 'Asia/Seoul',
        admin_email: '',
        admin_name: '',
        is_active: tenant.is_active
      });
    } else {
      setEditingId(null);
      setFormData(defaultFormData);
    }
    setFormError(null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormData(defaultFormData);
    setFormError(null);
  };

  const handleFormChange = (field: keyof TenantFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setFormError(null);
    setIsSaving(true);

    try {
      // 유효성 검사
      if (!formData.tenant_code.trim()) {
        throw new Error('테넌트 코드를 입력하세요.');
      }
      if (!formData.tenant_name.trim()) {
        throw new Error('테넌트 이름을 입력하세요.');
      }

      const url = editingId
        ? `${API_BASE_URL}/api/admin/tenants/${editingId}`
        : `${API_BASE_URL}/api/admin/tenants`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!data.success) {
        // 테이블 미존재 에러 처리
        if (data.error_code === 'TABLE_NOT_EXISTS') {
          setTableWarning({
            message: data.message,
            schemaPath: data.schema_path || 'middleware/node/db/schema/tenant_schema.sql'
          });
          handleCloseForm();
          return;
        }
        throw new Error(data.message || '저장에 실패했습니다.');
      }

      setSuccessMessage(editingId ? '테넌트가 수정되었습니다.' : '테넌트가 생성되었습니다.');
      handleCloseForm();
      loadTenants();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tenant_name: tenant.tenant_name,
          is_active: !tenant.is_active
        })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : '상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tenants/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      setDeleteTarget(null);
      setSuccessMessage('테넌트가 삭제되었습니다.');
      loadTenants();
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
              <BusinessIcon color="primary" />
              <Typography variant="h5" component="h1">
                테넌트 관리
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenForm()}
              disabled={!!tableWarning}
            >
              테넌트 추가
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

          {tableWarning && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {tableWarning.message}
              <Typography variant="body2" sx={{ mt: 1 }}>
                터미널에서 다음 명령어를 실행하세요:
                <code style={{ display: 'block', marginTop: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  mysql -u dbuser -p egov &lt; {tableWarning.schemaPath}
                </code>
              </Typography>
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>코드</TableCell>
                  <TableCell>이름</TableCell>
                  <TableCell>도메인</TableCell>
                  <TableCell>설명</TableCell>
                  <TableCell align="center">활성</TableCell>
                  <TableCell align="center">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        등록된 테넌트가 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  tenants.map((tenant) => (
                    <TableRow key={tenant.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {tenant.tenant_code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {tenant.tenant_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {tenant.domain ? (
                          <Chip label={tenant.domain} size="small" variant="outlined" />
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                          {tenant.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={tenant.is_active}
                          onChange={() => handleToggleActive(tenant)}
                          size="small"
                          disabled={tenant.tenant_code === 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="수정">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenForm(tenant)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget(tenant)}
                            disabled={tenant.tenant_code === 'default'}
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
        <Dialog open={formOpen} onClose={handleCloseForm} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {editingId ? '테넌트 수정' : '테넌트 추가'}
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="테넌트 코드 *"
                  value={formData.tenant_code}
                  onChange={(e) => handleFormChange('tenant_code', e.target.value)}
                  disabled={!!editingId}
                  placeholder="예: site1"
                  helperText="영문 소문자, 숫자, _, - 사용 (3-50자)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="테넌트 이름 *"
                  value={formData.tenant_name}
                  onChange={(e) => handleFormChange('tenant_name', e.target.value)}
                  placeholder="예: 사이트 1"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="도메인"
                  value={formData.domain}
                  onChange={(e) => handleFormChange('domain', e.target.value)}
                  placeholder="예: www.example.com"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="서브도메인"
                  value={formData.subdomain}
                  onChange={(e) => handleFormChange('subdomain', e.target.value)}
                  placeholder="예: blog"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="설명"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="관리자 이름"
                  value={formData.admin_name}
                  onChange={(e) => handleFormChange('admin_name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="관리자 이메일"
                  type="email"
                  value={formData.admin_email}
                  onChange={(e) => handleFormChange('admin_email', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel shrink>테마 색상</InputLabel>
                  <TextField
                    type="color"
                    value={formData.theme_color}
                    onChange={(e) => handleFormChange('theme_color', e.target.value)}
                    sx={{ mt: 2 }}
                  />
                </FormControl>
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
          <DialogTitle>테넌트 삭제</DialogTitle>
          <DialogContent>
            <Typography>
              "{deleteTarget?.tenant_name}" 테넌트를 삭제하시겠습니까?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              테넌트에 연결된 게시판과 데이터는 유지됩니다.
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

export default TenantManagement;
