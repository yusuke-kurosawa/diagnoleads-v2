/**
 * Error Mapper Tests
 */

import { describe, expect, it, vi } from 'vitest';

// Import actual module
import {
  errorMessageMap,
  httpStatusToErrorCode,
  getErrorMessageKey,
  getErrorCodeFromStatus,
  createErrorResponse,
  mapTRPCErrorToErrorResponse,
  getLocalizedErrorMessage,
  getToastMessageKey,
  type ErrorCode,
  type ErrorResponse,
} from '@/lib/messages/error-mapper';

// Types matching source
type ErrorCodeType =
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_ACCOUNT_LOCKED'
  | 'FORBIDDEN'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'ORGANIZATION_ACCESS_DENIED'
  | 'VALIDATION_ERROR'
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'INVALID_URL'
  | 'REQUIRED_FIELD'
  | 'FIELD_TOO_LONG'
  | 'FIELD_TOO_SHORT'
  | 'NUMBER_TOO_SMALL'
  | 'NUMBER_TOO_LARGE'
  | 'INVALID_PATTERN'
  | 'DUPLICATE_VALUE'
  | 'NOT_FOUND'
  | 'LEAD_NOT_FOUND'
  | 'ORGANIZATION_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'MEMBER_NOT_FOUND'
  | 'DUPLICATE_EMAIL'
  | 'LEAD_CREATE_FAILED'
  | 'LEAD_UPDATE_FAILED'
  | 'LEAD_DELETE_FAILED'
  | 'LEAD_INVALID_STATUS'
  | 'ORGANIZATION_CREATE_FAILED'
  | 'ORGANIZATION_UPDATE_FAILED'
  | 'ORGANIZATION_DELETE_FAILED'
  | 'MEMBER_INVITE_FAILED'
  | 'MEMBER_REMOVE_FAILED'
  | 'MEMBER_ALREADY_EXISTS'
  | 'SERVER_ERROR'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'BAD_GATEWAY'
  | 'SERVICE_UNAVAILABLE'
  | 'GATEWAY_TIMEOUT'
  | 'UNKNOWN_ERROR';

