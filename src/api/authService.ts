import api from './apiClient';
import { LoginResponse, User } from '../types/auth';

/**
 * Gọi BE ERP_Portal_RC: POST /api/Auth/login
 *
 * BE trả về (ApiResponse<AuthResponseDto>):
 * {
 *   success: true,
 *   message: "Đăng nhập thành công",
 *   data: {
 *     accessToken: "...",
 *     refreshToken: "...",
 *     expiresAt: "2026-...",
 *     user: { id, loginName, userName, email, fullName, userCode, ... }
 *   },
 *   statusCode: 200,
 *   timestamp: "..."
 * }
 */
export const loginAPI = async (
  loginName: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await api.post('/Auth/login', { loginName, password });

    const payload = response.data;
    if (!payload || payload.success === false) {
      return {
        success: false,
        message: payload?.message || 'Đăng nhập thất bại',
      };
    }

    const data = payload.data ?? {};
    const beUser = data.user ?? {};

    const user: User = {
      id: beUser.id,
      userName: beUser.userName,
      loginName: beUser.loginName,
      userCode: beUser.userCode || '',
      fullName: beUser.fullName || beUser.userName || beUser.loginName || '',
      email: beUser.email,
      phoneNumber: beUser.phoneNumber,
      country: beUser.country,
      address: beUser.address,
      userPosition: beUser.userPosition,
      languageDefault: beUser.languageDefault,
      grp_List: beUser.grp_List,
      cmpnID: beUser.cmpnID,
      defaultAppSite: beUser.defaultAppSite,
    };

    return {
      success: true,
      message: payload.message,
      user,
      token: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
    };
  } catch (error: any) {
    if (error.response) {
      const msg = error.response.data?.message || 'Đăng nhập thất bại';
      return { success: false, message: msg };
    }
    if (error.request) {
      return { success: false, message: 'Không thể kết nối đến server' };
    }
    return { success: false, message: error.message || 'Có lỗi xảy ra' };
  }
};

export default api;
