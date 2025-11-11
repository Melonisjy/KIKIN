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
    <div className="inline-flex items-center gap-2 ml-3">
      <span className="text-xs text-[#A1A1AA]">팀코드:</span>
      <code className="text-xs font-mono text-[#A1A1AA] bg-[#2C354B] px-2 py-1 rounded">
        {displayCode}
      </code>
      <button
        onClick={handleCopy}
        className="p-1 hover:bg-[#2C354B] rounded transition-colors"
        type="button"
        title="팀 코드 복사"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-[#00C16A]" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-[#A1A1AA] hover:text-[#F4F4F5]" />
        )}
      </button>
    </div>
  );
}

