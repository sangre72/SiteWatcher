import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  LinearProgress,
  Alert,
  Paper
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import type { Board } from '../../types/board';

interface FileUploaderProps {
  board: Board;
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  board,
  files,
  onFilesChange,
  maxFiles
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const maxFileCount = maxFiles || board.max_file_count || 5;
  const maxFileSize = board.max_file_size || 10485760; // 10MB
  const allowedTypes = (board.allowed_file_types || 'jpg,jpeg,png,gif,pdf,zip').split(',');

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  const validateFile = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedTypes.includes(ext)) {
      return `허용되지 않는 파일 형식입니다. (허용: ${allowedTypes.join(', ')})`;
    }
    if (file.size > maxFileSize) {
      return `파일 크기가 ${formatFileSize(maxFileSize)}를 초과합니다.`;
    }
    return null;
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    setError(null);

    const newFiles: File[] = [];
    const errors: string[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      if (files.length + newFiles.length >= maxFileCount) {
        errors.push(`최대 ${maxFileCount}개의 파일만 업로드할 수 있습니다.`);
        break;
      }

      const file = selectedFiles[i];
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        newFiles.push(file);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={handleInputChange}
        accept={allowedTypes.map(ext => `.${ext}`).join(',')}
      />

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragOver ? 'action.hover' : 'background.paper',
          borderStyle: 'dashed',
          borderColor: dragOver ? 'primary.main' : 'divider',
          transition: 'all 0.2s'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon sx={{ fontSize: 48, color: 'action.active', mb: 1 }} />
        <Typography variant="body1" gutterBottom>
          파일을 드래그하거나 클릭하여 업로드
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          최대 {maxFileCount}개, 파일당 {formatFileSize(maxFileSize)} 이하
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          허용 형식: {allowedTypes.join(', ')}
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{error}</pre>
        </Alert>
      )}

      {files.length > 0 && (
        <List sx={{ mt: 2 }}>
          {files.map((file, index) => (
            <ListItem
              key={index}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1
              }}
            >
              {isImageFile(file) ? (
                <ImageIcon sx={{ mr: 2, color: 'primary.main' }} />
              ) : (
                <FileIcon sx={{ mr: 2, color: 'action.active' }} />
              )}
              <ListItemText
                primary={file.name}
                secondary={formatFileSize(file.size)}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleRemoveFile(index)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {files.length} / {maxFileCount} 파일
        </Typography>
      </Box>
    </Box>
  );
};

export default FileUploader;
