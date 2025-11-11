"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅 (프로덕션에서는 에러 리포팅 서비스로 전송)
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0F1115]">
          <div className="max-w-md w-full rounded-lg border border-[#2C354B] bg-[#141824] p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-500/10 p-3">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#F4F4F5] mb-2">
              오류가 발생했습니다
            </h1>
            <p className="text-[#A1A1AA] mb-6">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 홈으로
              돌아가주세요.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-[#A1A1AA] mb-2">
                  에러 상세 정보 (개발 모드)
                </summary>
                <pre className="text-xs text-red-400 bg-[#2C354B] p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                다시 시도
              </Button>
              <Link href="/" className="flex-1">
                <Button variant="default" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  홈으로
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

