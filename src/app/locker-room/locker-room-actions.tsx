"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JoinTeamModal } from "@/components/JoinTeamModal";

export function LockerRoomActions() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsJoinModalOpen(true)}
        className="w-full sm:w-auto"
      >
        <UserPlus className="mr-2 h-4 w-4" />
        팀 코드로 가입
      </Button>
      <JoinTeamModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </>
  );
}

