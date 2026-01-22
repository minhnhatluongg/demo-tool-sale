export interface User {
  userCode: string;
  userName: string;
  fullName: string;
  email?: string;
  password?: string;
}

export interface LoginRequest {
  loginName: string;
  password: string;
  cmpnID?: string;
  languageDefault?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginName: string, password: string, remember: boolean) => Promise<void>;
  logout: () => void;
}
