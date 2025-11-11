"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateNoticeModal } from "./create-notice";

export function CreateNoticeButton({
  teamId,
  className,
}: {
  teamId: string;
  className?: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} size="sm" variant="ghost" className={className}>
        <Plus className="h-3 w-3" />
      </Button>
      <CreateNoticeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teamId={teamId}
      />
    </>
  );
}

