import {
  ref,
  push,
  set,
  get,
  update,
  remove,
  onValue,
  off,
} from 'firebase/database';
import type { DataSnapshot } from 'firebase/database';
import { database } from '../config/firebase';
import type { Schedule, PartyMember } from '../types';

const SCHEDULES_REF = 'schedules';

// 일정 생성
export const createSchedule = async (
  schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const schedulesRef = ref(database, SCHEDULES_REF);
  const newScheduleRef = push(schedulesRef);
  const now = Date.now();

  const newSchedule: Schedule = {
    ...schedule,
    id: newScheduleRef.key!,
    createdAt: now,
    updatedAt: now,
  };

  await set(newScheduleRef, newSchedule);
  return newScheduleRef.key!;
};

// 모든 일정 조회
export const getAllSchedules = async (): Promise<Schedule[]> => {
  const schedulesRef = ref(database, SCHEDULES_REF);
  const snapshot = await get(schedulesRef);

  if (!snapshot.exists()) {
    return [];
  }

  const schedules: Schedule[] = [];
  snapshot.forEach((child) => {
    schedules.push(child.val() as Schedule);
  });

  // 날짜, 시간순 정렬
  return schedules.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });
};

// 특정 일정 조회
export const getScheduleById = async (id: string): Promise<Schedule | null> => {
  const scheduleRef = ref(database, `${SCHEDULES_REF}/${id}`);
  const snapshot = await get(scheduleRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as Schedule;
};

// 일정 업데이트
export const updateSchedule = async (
  id: string,
  updates: Partial<Schedule>
): Promise<void> => {
  const scheduleRef = ref(database, `${SCHEDULES_REF}/${id}`);
  await update(scheduleRef, {
    ...updates,
    updatedAt: Date.now(),
  });
};

// 일정 삭제
export const deleteSchedule = async (id: string): Promise<void> => {
  const scheduleRef = ref(database, `${SCHEDULES_REF}/${id}`);
  await remove(scheduleRef);
};

// 파티 참여
export const joinParty = async (
  scheduleId: string,
  member: PartyMember
): Promise<boolean> => {
  const schedule = await getScheduleById(scheduleId);

  if (!schedule) {
    throw new Error('일정을 찾을 수 없습니다.');
  }

  if (schedule.isClosed) {
    throw new Error('마감된 파티입니다.');
  }

  const currentMembers = schedule.members || [];

  // 이미 참여 중인지 확인
  if (currentMembers.some((m) => m.characterId === member.characterId)) {
    throw new Error('이미 참여 중입니다.');
  }

  // 파티장 본인인지 확인
  if (schedule.leaderId === member.characterId) {
    throw new Error('파티장은 이미 참여 상태입니다.');
  }

  // 인원 확인 (파티장 포함)
  if (currentMembers.length >= schedule.maxMembers - 1) {
    throw new Error('파티 인원이 가득 찼습니다.');
  }

  const updatedMembers = [...currentMembers, member];
  await updateSchedule(scheduleId, { members: updatedMembers });

  return true;
};

// 파티 탈퇴
export const leaveParty = async (
  scheduleId: string,
  characterId: string
): Promise<boolean> => {
  const schedule = await getScheduleById(scheduleId);

  if (!schedule) {
    throw new Error('일정을 찾을 수 없습니다.');
  }

  const currentMembers = schedule.members || [];
  const updatedMembers = currentMembers.filter(
    (m) => m.characterId !== characterId
  );

  if (updatedMembers.length === currentMembers.length) {
    throw new Error('참여 중인 파티가 아닙니다.');
  }

  await updateSchedule(scheduleId, { members: updatedMembers });

  return true;
};

// 파티 마감/마감 해제
export const togglePartyClosed = async (
  scheduleId: string,
  isClosed: boolean
): Promise<void> => {
  await updateSchedule(scheduleId, { isClosed });
};

// 실시간 일정 구독
export const subscribeToSchedules = (
  callback: (schedules: Schedule[]) => void
): (() => void) => {
  const schedulesRef = ref(database, SCHEDULES_REF);

  const handleValue = (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const schedules: Schedule[] = [];
    snapshot.forEach((child) => {
      schedules.push(child.val() as Schedule);
    });

    // 날짜, 시간순 정렬
    const sorted = schedules.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    callback(sorted);
  };

  onValue(schedulesRef, handleValue);

  // 구독 해제 함수 반환
  return () => off(schedulesRef, 'value', handleValue);
};

// 내 일정만 필터링
export const getMySchedules = (
  schedules: Schedule[],
  characterId: string
): Schedule[] => {
  return schedules.filter((schedule) => {
    // 파티장인 경우
    if (schedule.leaderId === characterId) return true;
    // 멤버인 경우
    if (schedule.members?.some((m) => m.characterId === characterId))
      return true;
    return false;
  });
};

// 파티원 제거 (파티장 또는 관리자용)
export const removeMember = async (
  scheduleId: string,
  characterId: string
): Promise<boolean> => {
  const schedule = await getScheduleById(scheduleId);

  if (!schedule) {
    throw new Error('일정을 찾을 수 없습니다.');
  }

  const currentMembers = schedule.members || [];
  const updatedMembers = currentMembers.filter(
    (m) => m.characterId !== characterId
  );

  if (updatedMembers.length === currentMembers.length) {
    throw new Error('해당 멤버를 찾을 수 없습니다.');
  }

  await updateSchedule(scheduleId, { members: updatedMembers });

  return true;
};

// 지나간 일정 삭제 (관리자용)
export const deletePastSchedules = async (): Promise<number> => {
  const schedules = await getAllSchedules();
  const now = new Date();
  let deletedCount = 0;

  for (const schedule of schedules) {
    const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`);
    if (scheduleDateTime < now) {
      await deleteSchedule(schedule.id);
      deletedCount++;
    }
  }

  return deletedCount;
};

// 파티원 직접 추가 (관리자/파티장용 - 캐릭터 없이 직접 입력)
export const addMemberDirectly = async (
  scheduleId: string,
  nickname: string,
  job: string
): Promise<boolean> => {
  const schedule = await getScheduleById(scheduleId);

  if (!schedule) {
    throw new Error('일정을 찾을 수 없습니다.');
  }

  const currentMembers = schedule.members || [];

  // 인원 확인 (파티장 포함)
  if (currentMembers.length >= schedule.maxMembers - 1) {
    throw new Error('파티 인원이 가득 찼습니다.');
  }

  const newMember: PartyMember = {
    characterId: `manual_${Date.now()}`, // 수동 추가된 멤버는 고유 ID 생성
    nickname,
    job: job as PartyMember['job'],
    joinedAt: Date.now(),
  };

  const updatedMembers = [...currentMembers, newMember];
  await updateSchedule(scheduleId, { members: updatedMembers });

  return true;
};

// 파티원 직업 변경 (미정 -> 실제 직업)
export const updateMemberJob = async (
  scheduleId: string,
  characterId: string,
  newJob: string
): Promise<boolean> => {
  const schedule = await getScheduleById(scheduleId);

  if (!schedule) {
    throw new Error('일정을 찾을 수 없습니다.');
  }

  const currentMembers = schedule.members || [];
  const memberIndex = currentMembers.findIndex(
    (m) => m.characterId === characterId
  );

  if (memberIndex === -1) {
    throw new Error('해당 멤버를 찾을 수 없습니다.');
  }

  const updatedMembers = [...currentMembers];
  updatedMembers[memberIndex] = {
    ...updatedMembers[memberIndex],
    job: newJob as PartyMember['job'],
  };

  await updateSchedule(scheduleId, { members: updatedMembers });

  return true;
};

// 파티장 직업 변경
export const updateLeaderJob = async (
  scheduleId: string,
  newJob: string
): Promise<boolean> => {
  const schedule = await getScheduleById(scheduleId);

  if (!schedule) {
    throw new Error('일정을 찾을 수 없습니다.');
  }

  // leaderNickname에서 이름만 추출 (닉네임 (직업) 형식에서)
  const leaderName = schedule.leaderNickname.split(' (')[0];
  const newLeaderNickname = `${leaderName} (${newJob})`;

  await updateSchedule(scheduleId, {
    leaderJob: newJob as PartyMember['job'],
    leaderNickname: newLeaderNickname,
  });

  return true;
};

// 파티장 닉네임 변경
export const updateLeaderNickname = async (
  scheduleId: string,
  newNickname: string
): Promise<boolean> => {
  const schedule = await getScheduleById(scheduleId);

  if (!schedule) {
    throw new Error('일정을 찾을 수 없습니다.');
  }

  const leaderJob = schedule.leaderJob || '미정';
  const newLeaderNickname = `${newNickname} (${leaderJob})`;

  await updateSchedule(scheduleId, {
    leaderNickname: newLeaderNickname,
  });

  return true;
};

// 파티원 닉네임 변경
export const updateMemberNickname = async (
  scheduleId: string,
  characterId: string,
  newNickname: string
): Promise<boolean> => {
  const schedule = await getScheduleById(scheduleId);

  if (!schedule) {
    throw new Error('일정을 찾을 수 없습니다.');
  }

  const currentMembers = schedule.members || [];
  const memberIndex = currentMembers.findIndex(
    (m) => m.characterId === characterId
  );

  if (memberIndex === -1) {
    throw new Error('해당 멤버를 찾을 수 없습니다.');
  }

  const updatedMembers = [...currentMembers];
  updatedMembers[memberIndex] = {
    ...updatedMembers[memberIndex],
    nickname: newNickname,
  };

  await updateSchedule(scheduleId, { members: updatedMembers });

  return true;
};
