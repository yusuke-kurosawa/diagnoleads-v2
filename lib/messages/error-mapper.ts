/**
 * Error Message Mapper
 *
 * APIエラーコードを多言語対応のエラーメッセージにマッピング
 * エラーハンドリングを一元管理し、ユーザーフレンドリーなメッセージを提供
 */

/**
 * エラーコードの型定義
 */
export type ErrorCode =
  // 認証エラー
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_TOKEN_INVALID'
  // 認可エラー
  | 'FORBIDDEN'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'ORGANIZATION_ACCESS_DENIED'
  // バリデーションエラー
  | 'VALIDATION_ERROR'
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'REQUIRED_FIELD'
  | 'FIELD_TOO_LONG'
  | 'FIELD_TOO_SHORT'
  // リソースエラー
  | 'NOT_FOUND'
  | 'LEAD_NOT_FOUND'
  | 'ORGANIZATION_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'MEMBER_NOT_FOUND'
  // ビジネスロジックエラー
  | 'DUPLICATE_EMAIL'
  | 'DUPLICATE_PHONE'
  | 'LEAD_ALREADY_CONVERTED'
  | 'CANNOT_DELETE_OWNER'
  | 'ORGANIZATION_LIMIT_REACHED'
  // サーバーエラー
  | 'SERVER_ERROR'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  // レート制限
  | 'RATE_LIMIT_EXCEEDED'
  // 汎用エラー
  | 'UNKNOWN_ERROR';

/**
 * エラーメッセージのマッピング
 * i18nキーを返す（実際のメッセージはlocales/*/common.jsonで定義）
 */
export const errorMessageMap: Record<ErrorCode, string> = {
  // 認証エラー
  AUTH_REQUIRED: 'errors.unauthorized',
  AUTH_INVALID_CREDENTIALS: 'errors.invalidCredentials',
  AUTH_SESSION_EXPIRED: 'errors.sessionExpired',
  AUTH_TOKEN_INVALID: 'errors.tokenInvalid',

  // 認可エラー
  FORBIDDEN: 'errors.forbidden',
  INSUFFICIENT_PERMISSIONS: 'errors.insufficientPermissions',
  ORGANIZATION_ACCESS_DENIED: 'errors.organizationAccessDenied',

  // バリデーションエラー
  VALIDATION_ERROR: 'errors.validation',
  INVALID_EMAIL: 'validation.email',
  INVALID_PHONE: 'validation.phone',
  REQUIRED_FIELD: 'validation.required',
  FIELD_TOO_LONG: 'validation.maxLength',
  FIELD_TOO_SHORT: 'validation.minLength',

  // リソースエラー
  NOT_FOUND: 'errors.notFound',
  LEAD_NOT_FOUND: 'errors.leadNotFound',
  ORGANIZATION_NOT_FOUND: 'errors.organizationNotFound',
  USER_NOT_FOUND: 'errors.userNotFound',
  MEMBER_NOT_FOUND: 'errors.memberNotFound',

  // ビジネスロジックエラー
  DUPLICATE_EMAIL: 'errors.duplicateEmail',
  DUPLICATE_PHONE: 'errors.duplicatePhone',
  LEAD_ALREADY_CONVERTED: 'errors.leadAlreadyConverted',
  CANNOT_DELETE_OWNER: 'errors.cannotDeleteOwner',
  ORGANIZATION_LIMIT_REACHED: 'errors.organizationLimitReached',

  // サーバーエラー
  SERVER_ERROR: 'errors.serverError',
  DATABASE_ERROR: 'errors.databaseError',
  NETWORK_ERROR: 'errors.network',
  TIMEOUT: 'errors.timeout',

  // レート制限
  RATE_LIMIT_EXCEEDED: 'errors.rateLimitExceeded',

  // 汎用エラー
  UNKNOWN_ERROR: 'errors.generic',
};

/**
 * HTTPステータスコードからエラーコードへのマッピング
 */
export const httpStatusToErrorCode: Record<number, ErrorCode> = {
  400: 'VALIDATION_ERROR',
  401: 'AUTH_REQUIRED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  429: 'RATE_LIMIT_EXCEEDED',
  500: 'SERVER_ERROR',
  502: 'SERVER_ERROR',
  503: 'SERVER_ERROR',
  504: 'TIMEOUT',
};

/**
 * エラーレスポンスの型
 */
export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

/**
 * エラーコードからi18nキーを取得
 */
export function getErrorMessageKey(errorCode: ErrorCode): string {
  return errorMessageMap[errorCode] || errorMessageMap.UNKNOWN_ERROR;
}

/**
 * HTTPステータスコードからエラーコードを取得
 */
export function getErrorCodeFromStatus(status: number): ErrorCode {
  return httpStatusToErrorCode[status] || 'UNKNOWN_ERROR';
}

/**
 * エラーレスポンスを作成
 */
export function createErrorResponse(
  code: ErrorCode,
  message?: string,
  field?: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    code,
    message: message || getErrorMessageKey(code),
    field,
    details,
  };
}

/**
 * Fetch APIのエラーをErrorResponseに変換
 */
export async function mapFetchErrorToErrorResponse(error: unknown): Promise<ErrorResponse> {
  // ネットワークエラー
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return createErrorResponse('NETWORK_ERROR');
  }

  // Response オブジェクトの場合
  if (error instanceof Response) {
    try {
      const data = await error.json();
      const errorCode = data.code || getErrorCodeFromStatus(error.status);
      return createErrorResponse(errorCode, data.message, data.field, data.details);
    } catch {
      return createErrorResponse(getErrorCodeFromStatus(error.status));
    }
  }

  // その他のエラー
  return createErrorResponse('UNKNOWN_ERROR');
}

/**
 * tRPCエラーをErrorResponseに変換
 */
export function mapTRPCErrorToErrorResponse(error: {
  code: string;
  message: string;
  data?: { code?: ErrorCode; field?: string; details?: Record<string, unknown> };
}): ErrorResponse {
  // tRPCのエラーコードをマッピング
  const trpcCodeToErrorCode: Record<string, ErrorCode> = {
    UNAUTHORIZED: 'AUTH_REQUIRED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    BAD_REQUEST: 'VALIDATION_ERROR',
    INTERNAL_SERVER_ERROR: 'SERVER_ERROR',
    TIMEOUT: 'TIMEOUT',
  };

  const errorCode = error.data?.code || trpcCodeToErrorCode[error.code] || 'UNKNOWN_ERROR';

  return createErrorResponse(errorCode, error.message, error.data?.field, error.data?.details);
}
