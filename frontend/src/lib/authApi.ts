import axios, { AxiosError } from 'axios';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 에러 처리 헬퍼
 */
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<AuthResponse<never>>;
    const errorMessage = axiosError.response?.data?.message || 'An error occurred';
    throw new Error(errorMessage);
  }
  throw error;
};

/**
 * 로그인
 */
export const login = async (credentials: LoginRequest): Promise<User> => {
  try {
    const response = await apiClient.post<AuthResponse<User>>('/api/auth/login', credentials);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Login failed');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 로그아웃
 */
export const logout = async (): Promise<void> => {
  try {
    const response = await apiClient.post<AuthResponse<{ message: string }>>('/api/auth/logout');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Logout failed');
    }
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * 현재 사용자 정보 조회
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await apiClient.get<AuthResponse<User>>('/api/auth/me');
    if (!response.data.success || !response.data.data) {
      return null;
    }
    return response.data.data;
  } catch (error) {
    // 로그인되지 않은 경우 null 반환
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    return handleApiError(error);
  }
};

/**
 * 회원가입
 */
export const register = async (data: RegisterRequest): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post<AuthResponse<{ message: string }>>('/api/auth/register', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Registration failed');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};
