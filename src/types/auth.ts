// Khớp với UserDto bên ERP_Portal_RC.Application.DTOs
export interface User {
  id?: string;
  userName?: string;
  loginName?: string;
  userCode: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  country?: string;
  address?: string;
  userPosition?: string;
  languageDefault?: string;
  grp_List?: string;
  cmpnID?: string;
  defaultAppSite?: string;
}

// Khớp với LoginRequestDto BE
export interface LoginRequest {
  loginName: string;
  password: string;
}

// Khớp với ApiResponse<AuthResponseDto> BE → đã unwrap về shape phẳng cho FE.
export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginName: string, password: string, remember: boolean) => Promise<void>;
  logout: () => void;
}
