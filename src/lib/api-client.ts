/**
 * API 클라이언트 유틸리티
 * Supabase 에러를 처리하고 재시도 로직을 제공
 */

import { normalizeError, logError, getErrorMessage, ErrorType } from "./error-handler";
import type { AppError } from "./error-handler";

export interface ApiResult<T> {
  data: T | null;
  error: AppError | null;
}

/**
 * Supabase 쿼리 실행 및 에러 처리
 */
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  context?: string
): Promise<ApiResult<T>> {
  try {
    const result = await queryFn();

    if (result.error) {
      const appError = normalizeError(result.error);
      logError(appError, context);
      return {
        data: null,
        error: appError,
      };
    }

    return {
      data: result.data,
      error: null,
    };
  } catch (error: any) {
    const appError = normalizeError(error);
    logError(appError, context);
    return {
      data: null,
      error: appError,
    };
  }
}

/**
 * 재시도 로직이 포함된 쿼리 실행
 */
export async function executeQueryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    context?: string;
  } = {}
): Promise<ApiResult<T>> {
  const { maxRetries = 3, retryDelay = 1000, context } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await executeQuery(queryFn, context);

    // 성공하거나 재시도할 수 없는 에러면 반환
    if (
      !result.error ||
      result.error.type !== ErrorType.NETWORK ||
      attempt === maxRetries
    ) {
      return result;
    }

    // 네트워크 에러인 경우 재시도
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }

  return {
    data: null,
      error: {
      type: ErrorType.UNKNOWN,
      message: "요청이 실패했습니다. 여러 번 시도했지만 성공하지 못했습니다.",
    },
  };
}

/**
 * 사용자 친화적 에러 메시지 가져오기
 */
export function getUserFriendlyMessage(error: AppError | null): string {
  if (!error) return "알 수 없는 오류가 발생했습니다.";
  return error.message;
}

// normalizeError를 re-export하여 편의성 제공
export { normalizeError } from "./error-handler";

