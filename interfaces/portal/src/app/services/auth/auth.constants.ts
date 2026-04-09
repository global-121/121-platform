import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

export const AUTH_ERROR_IN_STATE_KEY = 'AUTH_ERROR';
export const SESSION_EXPIRED_IN_STATE_KEY = 'SESSION_EXPIRED';
export const VALID_PERMISSIONS = new Set(Object.values(PermissionEnum));
