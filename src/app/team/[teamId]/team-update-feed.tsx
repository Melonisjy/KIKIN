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
  return (
    <section
      className="surface-layer rounded-2xl border border-[var(--border-soft)]"
      data-variant="subtle"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-faint)] px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-[#F4F4F5]">
            팀 업데이트 피드
          </h2>
          <p className="text-xs text-[#96A3C4]">
            공지, 매치, 투표 소식을 한 곳에서 확인하세요.
          </p>
        </div>
        <span className="rounded-full bg-[#1A2333] px-3 py-1 text-xs font-semibold text-[#96A3C4]">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-[#96A3C4]">
          아직 새로운 팀 업데이트가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-4 py-5">
          {items.map((item) => {
            const Icon = iconMap[item.type];
            const config = typeConfig[item.type];

            const iconClasses = [
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
              config.iconBg,
              config.iconColor,
            ].join(" ");

            return (
              <article
                key={item.id}
                className="group flex items-start gap-4 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-1)] px-4 py-3 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] hover:-translate-y-0.5"
              >
                <div
                  className={`${iconClasses} group-hover:bg-emerald-400/15 group-hover:text-emerald-300`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#96A3C4]">
                    <span className="rounded-full bg-[#1F2536] px-2 py-0.5 font-semibold text-[#A0AABE]">
                      {config.label}
                    </span>
                    <span>{formatTimestampLabel(item.timestamp)}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#F4F4F5] leading-relaxed">
                    {item.title}
                  </p>
                  {item.description ? (
                    <p className="text-xs text-[#96A3C4] leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  ) : null}
                  {item.meta ? (
                    <p className="text-xs text-[#6F7280] leading-relaxed">
                      {item.meta}
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

