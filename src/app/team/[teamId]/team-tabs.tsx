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
    <div className="space-y-4">
      {/* 탭 헤더 */}
      <div className="flex items-center gap-2 border-b border-[var(--border-soft)]">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === "overview"
              ? "border-[#00C16A] text-[#00C16A]"
              : "border-transparent text-[#A1A1AA] hover:text-[#F4F4F5]"
          }`}
          type="button"
        >
          <LayoutDashboard className="h-4 w-4" />
          개요
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === "analytics"
              ? "border-[#00C16A] text-[#00C16A]"
              : "border-transparent text-[#A1A1AA] hover:text-[#F4F4F5]"
          }`}
          type="button"
        >
          <TrendingUp className="h-4 w-4" />
          통계
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && overview}
        {activeTab === "analytics" && analytics}
      </div>
    </div>
  );
}

