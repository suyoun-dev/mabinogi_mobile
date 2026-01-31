// 캐릭터 직업 타입
export type JobClass =
  | '전사'
  | '검술사'
  | '대검전사'
  | '궁수'
  | '석궁사수'
  | '장궁병'
  | '마법사'
  | '화염술사'
  | '빙결술사'
  | '전격술사'
  | '도적'
  | '듀얼블레이드'
  | '격투가'
  | '음유시인'
  | '악사'
  | '댄서'
  | '힐러'
  | '사제'
  | '수도사'
  | '암흑술사';

// 컨텐츠 종류
export type ContentType = '어비스' | '레이드';

// 컨텐츠 난이도
export type DifficultyType = '입문' | '어려움' | '매우 어려움' | '지옥';

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
  difficulty: DifficultyType; // 난이도
  title: string; // 컨텐츠명
  isClosed: boolean; // 마감 여부
  leaderId: string; // 파티장 캐릭터 ID
  leaderNickname: string; // 파티장 닉네임
  members: PartyMember[]; // 멤버 목록
  maxMembers: number; // 최대 인원
  note: string; // 비고
  createdAt: number;
  updatedAt: number;
}

// 사용자 프로필 (로컬 저장)
export interface UserProfile {
  selectedCharacterId: string | null;
  characters: Character[];
}

// 직업 목록
export const JOB_LIST: JobClass[] = [
  '전사',
  '검술사',
  '대검전사',
  '궁수',
  '석궁사수',
  '장궁병',
  '마법사',
  '화염술사',
  '빙결술사',
  '전격술사',
  '도적',
  '듀얼블레이드',
  '격투가',
  '음유시인',
  '악사',
  '댄서',
  '힐러',
  '사제',
  '수도사',
  '암흑술사',
];

// 난이도 목록
export const DIFFICULTY_LIST: DifficultyType[] = [
  '입문',
  '어려움',
  '매우 어려움',
  '지옥',
];
