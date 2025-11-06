# 킥-인 (Kick-In) 디자인 시스템

## 🎯 디자인 철학

- **미니멀**: Nike, Apple, Figma, Notion처럼 깔끔하고 군더더기 없는 구조
- **다크 모드 기반**: 매트한 다크 배경에 밝은 포인트 컬러로 대비
- **공간감 있는 미니멀**: 단색 배경 + 포인트 컬러 + 큰 타이포그래피
- **효과 금지**: 그라데이션, 빛, 반짝임 효과 사용 금지

## 🎨 컬러 시스템

### 배경 컬러

- **메인 배경**: `#0F1115` - 매트한 다크
- **섹션/카드 배경**: `#181A1F` - 차분한 다크
- **경계선**: `#27272A` - 살짝 구분감

### 포인트 컬러

- **Primary**: `#00C16A` - 밝은 그린 (에너지 느낌)
- **Primary Hover**: `#00A85B` - 다소 어두운 그린

### 텍스트 컬러

- **기본 텍스트**: `#F4F4F5` - 화이트 톤 (약간 낮춘)
- **서브 텍스트**: `#A1A1AA` - 은은한 그레이

### CSS 변수

```css
--background: 15 17 21; /* #0F1115 */
--card: 24 26 31; /* #181A1F */
--primary: 0 193 106; /* #00C16A */
--foreground: 244 244 245; /* #F4F4F5 */
--muted-foreground: 161 161 170; /* #A1A1AA */
--border: 39 39 42; /* #27272A */
```

## 🧱 타이포그래피

### 폰트

- **한글**: `Pretendard`
- **영문**: `Inter`
- **폴백**: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

### 헤드라인

- **H1**: `font-size: 2.5rem`, `font-weight: 800`, `letter-spacing: -0.02em`
- **H2**: `font-size: 2rem`, `font-weight: 700`, `letter-spacing: -0.02em`
- **H3**: `font-size: 1.5rem`, `font-weight: 700`, `letter-spacing: -0.02em`

### 본문

- **기본**: `font-weight: 400`, `letter-spacing: 0.01em`, `line-height: 1.6`
- **컬러**: `#F4F4F5` (기본), `#A1A1AA` (서브)

## 🎛️ 버튼 스타일

### Primary Button

```tsx
className =
  "bg-[#00C16A] text-[#0F1115] hover:bg-[#00A85B] active:scale-[0.98] font-semibold";
```

### Outline Button

```tsx
className =
  "border border-[#27272A] bg-transparent text-[#F4F4F5] hover:bg-[#181A1F] active:scale-[0.98]";
```

### Secondary Button

```tsx
className =
  "bg-[#181A1F] text-[#F4F4F5] hover:bg-[#27272A] active:scale-[0.98]";
```

### Ghost Button

```tsx
className =
  "text-[#A1A1AA] hover:bg-[#181A1F] hover:text-[#F4F4F5] active:scale-[0.98]";
```

**공통 사항**:

- `rounded-lg` (border-radius: 0.5rem)
- `transition-all duration-200`
- `active:scale-[0.98]` (미세한 scale 효과만)

## 🎴 카드 스타일

```tsx
className = "rounded-xl border border-[#27272A] bg-[#181A1F] p-6";
```

**특징**:

- 그림자 대신 경계선으로 구분
- 호버 시 `hover:border-[#27272A]` (경계선 유지)
- `transition-all duration-200`

## ✨ 스플래시 화면

### 배경

- `#0F1115` (완전 다크)

### 로고

- 텍스트: "킥-인"
- 컬러: `#00C16A`
- 폰트: Pretendard ExtraBold (800)
- 애니메이션: `opacity + scale in` (2초)

### 태그라인

- 텍스트: "경기, 클릭으로 시작"
- 컬러: `#A1A1AA`
- 애니메이션: `fadeIn` (1.5초 딜레이)

**원칙**: 완전 미니멀, 장식/효과 금지

## 📐 여백 규칙

- **컨테이너**: `px-4 sm:px-6 lg:px-8`
- **섹션**: `py-16` 또는 `py-24`
- **카드 내부**: `p-6` 또는 `p-8`
- **요소 간격**: `gap-4`, `gap-6`, `gap-8`

## 🎬 애니메이션

### 허용되는 효과

- `opacity` 전환
- `scale` (미세한, 0.98 정도)
- `transition-all duration-200`

### 금지되는 효과

- 그라데이션
- 빛/글로우 효과
- 반짝임
- 복잡한 애니메이션

## 📱 반응형

### 브레이크포인트

- **모바일**: 기본 (640px 미만)
- **태블릿**: `sm:` (640px 이상)
- **데스크톱**: `lg:` (1024px 이상)

### 예시

```tsx
className = "text-4xl sm:text-6xl";
className = "px-4 sm:px-6 lg:px-8";
```

## 🎨 사용 예시

### Hero Section

```tsx
<h1 className="text-4xl font-bold text-[#00C16A] sm:text-6xl">킥-인</h1>
```

### Feature Card

```tsx
<div className="rounded-xl border border-[#27272A] bg-[#181A1F] p-6">
  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#181A1F] border border-[#27272A]">
    <Icon className="h-6 w-6 text-[#00C16A]" />
  </div>
  <h3 className="mt-4 text-xl font-semibold text-[#F4F4F5]">제목</h3>
  <p className="mt-2 text-sm text-[#A1A1AA]">설명</p>
</div>
```

## ✅ 체크리스트

디자인 적용 시 확인:

- [ ] 그라데이션 사용하지 않음
- [ ] 빛/글로우 효과 없음
- [ ] 배경 단색만 사용
- [ ] 포인트 컬러는 `#00C16A`만 사용
- [ ] 여백 충분히 확보
- [ ] 애니메이션은 미세한 scale만
- [ ] 폰트는 Pretendard/Inter 사용
