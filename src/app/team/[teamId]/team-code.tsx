"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

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

  const displayCode = teamId.length > 12 
    ? `${teamId.slice(0, 6)}...${teamId.slice(-6)}`
    : teamId;

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-xs text-[#71717A]">코드:</span>
      <code className="text-xs font-mono text-[#A1A1AA] bg-[var(--surface-2)] px-1.5 py-0.5 rounded border border-[var(--border-soft)]">
        {displayCode}
      </code>
      <button
        onClick={handleCopy}
        className="p-0.5 hover:bg-[var(--surface-2)] rounded transition-colors"
        type="button"
        title="팀 코드 복사"
      >
        {copied ? (
          <Check className="h-3 w-3 text-[#00C16A]" />
        ) : (
          <Copy className="h-3 w-3 text-[#71717A] hover:text-[#A1A1AA]" />
        )}
      </button>
    </div>
  );
}

