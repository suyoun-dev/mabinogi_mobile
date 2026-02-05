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
  | '암흑술사'
  | '미정';

// 컨텐츠 종류
export type ContentType = '어비스' | '레이드';

// 컨텐츠 난이도
export type DifficultyType = '입문' | '어려움' | '매우 어려움' | '지옥';

// 사용자 역할
export type UserRole = 'admin' | 'user';

// 사용자 계정 정보
export interface UserAccount {
  id: string;
  code: string; // 사용자 고유 코드 (로그인용)
  nickname: string;
  role: UserRole;
  createdAt: number;
}

// 캐릭터 정보
export interface Character {
  id: string;
  ownerId?: string; // 소유자 사용자 ID
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
  contentName: string; // 상세 컨텐츠명 (바리 어비스, 글라스기브넨 등)
  difficulty: DifficultyType; // 난이도
  title: string; // 일정 제목
  isClosed: boolean; // 마감 여부
  leaderId: string; // 파티장 캐릭터 ID
  leaderNickname: string; // 파티장 닉네임
  leaderJob?: JobClass; // 파티장 직업 (별도 저장)
  members: PartyMember[]; // 멤버 목록
  maxMembers: number; // 최대 인원
  note: string; // 비고
  createdBy: string; // 생성자 사용자 ID
  createdAt: number;
  updatedAt: number;
}

// 이벤트 정보
export interface GameEvent {
  id: string;
  name: string; // 이벤트 이름
  endDate: string; // YYYY-MM-DD 종료일
  endTime: string; // HH:mm 종료 시간
  createdAt: number;
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

// 직업 목록 (미정 포함 - 파티 신청용)
export const JOB_LIST_WITH_UNDECIDED: JobClass[] = [
  ...JOB_LIST,
  '미정',
];

// 난이도 목록
export const DIFFICULTY_LIST: DifficultyType[] = [
  '입문',
  '어려움',
  '매우 어려움',
  '지옥',
];

// 컨텐츠 상세 목록
export const CONTENT_LIST: Record<ContentType, string[]> = {
  어비스: ['바리 어비스'],
  레이드: ['글라스기브넨', '화이트 서큐버스', '에이렐', '타바르타스'],
};
