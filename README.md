# 마비노기M 일정 관리

마비노기 모바일 게임의 어비스/레이드 일정을 관리하는 웹 앱입니다.

## 기능

- **캐릭터 등록**: 닉네임과 직업(복수 선택 가능)을 등록
- **일정 등록**: 어비스/레이드 파티 일정 생성
- **참여 신청/취소**: 파티에 참여하거나 탈퇴
- **일정 조회**: 전체 일정 또는 내 일정만 필터링
- **파티 현황**: 각 파티의 참여자 현황 확인
- **실시간 동기화**: Firebase를 통한 실시간 데이터 동기화

## 기술 스택

- React + TypeScript
- Vite
- Firebase Realtime Database
- React Router

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 배포

Firebase Hosting 또는 다른 정적 호스팅 서비스에 `dist` 폴더를 배포하세요.
