"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeamCodeProps {
  teamId: string;
}

export function TeamCode({ teamId }: TeamCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(teamId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            팀 코드
          </label>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-foreground break-all bg-background px-2 py-1 rounded border">
              {teamId}
            </code>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            이 코드를 공유하여 팀원을 초대하세요.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex-shrink-0"
          type="button"
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              복사됨
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              복사
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

