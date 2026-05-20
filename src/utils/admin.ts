import { User } from '../types/auth';

/**
 * Khớp với appsettings.json BE → Admin:AllowedUserCodes
 * (BE: ERP_Portal_RC/appsettings.json + AdminAuthFilter.cs)
 *
 * Đây chỉ là gate FE để redirect / show menu — gate thật vẫn là JWT + AdminAuthFilter ở BE.
 */
export const ADMIN_USER_CODES: ReadonlyArray<string> = ['001332', '001333'];

export const isAdmin = (user: User | null | undefined): boolean => {
    if (!user) return false;
    const code = (user.userCode || '').trim();
    if (!code) return false;
    return ADMIN_USER_CODES.some(c => c.toLowerCase() === code.toLowerCase());
};
