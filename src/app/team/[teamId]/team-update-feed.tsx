"use client";

import { CalendarDays, CheckSquare, Megaphone } from "lucide-react";

export type TeamUpdateItem = {
  id: string;
  type: "notice" | "match" | "vote";
  title: string;
  description?: string | null;
  timestamp: string;
  meta?: string | null;
};

interface TeamUpdateFeedProps {
  items: TeamUpdateItem[];
}

const typeConfig: Record<
  TeamUpdateItem["type"],
  { label: string; iconBg: string; iconColor: string }
> = {
  notice: {
    label: "팀 공지",
    iconBg: "bg-amber-400/15",
    iconColor: "text-amber-300",
  },
  match: {
    label: "매치 편성",
    iconBg: "bg-blue-400/15",
    iconColor: "text-blue-300",
  },
  vote: {
    label: "투표 요청",
    iconBg: "bg-emerald-400/15",
    iconColor: "text-emerald-300",
  },
};

const iconMap: Record<TeamUpdateItem["type"], React.ElementType> = {
  notice: Megaphone,
  match: CalendarDays,
  vote: CheckSquare,
};

function formatTimestampLabel(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const relativeFormatter = new Intl.RelativeTimeFormat("ko", {
    numeric: "auto",
  });

  const now = Date.now();
  const diff = date.getTime() - now;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  let relativeLabel = "";

  if (Math.abs(diff) < minute) {
    relativeLabel = "방금 전";
  } else if (Math.abs(diff) < hour) {
    relativeLabel = relativeFormatter.format(Math.round(diff / minute), "minute");
  } else if (Math.abs(diff) < day) {
    relativeLabel = relativeFormatter.format(Math.round(diff / hour), "hour");
  } else if (Math.abs(diff) < day * 7) {
    relativeLabel = relativeFormatter.format(
      Math.round(diff / day),
      "day",
    );
  }

  if (relativeLabel) {
    return `${relativeLabel} · ${formatter.format(date)}`;
  }

  return formatter.format(date);
}

export function TeamUpdateFeed({ items }: TeamUpdateFeedProps) {
  const displayItems = items.slice(0, 3); // 최대 3개만 표시

  return (
    <div className="surface-layer rounded-lg p-4 border border-[var(--border-soft)]">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-[#F4F4F5]">최근 업데이트</h3>
        {items.length > 3 && (
          <span className="text-xs text-[#A1A1AA]">
            +{items.length - 3}개 더
          </span>
        )}
      </div>

      {displayItems.length === 0 ? (
        <div className="text-xs text-[#A1A1AA] py-2">
          새로운 업데이트가 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {displayItems.map((item) => {
            const Icon = iconMap[item.type];
            const config = typeConfig[item.type];

            return (
              <div
                key={item.id}
                className="flex items-center gap-2 text-xs text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors"
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${config.iconBg} ${config.iconColor}`}
                >
                  <Icon className="h-3 w-3" />
                </div>
                <span className="flex-1 truncate">{item.title}</span>
                <span className="text-[#71717A] shrink-0">
                  {formatTimestampLabel(item.timestamp).split("·")[0]?.trim()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

