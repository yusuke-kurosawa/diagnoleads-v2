/**
 * Error Mapper Tests
 *
 * Unit tests for error message mapping and conversion utilities
 */

import { describe, expect, it, vi } from 'vitest';
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

describe('errorMessageMap', () => {
  it('should have auth error mappings', () => {
    expect(errorMessageMap.AUTH_REQUIRED).toBe('auth.unauthorized');
    expect(errorMessageMap.AUTH_INVALID_CREDENTIALS).toBe('auth.invalidCredentials');
    expect(errorMessageMap.AUTH_SESSION_EXPIRED).toBe('auth.sessionExpired');
  });

  it('should have validation error mappings', () => {
    expect(errorMessageMap.VALIDATION_ERROR).toBe('api.400');
    expect(errorMessageMap.INVALID_EMAIL).toBe('validation.email');
    expect(errorMessageMap.REQUIRED_FIELD).toBe('validation.required');
  });

  it('should have resource error mappings', () => {
    expect(errorMessageMap.NOT_FOUND).toBe('api.404');
    expect(errorMessageMap.LEAD_NOT_FOUND).toBe('lead.notFound');
    expect(errorMessageMap.ORGANIZATION_NOT_FOUND).toBe('organization.notFound');
  });

  it('should have server error mappings', () => {
    expect(errorMessageMap.SERVER_ERROR).toBe('api.500');
    expect(errorMessageMap.NETWORK_ERROR).toBe('api.network');
    expect(errorMessageMap.TIMEOUT).toBe('api.timeout');
  });

  it('should have unknown error fallback', () => {
    expect(errorMessageMap.UNKNOWN_ERROR).toBe('api.unknown');
  });
});

describe('httpStatusToErrorCode', () => {
  it('should map common HTTP status codes', () => {
    expect(httpStatusToErrorCode[400]).toBe('VALIDATION_ERROR');
    expect(httpStatusToErrorCode[401]).toBe('AUTH_REQUIRED');
    expect(httpStatusToErrorCode[403]).toBe('FORBIDDEN');
    expect(httpStatusToErrorCode[404]).toBe('NOT_FOUND');
    expect(httpStatusToErrorCode[500]).toBe('SERVER_ERROR');
  });

  it('should map gateway errors', () => {
    expect(httpStatusToErrorCode[502]).toBe('BAD_GATEWAY');
    expect(httpStatusToErrorCode[503]).toBe('SERVICE_UNAVAILABLE');
    expect(httpStatusToErrorCode[504]).toBe('GATEWAY_TIMEOUT');
  });
});

describe('getErrorMessageKey', () => {
  it('should return correct key for known error codes', () => {
    expect(getErrorMessageKey('AUTH_REQUIRED')).toBe('auth.unauthorized');
    expect(getErrorMessageKey('NOT_FOUND')).toBe('api.404');
    expect(getErrorMessageKey('VALIDATION_ERROR')).toBe('api.400');
  });

  it('should return unknown error key for undefined codes', () => {
    expect(getErrorMessageKey('UNKNOWN_ERROR')).toBe('api.unknown');
  });
});

describe('getErrorCodeFromStatus', () => {
  it('should return correct error code for known status', () => {
    expect(getErrorCodeFromStatus(400)).toBe('VALIDATION_ERROR');
    expect(getErrorCodeFromStatus(401)).toBe('AUTH_REQUIRED');
    expect(getErrorCodeFromStatus(404)).toBe('NOT_FOUND');
  });

  it('should return UNKNOWN_ERROR for unknown status', () => {
    expect(getErrorCodeFromStatus(418)).toBe('UNKNOWN_ERROR');
    expect(getErrorCodeFromStatus(999)).toBe('UNKNOWN_ERROR');
  });
});

describe('createErrorResponse', () => {
  it('should create basic error response', () => {
    const response = createErrorResponse('NOT_FOUND');
    expect(response.code).toBe('NOT_FOUND');
    expect(response.message).toBe('api.404');
  });

  it('should use custom message when provided', () => {
    const response = createErrorResponse('NOT_FOUND', 'Custom not found message');
    expect(response.message).toBe('Custom not found message');
  });

  it('should include field when provided', () => {
    const response = createErrorResponse('VALIDATION_ERROR', undefined, 'email');
    expect(response.field).toBe('email');
  });

  it('should include details when provided', () => {
    const response = createErrorResponse('VALIDATION_ERROR', undefined, undefined, {
      min: 5,
      max: 100,
    });
    expect(response.details).toEqual({ min: 5, max: 100 });
  });

  it('should create complete error response', () => {
    const response = createErrorResponse(
      'FIELD_TOO_LONG',
      'Email is too long',
      'email',
      { maxLength: 255 }
    );
    expect(response).toEqual({
      code: 'FIELD_TOO_LONG',
      message: 'Email is too long',
      field: 'email',
      details: { maxLength: 255 },
    });
  });
});

