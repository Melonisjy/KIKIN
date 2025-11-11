"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Edit2 } from "lucide-react";
import { SetNameModal } from "./SetNameModal";

interface ProfileCardProps {
  userName: string | null;
  userEmail: string;
}

export function ProfileCard({ userName, userEmail }: ProfileCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl border border-[#2C354B] bg-[#141824] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00C16A] text-[#0F1115] text-lg font-semibold">
              {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#F4F4F5]">
                {userName || "이름 없음"}
              </h3>
              <p className="text-sm text-[#A1A1AA]">{userEmail}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="gap-2"
          >
            <Edit2 className="h-4 w-4" />
            이름 수정
          </Button>
        </div>
      </div>
      {isModalOpen && (
        <SetNameModal
          isOpen={isModalOpen}
          currentName={userName}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

