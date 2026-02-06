/**
 * CMS Errors Tests
 *
 * Unit tests for CMS custom error classes
 */

import { describe, expect, it } from 'vitest';
import {
  CMSError,
  CMSNotFoundError,
  CMSAccessDeniedError,
  CMSOrganizationMismatchError,
  CMSValidationError,
  CMSConnectionError,
  CMSConfigurationError,
  isCMSError,
  toCMSError,
} from '@/lib/cms/core/errors';

describe('CMSError', () => {
  it('should create error with message, code, and statusCode', () => {
    const error = new CMSError('Test error', 'TEST_ERROR', 400);
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('CMSError');
  });

  it('should default to 500 status code', () => {
    const error = new CMSError('Test error', 'TEST_ERROR');
    expect(error.statusCode).toBe(500);
  });

  it('should include details if provided', () => {
    const details = { field: 'email', reason: 'invalid' };
    const error = new CMSError('Test error', 'TEST_ERROR', 400, details);
    
    expect(error.details).toEqual(details);
  });

  it('should be instance of Error', () => {
    const error = new CMSError('Test', 'TEST', 500);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('CMSNotFoundError', () => {
  it('should create not found error with collection and identifier', () => {
    const error = new CMSNotFoundError('BlogPost', 'post-123');
    
    expect(error.message).toBe('BlogPost not found: post-123');
    expect(error.code).toBe('CMS_NOT_FOUND');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('CMSNotFoundError');
  });

  it('should be instance of CMSError', () => {
    const error = new CMSNotFoundError('User', 'user-1');
    expect(error).toBeInstanceOf(CMSError);
  });
});

describe('CMSAccessDeniedError', () => {
  it('should create access denied error with default message', () => {
    const error = new CMSAccessDeniedError();
    
    expect(error.message).toBe('Access denied');
    expect(error.code).toBe('CMS_ACCESS_DENIED');
    expect(error.statusCode).toBe(403);
    expect(error.name).toBe('CMSAccessDeniedError');
  });

  it('should create access denied error with custom message', () => {
    const error = new CMSAccessDeniedError('You cannot edit this resource');
    expect(error.message).toBe('You cannot edit this resource');
  });
});

describe('CMSOrganizationMismatchError', () => {
  it('should create organization mismatch error', () => {
    const error = new CMSOrganizationMismatchError();
    
    expect(error.message).toBe('Organization mismatch: You do not have access to this content');
    expect(error.code).toBe('CMS_ORG_MISMATCH');
    expect(error.statusCode).toBe(403);
    expect(error.name).toBe('CMSOrganizationMismatchError');
  });
});

describe('CMSValidationError', () => {
  it('should create validation error with message', () => {
    const error = new CMSValidationError('Invalid input');
    
    expect(error.message).toBe('Invalid input');
    expect(error.code).toBe('CMS_VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('CMSValidationError');
  });

  it('should include validation details', () => {
    const details = {
      fields: ['email', 'name'],
      errors: { email: 'invalid format' },
    };
    const error = new CMSValidationError('Validation failed', details);
    
    expect(error.details).toEqual(details);
  });
});

describe('CMSConnectionError', () => {
  it('should create connection error with default message', () => {
    const error = new CMSConnectionError();
    
    expect(error.message).toBe('Failed to connect to CMS');
    expect(error.code).toBe('CMS_CONNECTION_ERROR');
    expect(error.statusCode).toBe(503);
    expect(error.name).toBe('CMSConnectionError');
  });

  it('should create connection error with custom message', () => {
    const error = new CMSConnectionError('Database connection timeout');
    expect(error.message).toBe('Database connection timeout');
  });
});

describe('CMSConfigurationError', () => {
  it('should create configuration error', () => {
    const error = new CMSConfigurationError('Missing API key');
    
    expect(error.message).toBe('Missing API key');
    expect(error.code).toBe('CMS_CONFIG_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('CMSConfigurationError');
  });
});

describe('isCMSError', () => {
  it('should return true for CMSError', () => {
    const error = new CMSError('Test', 'TEST', 500);
    expect(isCMSError(error)).toBe(true);
  });

  it('should return true for CMSError subclasses', () => {
    expect(isCMSError(new CMSNotFoundError('Post', '1'))).toBe(true);
    expect(isCMSError(new CMSAccessDeniedError())).toBe(true);
    expect(isCMSError(new CMSValidationError('Invalid'))).toBe(true);
    expect(isCMSError(new CMSConnectionError())).toBe(true);
    expect(isCMSError(new CMSConfigurationError('Missing'))).toBe(true);
    expect(isCMSError(new CMSOrganizationMismatchError())).toBe(true);
  });

  it('should return false for regular Error', () => {
    const error = new Error('Test');
    expect(isCMSError(error)).toBe(false);
  });

  it('should return false for non-error values', () => {
    expect(isCMSError(null)).toBe(false);
    expect(isCMSError(undefined)).toBe(false);
    expect(isCMSError('error string')).toBe(false);
    expect(isCMSError({ message: 'error' })).toBe(false);
  });
});

describe('toCMSError', () => {
  it('should return same error if already CMSError', () => {
    const original = new CMSNotFoundError('Post', '1');
    const result = toCMSError(original);
    
    expect(result).toBe(original);
  });

  it('should convert regular Error to CMSError', () => {
    const original = new Error('Something went wrong');
    const result = toCMSError(original);
    
    expect(result).toBeInstanceOf(CMSError);
    expect(result.message).toBe('Something went wrong');
    expect(result.code).toBe('CMS_UNKNOWN_ERROR');
    expect(result.statusCode).toBe(500);
    expect(result.details).toHaveProperty('originalError', 'Error');
  });

  it('should convert TypeError to CMSError', () => {
    const original = new TypeError('Cannot read property');
    const result = toCMSError(original);
    
    expect(result).toBeInstanceOf(CMSError);
    expect(result.details).toHaveProperty('originalError', 'TypeError');
  });

  it('should convert unknown values to CMSError', () => {
    const result1 = toCMSError('string error');
    expect(result1).toBeInstanceOf(CMSError);
    expect(result1.message).toBe('An unknown error occurred');
    expect(result1.details).toHaveProperty('originalError', 'string error');

    const result2 = toCMSError(null);
    expect(result2).toBeInstanceOf(CMSError);
    expect(result2.details).toHaveProperty('originalError', null);

    const result3 = toCMSError(123);
    expect(result3).toBeInstanceOf(CMSError);
    expect(result3.details).toHaveProperty('originalError', 123);
  });
});
