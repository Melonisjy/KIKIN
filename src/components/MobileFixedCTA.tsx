"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface MobileFixedCTAProps {
  user: any;
}

export function MobileFixedCTA({ user }: MobileFixedCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] border-t border-[#2C354B] bg-[#0F1115]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0F1115]/95 sm:hidden">
      <div className="container mx-auto px-4 py-4">
        <Link href={!user ? "/login" : "/locker-room"} className="block">
          <Button
            size="lg"
            className="w-full min-h-[52px] text-base font-semibold touch-manipulation"
          >
            {!user ? "지금 시작하기" : "라커룸 입장"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

