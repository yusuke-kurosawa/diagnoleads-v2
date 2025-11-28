/**
 * CMS Custom Errors
 *
 * CMS操作に関するカスタムエラー定義
 */

export class CMSError extends Error {
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

export class CMSNotFoundError extends CMSError {
  constructor(collection: string, identifier: string) {
    super(`${collection} not found: ${identifier}`, 'CMS_NOT_FOUND', 404);
    this.name = 'CMSNotFoundError';
  }
}

export class CMSAccessDeniedError extends CMSError {
  constructor(message = 'Access denied') {
    super(message, 'CMS_ACCESS_DENIED', 403);
    this.name = 'CMSAccessDeniedError';
  }
}

export class CMSOrganizationMismatchError extends CMSError {
  constructor() {
    super('Organization mismatch: You do not have access to this content', 'CMS_ORG_MISMATCH', 403);
    this.name = 'CMSOrganizationMismatchError';
  }
}

export class CMSValidationError extends CMSError {
  constructor(message: string, details?: unknown) {
    super(message, 'CMS_VALIDATION_ERROR', 400, details);
    this.name = 'CMSValidationError';
  }
}

export class CMSConnectionError extends CMSError {
  constructor(message = 'Failed to connect to CMS') {
    super(message, 'CMS_CONNECTION_ERROR', 503);
    this.name = 'CMSConnectionError';
  }
}

export class CMSConfigurationError extends CMSError {
  constructor(message: string) {
    super(message, 'CMS_CONFIG_ERROR', 500);
    this.name = 'CMSConfigurationError';
  }
}

/**
 * エラーがCMSエラーかどうかを判定
 */
export function isCMSError(error: unknown): error is CMSError {
  return error instanceof CMSError;
}

/**
 * エラーを適切なCMSエラーに変換
 */
export function toCMSError(error: unknown): CMSError {
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
}
