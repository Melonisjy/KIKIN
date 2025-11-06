import { redirect } from "next/navigation";

// 프리미엄 기능은 초기 버전에서 비활성화됨
export default async function PremiumPage() {
  redirect("/locker-room");
}
