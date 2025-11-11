"use client";

import { useState } from "react";
import { LayoutDashboard, TrendingUp } from "lucide-react";

interface TeamTabsProps {
  overview: React.ReactNode;
  analytics: React.ReactNode;
}

export function TeamTabs({ overview, analytics }: TeamTabsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "analytics">(
    "overview"
  );

  return (
    <div>
      {/* 탭 헤더 - Vercel 스타일 */}
      <div className="flex items-center gap-1 border-b border-[var(--border-soft)] mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer -mb-px ${
            activeTab === "overview"
              ? "border-[#00C16A] text-[#F4F4F5]"
              : "border-transparent text-[#71717A] hover:text-[#A1A1AA]"
          }`}
          type="button"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          개요
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer -mb-px ${
            activeTab === "analytics"
              ? "border-[#00C16A] text-[#F4F4F5]"
              : "border-transparent text-[#71717A] hover:text-[#A1A1AA]"
          }`}
          type="button"
        >
          <TrendingUp className="h-3.5 w-3.5" />
          통계
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div>
        {activeTab === "overview" && overview}
        {activeTab === "analytics" && analytics}
      </div>
    </div>
  );
}

