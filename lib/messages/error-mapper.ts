/**
 * Error Message Mapper
 *
 * APIエラーコードを多言語対応のエラーメッセージにマッピング
 * エラーハンドリングを一元管理し、ユーザーフレンドリーなメッセージを提供
 *
 * エラーメッセージは locales/*/errors.json で定義
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
  | 'AUTH_ACCOUNT_LOCKED'
  // 認可エラー
  | 'FORBIDDEN'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'ORGANIZATION_ACCESS_DENIED'
  // バリデーションエラー
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
  // リソースエラー
  | 'NOT_FOUND'
  | 'LEAD_NOT_FOUND'
  | 'ORGANIZATION_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'MEMBER_NOT_FOUND'
  // ビジネスロジックエラー
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
  // サーバーエラー
  | 'SERVER_ERROR'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'BAD_GATEWAY'
  | 'SERVICE_UNAVAILABLE'
  | 'GATEWAY_TIMEOUT'
  // 汎用エラー
  | 'UNKNOWN_ERROR';

/**
 * エラーメッセージのマッピング
 * i18nキーを返す（実際のメッセージはlocales/*/errors.jsonで定義）
 */
export const errorMessageMap: Record<ErrorCode, string> = {
  // 認証エラー
  AUTH_REQUIRED: 'auth.unauthorized',
  AUTH_INVALID_CREDENTIALS: 'auth.invalidCredentials',
  AUTH_SESSION_EXPIRED: 'auth.sessionExpired',
  AUTH_TOKEN_INVALID: 'auth.invalidToken',
  AUTH_ACCOUNT_LOCKED: 'auth.accountLocked',

  // 認可エラー
  FORBIDDEN: 'api.403',
  INSUFFICIENT_PERMISSIONS: 'member.insufficientPermissions',
  ORGANIZATION_ACCESS_DENIED: 'organization.accessDenied',

  // バリデーションエラー
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

  // リソースエラー
  NOT_FOUND: 'api.404',
  LEAD_NOT_FOUND: 'lead.notFound',
  ORGANIZATION_NOT_FOUND: 'organization.notFound',
  USER_NOT_FOUND: 'api.404',
  MEMBER_NOT_FOUND: 'member.notFound',

  // ビジネスロジックエラー
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

  // サーバーエラー
  SERVER_ERROR: 'api.500',
  DATABASE_ERROR: 'api.500',
  NETWORK_ERROR: 'api.network',
  TIMEOUT: 'api.timeout',
  BAD_GATEWAY: 'api.502',
  SERVICE_UNAVAILABLE: 'api.503',
  GATEWAY_TIMEOUT: 'api.504',

  // 汎用エラー
  UNKNOWN_ERROR: 'api.unknown',
};

/**
 * HTTPステータスコードからエラーコードへのマッピング
 */
export const httpStatusToErrorCode: Record<number, ErrorCode> = {
  400: 'VALIDATION_ERROR',
  401: 'AUTH_REQUIRED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  500: 'SERVER_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
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

/**
 * エラーメッセージをi18nキーから取得するヘルパー
 *
 * 使用例:
 * ```tsx
 * import { useTranslations } from 'next-intl';
 * import { getLocalizedErrorMessage } from '@/lib/messages/error-mapper';
 *
 * function MyComponent() {
 *   const tErrors = useTranslations('errors');
 *
 *   try {
 *     // API call
 *   } catch (error) {
 *     const errorResponse = await mapFetchErrorToErrorResponse(error);
 *     const message = getLocalizedErrorMessage(errorResponse, tErrors);
 *     toast.error(message);
 *   }
 * }
 * ```
 */
export function getLocalizedErrorMessage(
  errorResponse: ErrorResponse,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  const key = getErrorMessageKey(errorResponse.code);

  // パラメータ付きメッセージの場合
  if (errorResponse.field || errorResponse.details) {
    return t(key, {
      field: errorResponse.field || '',
      ...errorResponse.details,
    });
  }

  // 通常のメッセージ
  return t(key);
}

/**
 * トーストメッセージのキーを取得
 */
export function getToastMessageKey(
  operation: 'create' | 'update' | 'delete',
  resource: 'lead' | 'organization' | 'member' | 'settings',
  isError: boolean
): string {
  const action = isError ? `${operation}Error` : operation === 'create' ? 'created' : operation === 'update' ? 'updated' : 'deleted';
  return `toast.${resource}.${action}`;
}
