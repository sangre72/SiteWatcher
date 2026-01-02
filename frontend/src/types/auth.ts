/**
 * 사용자 정보 타입
 */
export interface User {
  userId: string;
  userName: string;
  email: string | null;
  role: 'admin' | 'member' | 'guest';
  isAdmin: boolean;
}

/**
 * 로그인 요청 데이터
 */
export interface LoginRequest {
  userId: string;
  password: string;
}

/**
 * 회원가입 요청 데이터
 */
export interface RegisterRequest {
  userId: string;
  password: string;
  userName: string;
  email?: string;
}

/**
 * 인증 상태
 */
export interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

/**
 * API 응답 타입
 */
export interface AuthResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error_code?: string;
}
