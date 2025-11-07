/**
 * 에러 처리 유틸리티
 * Supabase 에러를 사용자 친화적 메시지로 변환
 */

export enum ErrorType {
  NETWORK = "NETWORK",
  AUTH = "AUTH",
  PERMISSION = "PERMISSION",
  VALIDATION = "VALIDATION",
  NOT_FOUND = "NOT_FOUND",
  UNKNOWN = "UNKNOWN",
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  code?: string;
}

/**
 * Supabase 에러 코드를 ErrorType으로 변환
 */
function getErrorType(error: any): ErrorType {
  if (!error) return ErrorType.UNKNOWN;

  const code = error.code || "";
  const message = error.message || "";

  // 네트워크 에러
  if (
    code === "PGRST301" ||
    message.includes("network") ||
    message.includes("fetch")
  ) {
    return ErrorType.NETWORK;
  }

  // 인증 에러
  if (
    code === "PGRST301" ||
    message.includes("JWT") ||
    message.includes("authentication") ||
    message.includes("unauthorized")
  ) {
    return ErrorType.AUTH;
  }

  // 권한 에러
  if (
    code === "42501" ||
    message.includes("permission") ||
    message.includes("row-level security") ||
    message.includes("RLS")
  ) {
    return ErrorType.PERMISSION;
  }

  // 찾을 수 없음
  if (
    code === "PGRST116" ||
    code === "42P01" ||
    message.includes("not found") ||
    message.includes("does not exist")
  ) {
    return ErrorType.NOT_FOUND;
  }

  // 유효성 검사 에러
  if (
    code === "23505" || // unique violation
    code === "23503" || // foreign key violation
    message.includes("violates") ||
    message.includes("constraint")
  ) {
    return ErrorType.VALIDATION;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Supabase 에러를 사용자 친화적 메시지로 변환
 */
export function getErrorMessage(error: any): string {
  if (!error) return "알 수 없는 오류가 발생했습니다.";

  const type = getErrorType(error);
  const code = error.code || "";
  const message = error.message || "";

  switch (type) {
    case ErrorType.NETWORK:
      return "네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.";

    case ErrorType.AUTH:
      return "로그인이 필요합니다. 다시 로그인해주세요.";

    case ErrorType.PERMISSION:
      if (code === "PGRST205") {
        return "데이터베이스 스키마를 새로고침해주세요.";
      }
      if (message.includes("row-level security")) {
        return "이 작업을 수행할 권한이 없습니다.";
      }
      return "권한이 없습니다. 필요한 권한이 있는지 확인해주세요.";

    case ErrorType.NOT_FOUND:
      if (code === "PGRST116") {
        return "요청한 데이터를 찾을 수 없습니다.";
      }
      if (code === "42P01") {
        return "데이터베이스 테이블을 찾을 수 없습니다. 관리자에게 문의해주세요.";
      }
      return "요청한 정보를 찾을 수 없습니다.";

    case ErrorType.VALIDATION:
      if (code === "23505") {
        return "이미 존재하는 데이터입니다.";
      }
      if (code === "23503") {
        return "관련된 데이터가 없어 작업을 완료할 수 없습니다.";
      }
      return "입력한 정보를 확인해주세요.";

    case ErrorType.UNKNOWN:
    default:
      // 원본 메시지가 있으면 사용, 없으면 기본 메시지
      if (message && message.length > 0) {
        return message;
      }
      return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
}

/**
 * 에러를 AppError 객체로 변환
 */
export function normalizeError(error: any): AppError {
  return {
    type: getErrorType(error),
    message: getErrorMessage(error),
    originalError: error,
    code: error?.code,
  };
}

/**
 * 에러 로깅 (개발 환경에서만 상세 로그)
 */
export function logError(error: AppError, context?: string) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[Error${context ? ` in ${context}` : ""}]`, {
      type: error.type,
      message: error.message,
      code: error.code,
      originalError: error.originalError,
    });
  }
  // 프로덕션에서는 에러 리포팅 서비스로 전송 가능
}
