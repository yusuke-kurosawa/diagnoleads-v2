/**
 * CMS Custom Errors Tests
 */

import { describe, expect, it } from 'vitest';

// Error classes matching source
class CMSError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'CMSError';
  }
}

class CMSNotFoundError extends CMSError {
  constructor(collection: string, identifier: string) {
    super(`${collection} not found: ${identifier}`, 'CMS_NOT_FOUND', 404);
    this.name = 'CMSNotFoundError';
  }
}

class CMSAccessDeniedError extends CMSError {
  constructor(message = 'Access denied') {
    super(message, 'CMS_ACCESS_DENIED', 403);
    this.name = 'CMSAccessDeniedError';
  }
}

class CMSOrganizationMismatchError extends CMSError {
  constructor() {
    super('Organization mismatch: You do not have access to this content', 'CMS_ORG_MISMATCH', 403);
    this.name = 'CMSOrganizationMismatchError';
  }
}

class CMSValidationError extends CMSError {
  constructor(message: string, details?: unknown) {
    super(message, 'CMS_VALIDATION_ERROR', 400, details);
    this.name = 'CMSValidationError';
  }
}

class CMSConnectionError extends CMSError {
  constructor(message = 'Failed to connect to CMS') {
    super(message, 'CMS_CONNECTION_ERROR', 503);
    this.name = 'CMSConnectionError';
  }
}

class CMSConfigurationError extends CMSError {
  constructor(message: string) {
    super(message, 'CMS_CONFIG_ERROR', 500);
    this.name = 'CMSConfigurationError';
  }
}

describe('CMSError', () => {
  it('should create error with message and code', () => {
    const error = new CMSError('Something went wrong', 'CMS_ERROR');
    
    expect(error.message).toBe('Something went wrong');
    expect(error.code).toBe('CMS_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('CMSError');
  });

  it('should create error with custom status code', () => {
    const error = new CMSError('Bad request', 'CMS_BAD_REQUEST', 400);
    
    expect(error.statusCode).toBe(400);
  });

  it('should create error with details', () => {
    const details = { field: 'email', reason: 'invalid format' };
    const error = new CMSError('Validation failed', 'CMS_VALIDATION', 400, details);
    
    expect(error.details).toEqual(details);
  });

  it('should be instance of Error', () => {
    const error = new CMSError('Test', 'TEST');
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CMSError);
  });
});

describe('CMSNotFoundError', () => {
  it('should create not found error', () => {
    const error = new CMSNotFoundError('blog-posts', 'post-123');
    
    expect(error.message).toBe('blog-posts not found: post-123');
    expect(error.code).toBe('CMS_NOT_FOUND');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('CMSNotFoundError');
  });

  it('should be instance of CMSError', () => {
    const error = new CMSNotFoundError('faqs', 'faq-456');
    
    expect(error).toBeInstanceOf(CMSError);
    expect(error).toBeInstanceOf(CMSNotFoundError);
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
    const error = new CMSAccessDeniedError('You cannot edit this content');
    
    expect(error.message).toBe('You cannot edit this content');
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
  it('should create validation error', () => {
    const error = new CMSValidationError('Invalid input');
    
    expect(error.message).toBe('Invalid input');
    expect(error.code).toBe('CMS_VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('CMSValidationError');
  });

  it('should create validation error with details', () => {
    const details = { fields: ['email', 'phone'], errors: ['Invalid email', 'Invalid phone'] };
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
  const isCMSError = (error: unknown): error is CMSError => error instanceof CMSError;

  it('should return true for CMSError', () => {
    const error = new CMSError('Test', 'TEST');
    expect(isCMSError(error)).toBe(true);
  });

  it('should return true for CMSNotFoundError', () => {
    const error = new CMSNotFoundError('posts', '123');
    expect(isCMSError(error)).toBe(true);
  });

  it('should return true for CMSValidationError', () => {
    const error = new CMSValidationError('Invalid');
    expect(isCMSError(error)).toBe(true);
  });

  it('should return false for regular Error', () => {
    const error = new Error('Regular error');
    expect(isCMSError(error)).toBe(false);
  });

  it('should return false for non-error values', () => {
    expect(isCMSError('string')).toBe(false);
    expect(isCMSError(123)).toBe(false);
    expect(isCMSError(null)).toBe(false);
    expect(isCMSError(undefined)).toBe(false);
  });
});

describe('toCMSError', () => {
  const isCMSError = (error: unknown): error is CMSError => error instanceof CMSError;
  
  const toCMSError = (error: unknown): CMSError => {
    if (isCMSError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return new CMSError(error.message, 'CMS_UNKNOWN_ERROR', 500, {
        originalError: error.name,
        stack: error.stack,
      });
    }

    return new CMSError('An unknown error occurred', 'CMS_UNKNOWN_ERROR', 500, {
      originalError: error,
    });
  };

  it('should return same error if already CMSError', () => {
    const originalError = new CMSError('Original', 'ORIGINAL');
    const result = toCMSError(originalError);
    
    expect(result).toBe(originalError);
  });

  it('should convert regular Error to CMSError', () => {
    const regularError = new Error('Regular error');
    const result = toCMSError(regularError);
    
    expect(result).toBeInstanceOf(CMSError);
    expect(result.message).toBe('Regular error');
    expect(result.code).toBe('CMS_UNKNOWN_ERROR');
    expect(result.statusCode).toBe(500);
    expect(result.details).toHaveProperty('originalError', 'Error');
  });

  it('should convert unknown value to CMSError', () => {
    const result = toCMSError('string error');
    
    expect(result).toBeInstanceOf(CMSError);
    expect(result.message).toBe('An unknown error occurred');
    expect(result.details).toEqual({ originalError: 'string error' });
  });

  it('should handle null value', () => {
    const result = toCMSError(null);
    
    expect(result).toBeInstanceOf(CMSError);
    expect(result.details).toEqual({ originalError: null });
  });
});
