// 캐릭터 직업 타입
export type JobClass =
  | '전사'
  | '대검전사'
  | '버서커'
  | '궁수'
  | '레인저'
  | '마법사'
  | '빙결사'
  | '힐러'
  | '바드'
  | '음유시인'
  | '격투가'
  | '기타';

// 컨텐츠 종류
export type ContentType = '어비스' | '레이드';

// 캐릭터 정보
export interface Character {
  id: string;
  nickname: string;
  jobs: JobClass[];
  createdAt: number;
}

// 파티 멤버 정보
export interface PartyMember {
  characterId: string;
  nickname: string;
  job: JobClass;
  joinedAt: number;
}

// 일정 (파티) 정보
export interface Schedule {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: ContentType;
  title: string; // 컨텐츠명 (예: 칼리타 어비스, 아크라스 레이드 등)
  isClosed: boolean; // 마감 여부
  leaderId: string; // 파티장 캐릭터 ID
  leaderNickname: string; // 파티장 닉네임
  members: PartyMember[]; // 멤버 목록 (최대 7명)
  maxMembers: number; // 최대 인원 (기본 8명: 파티장 포함)
  note: string; // 비고
  createdAt: number;
  updatedAt: number;
}

// 사용자 프로필 (로컬 저장)
export interface UserProfile {
  selectedCharacterId: string | null;
  characters: Character[];
}

// 컨텐츠 목록 (어비스/레이드)
export const CONTENT_LIST = {
  어비스: [
    '칼리타 어비스',
    '메나드 어비스',
    '사막 어비스',
    '설원 어비스',
    '기타 어비스',
  ],
  레이드: [
    '아크라스 레이드',
    '사막 레이드',
    '설원 레이드',
    '기타 레이드',
  ],
} as const;

// 직업 목록
export const JOB_LIST: JobClass[] = [
  '전사',
  '대검전사',
  '버서커',
  '궁수',
  '레인저',
  '마법사',
  '빙결사',
  '힐러',
  '바드',
  '음유시인',
  '격투가',
  '기타',
];
