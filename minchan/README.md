# Calendar Scheduler

간단한 근무 스케줄러 React 앱입니다. 최대 5명의 사용자가 주말 하이라이트 달력에서 날짜를 선택하고, 규칙에 따라 공정하게 근무일을 산출합니다.

## 실행 방법

1) Node 버전 동기화

```bash
nvm use
```

2) 패키지 설치 (원하시는 패키지 매니저로 설치하세요)

```bash
# npm
npm i
# or pnpm
pnpm i
# or yarn
yarn
```

3) 개발 서버 실행

```bash
npm run dev
```

## 기술 스택
- React + TypeScript + Vite
- TanStack Query (Provider만 구성, 추후 API 연동 대비)
- Zod (로컬 스토리지 데이터 검증)
- date-fns (날짜 처리)

## 기능 개요
- 최대 5명 사용자
- 주말 하이라이트 및 상호작용 가능한 달력
- 사용자별 날짜 다중 선택(최소 2개 이상)
- 로컬 스토리지에 선택값 저장
- 스케줄링 알고리즘:
  - 선호도(참여자 수) 높은 날짜 우선 배정
  - 모든 사용자가 2회 참가하도록 보장
  - 선호일에 참여 못한 사용자의 추가 배정을 최소화