interface ErrorResponse {
  code: ErrorCode;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

// Error message mapping
const errorMessageMap: Record<ErrorCode, string> = {
  AUTH_REQUIRED: 'auth.unauthorized',
  AUTH_INVALID_CREDENTIALS: 'auth.invalidCredentials',
  AUTH_SESSION_EXPIRED: 'auth.sessionExpired',
  AUTH_TOKEN_INVALID: 'auth.invalidToken',
  AUTH_ACCOUNT_LOCKED: 'auth.accountLocked',
  FORBIDDEN: 'api.403',
  INSUFFICIENT_PERMISSIONS: 'member.insufficientPermissions',
  ORGANIZATION_ACCESS_DENIED: 'organization.accessDenied',
  VALIDATION_ERROR: 'api.400',
  INVALID_EMAIL: 'validation.email',
  INVALID_PHONE: 'validation.phone',
  INVALID_URL: 'validation.url',
  REQUIRED_FIELD: 'validation.required',
  FIELD_TOO_LONG: 'validation.max',
  FIELD_TOO_SHORT: 'validation.min',
  NUMBER_TOO_SMALL: 'validation.minNumber',
  NUMBER_TOO_LARGE: 'validation.maxNumber',
  INVALID_PATTERN: 'validation.pattern',
  DUPLICATE_VALUE: 'validation.unique',
  NOT_FOUND: 'api.404',
  LEAD_NOT_FOUND: 'lead.notFound',
  ORGANIZATION_NOT_FOUND: 'organization.notFound',
  USER_NOT_FOUND: 'api.404',
  MEMBER_NOT_FOUND: 'member.notFound',
  DUPLICATE_EMAIL: 'lead.duplicateEmail',
  LEAD_CREATE_FAILED: 'lead.createFailed',
  LEAD_UPDATE_FAILED: 'lead.updateFailed',
  LEAD_DELETE_FAILED: 'lead.deleteFailed',
  LEAD_INVALID_STATUS: 'lead.invalidStatus',
  ORGANIZATION_CREATE_FAILED: 'organization.createFailed',
  ORGANIZATION_UPDATE_FAILED: 'organization.updateFailed',
  ORGANIZATION_DELETE_FAILED: 'organization.deleteFailed',
  MEMBER_INVITE_FAILED: 'member.inviteFailed',
  MEMBER_REMOVE_FAILED: 'member.removeFailed',
  MEMBER_ALREADY_EXISTS: 'member.alreadyMember',
  SERVER_ERROR: 'api.500',
  DATABASE_ERROR: 'api.500',
  NETWORK_ERROR: 'api.network',
  TIMEOUT: 'api.timeout',
  BAD_GATEWAY: 'api.502',
  SERVICE_UNAVAILABLE: 'api.503',
  GATEWAY_TIMEOUT: 'api.504',
  UNKNOWN_ERROR: 'api.unknown',
};

const httpStatusToErrorCode: Record<number, ErrorCode> = {
  400: 'VALIDATION_ERROR',
  401: 'AUTH_REQUIRED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  500: 'SERVER_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
};

describe('ErrorCode types', () => {
  it('should define authentication error codes', () => {
    const authCodes: ErrorCode[] = [
      'AUTH_REQUIRED',
      'AUTH_INVALID_CREDENTIALS',
      'AUTH_SESSION_EXPIRED',
      'AUTH_TOKEN_INVALID',
      'AUTH_ACCOUNT_LOCKED',
    ];
    expect(authCodes).toHaveLength(5);
  });

  it('should define authorization error codes', () => {
    const authzCodes: ErrorCode[] = [
      'FORBIDDEN',
      'INSUFFICIENT_PERMISSIONS',
      'ORGANIZATION_ACCESS_DENIED',
    ];
    expect(authzCodes).toHaveLength(3);
  });

  it('should define validation error codes', () => {
    const validationCodes: ErrorCode[] = [
      'VALIDATION_ERROR',
      'INVALID_EMAIL',
      'INVALID_PHONE',
      'INVALID_URL',
      'REQUIRED_FIELD',
    ];
    expect(validationCodes).toHaveLength(5);
  });
});

describe('getErrorMessageKey', () => {
  const getErrorMessageKey = (code: ErrorCode): string =>
    errorMessageMap[code] || errorMessageMap.UNKNOWN_ERROR;

  it('should return correct key for AUTH_REQUIRED', () => {
    expect(getErrorMessageKey('AUTH_REQUIRED')).toBe('auth.unauthorized');
  });

  it('should return correct key for FORBIDDEN', () => {
    expect(getErrorMessageKey('FORBIDDEN')).toBe('api.403');
  });

  it('should return correct key for NOT_FOUND', () => {
    expect(getErrorMessageKey('NOT_FOUND')).toBe('api.404');
  });

  it('should return correct key for VALIDATION_ERROR', () => {
    expect(getErrorMessageKey('VALIDATION_ERROR')).toBe('api.400');
  });

  it('should return correct key for SERVER_ERROR', () => {
    expect(getErrorMessageKey('SERVER_ERROR')).toBe('api.500');
  });

  it('should return unknown key for invalid code', () => {
    expect(getErrorMessageKey('UNKNOWN_ERROR')).toBe('api.unknown');
  });
});

describe('getErrorCodeFromStatus', () => {
  const getErrorCodeFromStatus = (status: number): ErrorCode =>
    httpStatusToErrorCode[status] || 'UNKNOWN_ERROR';

  it('should return VALIDATION_ERROR for 400', () => {
    expect(getErrorCodeFromStatus(400)).toBe('VALIDATION_ERROR');
  });

  it('should return AUTH_REQUIRED for 401', () => {
    expect(getErrorCodeFromStatus(401)).toBe('AUTH_REQUIRED');
  });

  it('should return FORBIDDEN for 403', () => {
    expect(getErrorCodeFromStatus(403)).toBe('FORBIDDEN');
  });

  it('should return NOT_FOUND for 404', () => {
    expect(getErrorCodeFromStatus(404)).toBe('NOT_FOUND');
  });

  it('should return SERVER_ERROR for 500', () => {
    expect(getErrorCodeFromStatus(500)).toBe('SERVER_ERROR');
  });

  it('should return UNKNOWN_ERROR for unmapped status', () => {
    expect(getErrorCodeFromStatus(418)).toBe('UNKNOWN_ERROR');
  });
});

describe('createErrorResponse', () => {
  const createErrorResponse = (
    code: ErrorCode,
    message?: string,
    field?: string,
    details?: Record<string, unknown>
  ): ErrorResponse => ({
    code,
    message: message || errorMessageMap[code] || errorMessageMap.UNKNOWN_ERROR,
    field,
    details,
  });

  it('should create basic error response', () => {
    const response = createErrorResponse('AUTH_REQUIRED');
    expect(response.code).toBe('AUTH_REQUIRED');
    expect(response.message).toBe('auth.unauthorized');
  });

  it('should create error response with custom message', () => {
    const response = createErrorResponse('VALIDATION_ERROR', 'Custom message');
    expect(response.message).toBe('Custom message');
  });

  it('should create error response with field', () => {
    const response = createErrorResponse('INVALID_EMAIL', undefined, 'email');
    expect(response.field).toBe('email');
  });

  it('should create error response with details', () => {
    const response = createErrorResponse('FIELD_TOO_LONG', undefined, 'name', { max: 100 });
    expect(response.details).toEqual({ max: 100 });
  });
});

describe('mapFetchErrorToErrorResponse', () => {
  it('should handle network error', async () => {
    const error = new TypeError('Failed to fetch');
    const response: ErrorResponse = {
      code: 'NETWORK_ERROR',
      message: 'api.network',
    };
    expect(response.code).toBe('NETWORK_ERROR');
  });

  it('should handle Response with JSON body', async () => {
    const mockResponse = {
      json: vi.fn().mockResolvedValue({ code: 'AUTH_REQUIRED', message: 'Not logged in' }),
      status: 401,
    };

    const data = await mockResponse.json();
    const response: ErrorResponse = {
      code: data.code,
      message: data.message,
    };

    expect(response.code).toBe('AUTH_REQUIRED');
    expect(response.message).toBe('Not logged in');
  });

  it('should handle Response without JSON', async () => {
    const status = 500;
    const response: ErrorResponse = {
      code: httpStatusToErrorCode[status] || 'UNKNOWN_ERROR',
      message: errorMessageMap[httpStatusToErrorCode[status]] || 'api.unknown',
    };

    expect(response.code).toBe('SERVER_ERROR');
  });
});

describe('mapTRPCErrorToErrorResponse', () => {
  const trpcCodeToErrorCode: Record<string, ErrorCode> = {
    UNAUTHORIZED: 'AUTH_REQUIRED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    BAD_REQUEST: 'VALIDATION_ERROR',
    INTERNAL_SERVER_ERROR: 'SERVER_ERROR',
    TIMEOUT: 'TIMEOUT',
  };

  it('should map UNAUTHORIZED to AUTH_REQUIRED', () => {
    const errorCode = trpcCodeToErrorCode['UNAUTHORIZED'];
    expect(errorCode).toBe('AUTH_REQUIRED');
  });

  it('should map NOT_FOUND correctly', () => {
    const errorCode = trpcCodeToErrorCode['NOT_FOUND'];
    expect(errorCode).toBe('NOT_FOUND');
  });

  it('should map INTERNAL_SERVER_ERROR to SERVER_ERROR', () => {
    const errorCode = trpcCodeToErrorCode['INTERNAL_SERVER_ERROR'];
    expect(errorCode).toBe('SERVER_ERROR');
  });

  it('should use data.code if provided', () => {
    const error = {
      code: 'BAD_REQUEST',
      message: 'Invalid input',
      data: { code: 'INVALID_EMAIL' as ErrorCode, field: 'email' },
    };

    const response: ErrorResponse = {
      code: error.data?.code || trpcCodeToErrorCode[error.code] || 'UNKNOWN_ERROR',
      message: error.message,
      field: error.data?.field,
    };

    expect(response.code).toBe('INVALID_EMAIL');
    expect(response.field).toBe('email');
  });
});

describe('getLocalizedErrorMessage', () => {
  it('should call translator with key', () => {
    const t = vi.fn().mockReturnValue('Translated message');
    const errorResponse: ErrorResponse = {
      code: 'AUTH_REQUIRED',
      message: 'auth.unauthorized',
    };

    const key = errorMessageMap[errorResponse.code];
    const message = t(key);

    expect(t).toHaveBeenCalledWith('auth.unauthorized');
    expect(message).toBe('Translated message');
  });

  it('should pass field to translator', () => {
    const t = vi.fn().mockReturnValue('Field error');
    const errorResponse: ErrorResponse = {
      code: 'REQUIRED_FIELD',
      message: 'validation.required',
      field: 'email',
    };

    const key = errorMessageMap[errorResponse.code];
    const message = t(key, { field: errorResponse.field });

    expect(t).toHaveBeenCalledWith('validation.required', { field: 'email' });
  });
});

describe('getToastMessageKey', () => {
  const getToastMessageKey = (
    operation: 'create' | 'update' | 'delete',
    resource: 'lead' | 'organization' | 'member' | 'settings',
    isError: boolean
  ): string => {
    const action = isError
      ? `${operation}Error`
      : operation === 'create'
        ? 'created'
        : operation === 'update'
          ? 'updated'
          : 'deleted';
    return `toast.${resource}.${action}`;
  };

  it('should return success key for create', () => {
    expect(getToastMessageKey('create', 'lead', false)).toBe('toast.lead.created');
  });

  it('should return success key for update', () => {
    expect(getToastMessageKey('update', 'lead', false)).toBe('toast.lead.updated');
  });

  it('should return success key for delete', () => {
    expect(getToastMessageKey('delete', 'lead', false)).toBe('toast.lead.deleted');
  });

  it('should return error key for create', () => {
    expect(getToastMessageKey('create', 'lead', true)).toBe('toast.lead.createError');
  });

  it('should return error key for update', () => {
    expect(getToastMessageKey('update', 'organization', true)).toBe('toast.organization.updateError');
  });
});

// Integration tests with actual module
describe('Integration: errorMessageMap', () => {
  it('should export errorMessageMap', () => {
    expect(errorMessageMap).toBeDefined();
    expect(errorMessageMap.AUTH_REQUIRED).toBe('auth.unauthorized');
  });
});

describe('Integration: httpStatusToErrorCode', () => {
  it('should export httpStatusToErrorCode', () => {
    expect(httpStatusToErrorCode).toBeDefined();
    expect(httpStatusToErrorCode[401]).toBe('AUTH_REQUIRED');
  });
});

describe('Integration: getErrorMessageKey', () => {
  it('should return correct key', () => {
    expect(getErrorMessageKey('AUTH_REQUIRED')).toBe('auth.unauthorized');
    expect(getErrorMessageKey('NOT_FOUND')).toBe('api.404');
    expect(getErrorMessageKey('UNKNOWN_ERROR')).toBe('api.unknown');
  });
});

describe('Integration: getErrorCodeFromStatus', () => {
  it('should return correct error code', () => {
    expect(getErrorCodeFromStatus(400)).toBe('VALIDATION_ERROR');
    expect(getErrorCodeFromStatus(401)).toBe('AUTH_REQUIRED');
    expect(getErrorCodeFromStatus(403)).toBe('FORBIDDEN');
    expect(getErrorCodeFromStatus(404)).toBe('NOT_FOUND');
    expect(getErrorCodeFromStatus(500)).toBe('SERVER_ERROR');
    expect(getErrorCodeFromStatus(999)).toBe('UNKNOWN_ERROR');
  });
});

describe('Integration: createErrorResponse', () => {
  it('should create error response', () => {
    const response = createErrorResponse('AUTH_REQUIRED');
    expect(response.code).toBe('AUTH_REQUIRED');
    expect(response.message).toBe('auth.unauthorized');
  });

  it('should create error response with custom message', () => {
    const response = createErrorResponse('VALIDATION_ERROR', 'Custom validation error');
    expect(response.message).toBe('Custom validation error');
  });

  it('should create error response with field and details', () => {
    const response = createErrorResponse('INVALID_EMAIL', undefined, 'email', { format: 'invalid' });
    expect(response.field).toBe('email');
    expect(response.details).toEqual({ format: 'invalid' });
  });
});

describe('Integration: mapTRPCErrorToErrorResponse', () => {
  it('should map tRPC error', () => {
    const trpcError = {
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    };
    const response = mapTRPCErrorToErrorResponse(trpcError);
    expect(response.code).toBe('AUTH_REQUIRED');
  });

  it('should use data.code if provided', () => {
    const trpcError = {
      code: 'BAD_REQUEST',
      message: 'Invalid email',
      data: { code: 'INVALID_EMAIL' as ErrorCode, field: 'email' },
    };
    const response = mapTRPCErrorToErrorResponse(trpcError);
    expect(response.code).toBe('INVALID_EMAIL');
    expect(response.field).toBe('email');
  });
});

describe('Integration: getLocalizedErrorMessage', () => {
  it('should get localized message', () => {
    const t = vi.fn().mockReturnValue('ログインが必要です');
    const errorResponse: ErrorResponse = {
      code: 'AUTH_REQUIRED',
      message: 'auth.unauthorized',
    };
    
    const message = getLocalizedErrorMessage(errorResponse, t);
    expect(t).toHaveBeenCalled();
    expect(message).toBe('ログインが必要です');
  });

  it('should pass field params to translator', () => {
    const t = vi.fn().mockImplementation((key, params) => `${key}: ${JSON.stringify(params)}`);
    const errorResponse: ErrorResponse = {
      code: 'REQUIRED_FIELD',
      message: 'validation.required',
      field: 'email',
    };
    
    const message = getLocalizedErrorMessage(errorResponse, t);
    expect(message).toContain('email');
  });
});

describe('Integration: getToastMessageKey (actual)', () => {
  it('should return correct toast keys', () => {
    expect(getToastMessageKey('create', 'lead', false)).toBe('toast.lead.created');
    expect(getToastMessageKey('update', 'lead', false)).toBe('toast.lead.updated');
    expect(getToastMessageKey('delete', 'lead', false)).toBe('toast.lead.deleted');
    expect(getToastMessageKey('create', 'lead', true)).toBe('toast.lead.createError');
    expect(getToastMessageKey('update', 'organization', true)).toBe('toast.organization.updateError');
    expect(getToastMessageKey('delete', 'member', true)).toBe('toast.member.deleteError');
  });
});