describe('mapTRPCErrorToErrorResponse', () => {
  it('should map UNAUTHORIZED tRPC error', () => {
    const response = mapTRPCErrorToErrorResponse({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in',
    });
    expect(response.code).toBe('AUTH_REQUIRED');
  });

  it('should map FORBIDDEN tRPC error', () => {
    const response = mapTRPCErrorToErrorResponse({
      code: 'FORBIDDEN',
      message: 'Access denied',
    });
    expect(response.code).toBe('FORBIDDEN');
  });

  it('should map NOT_FOUND tRPC error', () => {
    const response = mapTRPCErrorToErrorResponse({
      code: 'NOT_FOUND',
      message: 'Resource not found',
    });
    expect(response.code).toBe('NOT_FOUND');
  });

  it('should map BAD_REQUEST tRPC error', () => {
    const response = mapTRPCErrorToErrorResponse({
      code: 'BAD_REQUEST',
      message: 'Invalid input',
    });
    expect(response.code).toBe('VALIDATION_ERROR');
  });

  it('should use error code from data if provided', () => {
    const response = mapTRPCErrorToErrorResponse({
      code: 'BAD_REQUEST',
      message: 'Email is invalid',
      data: {
        code: 'INVALID_EMAIL',
        field: 'email',
      },
    });
    expect(response.code).toBe('INVALID_EMAIL');
    expect(response.field).toBe('email');
  });

  it('should return UNKNOWN_ERROR for unmapped codes', () => {
    const response = mapTRPCErrorToErrorResponse({
      code: 'UNKNOWN_CODE' as any,
      message: 'Something went wrong',
    });
    expect(response.code).toBe('UNKNOWN_ERROR');
  });
});

describe('getLocalizedErrorMessage', () => {
  it('should call translator with message key', () => {
    const mockT = vi.fn().mockReturnValue('Translated message');
    const response: ErrorResponse = {
      code: 'NOT_FOUND',
      message: 'api.404',
    };

    const result = getLocalizedErrorMessage(response, mockT);

    expect(mockT).toHaveBeenCalledWith('api.404');
    expect(result).toBe('Translated message');
  });

  it('should pass field parameter to translator', () => {
    const mockT = vi.fn().mockReturnValue('Field error');
    const response: ErrorResponse = {
      code: 'REQUIRED_FIELD',
      message: 'validation.required',
      field: 'email',
    };

    getLocalizedErrorMessage(response, mockT);

    expect(mockT).toHaveBeenCalledWith('validation.required', {
      field: 'email',
    });
  });

  it('should pass details to translator', () => {
    const mockT = vi.fn().mockReturnValue('Length error');
    const response: ErrorResponse = {
      code: 'FIELD_TOO_LONG',
      message: 'validation.max',
      details: { max: 100 },
    };

    getLocalizedErrorMessage(response, mockT);

    expect(mockT).toHaveBeenCalledWith('validation.max', {
      field: '',
      max: 100,
    });
  });
});

describe('getToastMessageKey', () => {
  describe('success messages', () => {
    it('should return created key', () => {
      expect(getToastMessageKey('create', 'lead', false)).toBe('toast.lead.created');
      expect(getToastMessageKey('create', 'organization', false)).toBe('toast.organization.created');
    });

    it('should return updated key', () => {
      expect(getToastMessageKey('update', 'lead', false)).toBe('toast.lead.updated');
      expect(getToastMessageKey('update', 'member', false)).toBe('toast.member.updated');
    });

    it('should return deleted key', () => {
      expect(getToastMessageKey('delete', 'lead', false)).toBe('toast.lead.deleted');
      expect(getToastMessageKey('delete', 'settings', false)).toBe('toast.settings.deleted');
    });
  });

  describe('error messages', () => {
    it('should return createError key', () => {
      expect(getToastMessageKey('create', 'lead', true)).toBe('toast.lead.createError');
    });

    it('should return updateError key', () => {
      expect(getToastMessageKey('update', 'organization', true)).toBe('toast.organization.updateError');
    });

    it('should return deleteError key', () => {
      expect(getToastMessageKey('delete', 'member', true)).toBe('toast.member.deleteError');
    });
  });

  describe('all resources', () => {
    const resources: Array<'lead' | 'organization' | 'member' | 'settings'> = [
      'lead',
      'organization',
      'member',
      'settings',
    ];

    it('should support all resource types', () => {
      for (const resource of resources) {
        expect(getToastMessageKey('create', resource, false)).toContain(resource);
        expect(getToastMessageKey('update', resource, false)).toContain(resource);
        expect(getToastMessageKey('delete', resource, false)).toContain(resource);
      }
    });
  });
});

describe('ErrorCode type coverage', () => {
  it('should have all auth error codes in map', () => {
    const authCodes: ErrorCode[] = [
      'AUTH_REQUIRED',
      'AUTH_INVALID_CREDENTIALS',
      'AUTH_SESSION_EXPIRED',
      'AUTH_TOKEN_INVALID',
      'AUTH_ACCOUNT_LOCKED',
    ];
    for (const code of authCodes) {
      expect(errorMessageMap[code]).toBeDefined();
    }
  });

  it('should have all validation error codes in map', () => {
    const validationCodes: ErrorCode[] = [
      'VALIDATION_ERROR',
      'INVALID_EMAIL',
      'INVALID_PHONE',
      'INVALID_URL',
      'REQUIRED_FIELD',
      'FIELD_TOO_LONG',
      'FIELD_TOO_SHORT',
    ];
    for (const code of validationCodes) {
      expect(errorMessageMap[code]).toBeDefined();
    }
  });

  it('should have all business logic error codes in map', () => {
    const businessCodes: ErrorCode[] = [
      'DUPLICATE_EMAIL',
      'LEAD_CREATE_FAILED',
      'LEAD_UPDATE_FAILED',
      'LEAD_DELETE_FAILED',
      'ORGANIZATION_CREATE_FAILED',
      'MEMBER_INVITE_FAILED',
    ];
    for (const code of businessCodes) {
      expect(errorMessageMap[code]).toBeDefined();
    }
  });
});
