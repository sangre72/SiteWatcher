/**
 * Menu Management Types
 * 메뉴 관리 시스템 타입 정의
 */

export type MenuType = 'site' | 'user' | 'admin' | 'header_utility' | 'footer_utility' | 'quick_menu';
export type LinkType = 'url' | 'new_window' | 'modal' | 'external' | 'none';
export type PermissionType = 'public' | 'member' | 'groups' | 'users' | 'roles' | 'admin';
export type ShowCondition = 'always' | 'logged_in' | 'logged_out' | 'custom';
export type BadgeType = 'none' | 'count' | 'dot' | 'text' | 'api';

export interface Menu {
  id: number;
  menu_type: MenuType;
  parent_id: number | null;
  depth: number;
  sort_order: number;
  path: string;

  menu_name: string;
  menu_code: string;
  description?: string;
  icon?: string;
  virtual_path?: string;

  link_type: LinkType;
  link_url?: string;
  external_url?: string;
  modal_component?: string;
  modal_width?: number;
  modal_height?: number;

  permission_type: PermissionType;
  show_condition: ShowCondition;
  condition_expression?: string;

  is_visible: boolean;
  is_enabled: boolean;
  is_expandable: boolean;
  default_expanded: boolean;

  css_class?: string;
  highlight: boolean;
  highlight_text?: string;
  highlight_color?: string;

  badge_type: BadgeType;
  badge_value?: string;
  badge_color?: string;

  seo_title?: string;
  seo_description?: string;

  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
  is_active: boolean;
  is_deleted: boolean;

  // Relations
  parent_name?: string;
  children?: Menu[];
}

export interface MenuFormData {
  menu_type: MenuType;
  parent_id?: number | null;
  menu_name: string;
  menu_code: string;
  description?: string;
  icon?: string;
  link_type: LinkType;
  link_url?: string;
  permission_type: PermissionType;
  show_condition: ShowCondition;
  sort_order?: number;
  is_visible?: boolean;
  is_active?: boolean;
}

export interface MenuTreeNode {
  id: number;
  menu_name: string;
  menu_code: string;
  parent_id: number | null;
  depth: number;
  children?: MenuTreeNode[];
  is_folder: boolean;
  icon?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error_code?: string;
  message?: string;
}
