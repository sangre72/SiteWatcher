/**
 * Menu API Client
 * 메뉴 관리 API 호출 함수
 */

import axios from 'axios';
import { Menu, MenuFormData, ApiResponse } from '../types/menu';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler
const handleError = (error: any): never => {
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  }
  if (error.message) {
    throw new Error(error.message);
  }
  throw new Error('요청 중 오류가 발생했습니다.');
};

/**
 * 메뉴 목록 조회 (관리자)
 */
export const getAllMenus = async (menuType?: string): Promise<Menu[]> => {
  try {
    const params = menuType ? { type: menuType } : {};
    const response = await apiClient.get<ApiResponse<Menu[]>>('/api/admin/menus', { params });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '메뉴 조회에 실패했습니다.');
    }

    return response.data.data;
  } catch (error) {
    return handleError(error);
  }
};

/**
 * 메뉴 상세 조회
 */
export const getMenuById = async (id: number): Promise<Menu> => {
  try {
    const response = await apiClient.get<ApiResponse<Menu>>(`/api/admin/menus/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '메뉴 조회에 실패했습니다.');
    }

    return response.data.data;
  } catch (error) {
    return handleError(error);
  }
};

/**
 * 메뉴 생성
 */
export const createMenu = async (data: MenuFormData): Promise<{ id: number; message: string }> => {
  try {
    const response = await apiClient.post<ApiResponse<{ id: number; message: string }>>(
      '/api/admin/menus',
      data
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '메뉴 생성에 실패했습니다.');
    }

    return response.data.data;
  } catch (error) {
    return handleError(error);
  }
};

/**
 * 메뉴 수정
 */
export const updateMenu = async (id: number, data: Partial<MenuFormData>): Promise<void> => {
  try {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(
      `/api/admin/menus/${id}`,
      data
    );

    if (!response.data.success) {
      throw new Error(response.data.message || '메뉴 수정에 실패했습니다.');
    }
  } catch (error) {
    return handleError(error);
  }
};

/**
 * 메뉴 삭제
 */
export const deleteMenu = async (id: number): Promise<void> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/api/admin/menus/${id}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || '메뉴 삭제에 실패했습니다.');
    }
  } catch (error) {
    return handleError(error);
  }
};

/**
 * 메뉴 순서 변경
 */
export const reorderMenus = async (orderedIds: number[]): Promise<void> => {
  try {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(
      '/api/admin/menus/reorder',
      { orderedIds }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || '메뉴 순서 변경에 실패했습니다.');
    }
  } catch (error) {
    return handleError(error);
  }
};

/**
 * 메뉴 이동 (부모 변경 + 순서 변경)
 */
export const moveMenu = async (
  id: number,
  parentId: number | null,
  sortOrder: number
): Promise<void> => {
  try {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(
      `/api/admin/menus/${id}/move`,
      { parent_id: parentId, sort_order: sortOrder }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || '메뉴 이동에 실패했습니다.');
    }
  } catch (error) {
    return handleError(error);
  }
};
