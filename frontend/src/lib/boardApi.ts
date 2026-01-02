import axios, { AxiosError } from 'axios';
import type {
  Board,
  Post,
  PostListResponse,
  PostFormData,
  Comment,
  CommentFormData,
  ApiResponse,
  PostQueryParams
} from '../types/board';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Axios instance with credentials
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Error handler
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<never>>;
    const message = axiosError.response?.data?.message || axiosError.message || '요청 처리 중 오류가 발생했습니다.';
    const errorCode = axiosError.response?.data?.error_code || 'UNKNOWN_ERROR';
    throw new Error(`[${errorCode}] ${message}`);
  }
  throw new Error('알 수 없는 오류가 발생했습니다.');
};

// ========================================
// Board APIs
// ========================================

/**
 * 게시판 목록 조회
 */
export const fetchBoards = async (): Promise<Board[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Board[]>>('/api/boards');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '게시판 목록 조회에 실패했습니다.');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 게시판 상세 조회
 */
export const fetchBoardByCode = async (boardCode: string): Promise<Board> => {
  try {
    const response = await apiClient.get<ApiResponse<Board>>(`/api/boards/${boardCode}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '게시판 조회에 실패했습니다.');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// ========================================
// Post APIs
// ========================================

/**
 * 게시글 목록 조회
 */
export const fetchPosts = async (
  boardCode: string,
  params?: PostQueryParams
): Promise<PostListResponse> => {
  try {
    const response = await apiClient.get<ApiResponse<PostListResponse>>(
      `/api/boards/${boardCode}/posts`,
      { params }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '게시글 목록 조회에 실패했습니다.');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 게시글 상세 조회
 */
export const fetchPostById = async (
  boardCode: string,
  postId: number,
  secretPassword?: string
): Promise<Post> => {
  try {
    const response = await apiClient.get<ApiResponse<Post>>(
      `/api/boards/${boardCode}/posts/${postId}`,
      {
        params: secretPassword ? { secretPassword } : undefined
      }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '게시글 조회에 실패했습니다.');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 게시글 작성
 */
export const createPost = async (
  boardCode: string,
  formData: PostFormData
): Promise<{ id: number; message: string }> => {
  try {
    const response = await apiClient.post<ApiResponse<{ id: number; message: string }>>(
      `/api/boards/${boardCode}/posts`,
      formData
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '게시글 작성에 실패했습니다.');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 게시글 수정
 */
export const updatePost = async (
  boardCode: string,
  postId: number,
  formData: Partial<PostFormData>
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(
      `/api/boards/${boardCode}/posts/${postId}`,
      formData
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '게시글 수정에 실패했습니다.');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 게시글 삭제
 */
export const deletePost = async (
  boardCode: string,
  postId: number
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/api/boards/${boardCode}/posts/${postId}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '게시글 삭제에 실패했습니다.');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// ========================================
// Comment APIs
// ========================================

/**
 * 댓글 목록 조회
 */
export const fetchComments = async (boardCode: string, postId: number): Promise<Comment[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Comment[]>>(
      `/api/boards/${boardCode}/posts/${postId}/comments`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '댓글 조회에 실패했습니다.');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 댓글 작성
 */
export const createComment = async (
  boardCode: string,
  postId: number,
  formData: CommentFormData
): Promise<{ id: number; message: string }> => {
  try {
    const response = await apiClient.post<ApiResponse<{ id: number; message: string }>>(
      `/api/boards/${boardCode}/posts/${postId}/comments`,
      formData
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '댓글 작성에 실패했습니다.');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 댓글 수정
 */
export const updateComment = async (
  boardCode: string,
  postId: number,
  commentId: number,
  formData: Partial<CommentFormData>
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(
      `/api/boards/${boardCode}/posts/${postId}/comments/${commentId}`,
      formData
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '댓글 수정에 실패했습니다.');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 댓글 삭제
 */
export const deleteComment = async (
  boardCode: string,
  postId: number,
  commentId: number
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/api/boards/${boardCode}/posts/${postId}/comments/${commentId}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '댓글 삭제에 실패했습니다.');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};
