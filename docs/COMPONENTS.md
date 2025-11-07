# 컴포넌트 사용 가이드

## 공통 컴포넌트

### Button
버튼 컴포넌트

**위치:** `src/components/ui/button.tsx`

**사용 예시:**
```tsx
import { Button } from "@/components/ui/button";

<Button variant="default" size="lg">클릭</Button>
<Button variant="outline" size="sm">취소</Button>
<Button variant="destructive">삭제</Button>
```

**Props:**
- `variant`: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link"
- `size`: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"
- `disabled`: boolean
- `asChild`: boolean (Slot으로 렌더링)

### Modal
모달 다이얼로그 컴포넌트

**위치:** `src/components/Modal.tsx`

**사용 예시:**
```tsx
import { Modal } from "@/components/Modal";

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="제목"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  confirmText="확인"
  cancelText="취소"
  variant="default" // 또는 "danger"
>
  내용
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `children`: ReactNode
- `confirmText?`: string (기본값: "확인")
- `cancelText?`: string (기본값: "취소")
- `onConfirm?`: () => void
- `onCancel?`: () => void
- `variant?`: "default" | "danger"

### Toast
토스트 알림 시스템

**위치:** `src/components/Toast.tsx`

**사용 예시:**
```tsx
import { toast } from "@/components/Toast";

toast.success("성공 메시지");
toast.error("에러 메시지");
toast.warning("경고 메시지");
toast.info("정보 메시지");
```

**함수:**
- `toast.success(message: string, duration?: number)`
- `toast.error(message: string, duration?: number)`
- `toast.warning(message: string, duration?: number)`
- `toast.info(message: string, duration?: number)`

**참고:** `ToastContainer`는 `src/app/layout.tsx`에 이미 포함되어 있습니다.

### ErrorBoundary
에러 경계 컴포넌트

**위치:** `src/components/ErrorBoundary.tsx`

**사용 예시:**
```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**참고:** 루트 레이아웃에 이미 포함되어 있습니다.

## 기능 컴포넌트

### TeamCard
팀 카드 컴포넌트

**위치:** `src/components/TeamCard.tsx`

**사용 예시:**
```tsx
import { TeamCard } from "@/components/TeamCard";

<TeamCard
  team={team}
  role="leader"
  joinedAt="2025-01-01"
  memberCount={5}
  leaderName="홍길동"
/>
```

**Props:**
- `team`: { id, name, description?, created_at }
- `role`: "leader" | "member"
- `joinedAt`: string (ISO 날짜)
- `memberCount?`: number
- `leaderName?`: string | null

### MatchCard
경기 카드 컴포넌트

**위치:** `src/components/MatchCard.tsx`

**사용 예시:**
```tsx
import { MatchCard } from "@/components/MatchCard";

<MatchCard
  match={{
    id: "...",
    date: "2025-01-01",
    time: "18:00",
    location: "경기장",
    note: "메모",
    status: "upcoming"
  }}
  showTeam={true}
  teamName="우리팀"
  participantStats={{
    going: 5,
    notGoing: 2,
    maybe: 1
  }}
/>
```

**Props:**
- `match`: { id, date, time, location, note?, status }
- `showTeam?`: boolean
- `teamName?`: string
- `participantStats?`: { going, notGoing, maybe }

### JoinTeamModal
팀 가입 모달 컴포넌트

**위치:** `src/components/JoinTeamModal.tsx`

**사용 예시:**
```tsx
import { JoinTeamModal } from "@/components/JoinTeamModal";

<JoinTeamModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

**Props:**
- `isOpen`: boolean
- `onClose`: () => void

### NotificationBell
알림 벨 컴포넌트

**위치:** `src/components/NotificationBell.tsx`

**사용 예시:**
```tsx
import { NotificationBell } from "@/components/NotificationBell";

<NotificationBell />
```

읽지 않은 알림 개수를 자동으로 표시합니다.

## 유틸리티

### error-handler
에러 처리 유틸리티

**위치:** `src/lib/error-handler.ts`

**함수:**
- `getErrorMessage(error: any): string` - 에러를 사용자 친화적 메시지로 변환
- `normalizeError(error: any): AppError` - 에러를 AppError 객체로 변환
- `logError(error: AppError, context?: string)` - 에러 로깅

### api-client
API 클라이언트 유틸리티

**위치:** `src/lib/api-client.ts`

**함수:**
- `executeQuery<T>(queryFn, context?): Promise<ApiResult<T>>` - 쿼리 실행 및 에러 처리
- `executeQueryWithRetry<T>(queryFn, options?): Promise<ApiResult<T>>` - 재시도 로직 포함 쿼리 실행
- `getUserFriendlyMessage(error: AppError | null): string` - 사용자 친화적 메시지 가져오기

### notifications
알림 생성 유틸리티 (클라이언트)

**위치:** `src/lib/notifications.ts`

**함수:**
- `notifyTeamRequest(leaderUserId, requesterName, teamId)` - 팀 가입 요청 알림
- `notifyRequestApproved(requesterUserId, teamName, teamId)` - 가입 승인 알림
- `notifyRequestRejected(requesterUserId, teamName, teamId)` - 가입 거절 알림
- `notifyMatchCreated(teamMemberIds, matchDate, teamName, matchId)` - 경기 생성 알림

### notifications-server
알림 생성 유틸리티 (서버)

**위치:** `src/lib/notifications-server.ts`

**함수:**
- `notifyMatchCreatedServer(teamMemberIds, matchDate, teamName, matchId)` - 경기 생성 알림 (서버 사이드)

