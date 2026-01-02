// Board Types (그누보드 스타일)
export type BoardType = 'notice' | 'free' | 'qna' | 'gallery' | 'faq' | 'review';
export type ListViewType = 'list' | 'gallery' | 'webzine' | 'blog';
export type PermissionType = 'public' | 'member' | 'admin';
export type CommentPermissionType = 'public' | 'member' | 'admin' | 'disabled';

// Tenant (멀티사이트)
export interface Tenant {
  id: number;
  tenant_code: string;
  tenant_name: string;
  domain: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Board {
  id: number;
  tenant_id: number;           // 테넌트 ID (멀티사이트)
  tenant_name?: string;        // 테넌트 이름 (조회용)
  board_code: string;
  board_name: string;
  description: string | null;
  board_type: BoardType;

  // Permissions
  read_permission: PermissionType;
  write_permission: PermissionType;
  comment_permission: CommentPermissionType;

  // View Settings
  list_view_type: ListViewType;
  posts_per_page: number;
  gallery_cols: number;

  // Features
  use_category: boolean;
  use_notice: boolean;
  use_secret: boolean;
  use_attachment: boolean;
  use_like: boolean;
  use_comment: boolean;
  use_thumbnail: boolean;
  use_top_fixed: boolean;
  use_display_period: boolean;

  // File Settings
  max_file_size: number;
  max_file_count: number;
  allowed_file_types: string;
  thumbnail_width: number;
  thumbnail_height: number;

  // Display
  display_order: number;

  created_at: string;
  updated_at: string;

  // Optional categories
  categories?: BoardCategory[];
}

export interface BoardCategory {
  id: number;
  category_name: string;
  category_order: number;
}

// Post Types (그누보드 스타일)
export type ReadTarget = 'all' | 'author' | 'group';

export interface Post {
  id: number;
  board_id: number;
  category_id: number | null;
  category_name: string | null;

  title: string;
  content: string;
  author: string;
  author_id: string | null;

  // 공지/비밀글 설정
  is_notice: boolean;
  is_secret: boolean;

  // 읽기 권한 설정 (그누보드 스타일)
  read_target: ReadTarget;
  target_group_ids: string | null;

  // 노출 기간 설정
  display_start_date: string | null;
  display_end_date: string | null;

  // 상위 고정 설정
  is_top_fixed: boolean;
  top_fixed_order: number;
  top_fixed_end_date: string | null;

  // 그누보드 옵션
  wr_option: string;
  wr_link1: string;
  wr_link2: string;

  // 썸네일
  thumbnail_path: string | null;

  // 카운트
  view_count: number;
  like_count: number;
  comment_count: number;
  file_count: number;

  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;

  attachments?: Attachment[];
}

export interface PostListItem {
  id: number;
  title: string;
  author: string;
  is_notice: boolean;
  is_secret: boolean;
  is_top_fixed: boolean;
  thumbnail_path: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  file_count: number;
  created_at: string;
  updated_at: string;
  category_name: string | null;
}

export interface PostFormData {
  categoryId?: number;
  title: string;
  content: string;
  isNotice?: boolean;
  isSecret?: boolean;
  secretPassword?: string;
  // 그누보드 스타일 추가 옵션
  readTarget?: ReadTarget;
  targetGroupIds?: string;
  displayStartDate?: string;
  displayEndDate?: string;
  isTopFixed?: boolean;
  topFixedOrder?: number;
  topFixedEndDate?: string;
  wrOption?: string;
  wrLink1?: string;
  wrLink2?: string;
}

// Comment Types
export interface Comment {
  id: number;
  post_id: number;
  parent_id: number | null;
  content: string;
  author: string;
  is_secret: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface CommentFormData {
  content: string;
  parentId?: number;
  isSecret?: boolean;
}

// Attachment Types
export interface Attachment {
  id: number;
  post_id: number;
  original_name: string;
  stored_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_ext: string;
  is_image: boolean;
  image_width: number | null;
  image_height: number | null;
  thumbnail_path: string | null;
  download_count: number;
  created_at: string;
}

// Admin Board Form Types
export interface BoardFormData {
  tenant_id?: number;          // 테넌트 ID (멀티사이트)
  board_code: string;
  board_name: string;
  description?: string;
  board_type: BoardType;

  // Permissions
  read_permission: PermissionType;
  write_permission: PermissionType;
  comment_permission: CommentPermissionType;

  // View Settings
  list_view_type: ListViewType;
  posts_per_page: number;
  gallery_cols: number;

  // Features
  use_category: boolean;
  use_notice: boolean;
  use_secret: boolean;
  use_attachment: boolean;
  use_like: boolean;
  use_comment: boolean;
  use_thumbnail: boolean;
  use_top_fixed: boolean;
  use_display_period: boolean;

  // File Settings
  max_file_size: number;
  max_file_count: number;
  allowed_file_types: string;
  thumbnail_width: number;
  thumbnail_height: number;

  display_order: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error_code?: string;
  message?: string;
}

export interface PostListResponse {
  posts: PostListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Query Params
export interface PostQueryParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  search?: string;
}
