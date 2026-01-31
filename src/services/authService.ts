import {
  ref,
  push,
  set,
  get,
} from 'firebase/database';
import { database } from '../config/firebase';
import type { UserAccount } from '../types';

const USERS_REF = 'users';
const ADMIN_CODE = 'ADMIN2024'; // 관리자 코드 (실제 운영시 변경 필요)

// 랜덤 사용자 코드 생성 (6자리 영숫자)
const generateUserCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동되는 문자 제외
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// 모든 사용자 조회
export const getAllUsers = async (): Promise<UserAccount[]> => {
  try {
    const usersRef = ref(database, USERS_REF);
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      return [];
    }

    const users: UserAccount[] = [];
    snapshot.forEach((child) => {
      users.push(child.val() as UserAccount);
    });

    return users.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('getAllUsers error:', error);
    return [];
  }
};

// 코드로 사용자 조회
export const getUserByCode = async (code: string): Promise<UserAccount | null> => {
  try {
    const users = await getAllUsers();
    return users.find((u) => u.code.toUpperCase() === code.toUpperCase()) || null;
  } catch (error) {
    console.error('getUserByCode error:', error);
    return null;
  }
};

// ID로 사용자 조회
export const getUserById = async (id: string): Promise<UserAccount | null> => {
  try {
    const userRef = ref(database, `${USERS_REF}/${id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val() as UserAccount;
  } catch (error) {
    console.error('getUserById error:', error);
    return null;
  }
};

// 관리자 계정 조회
export const getAdminUser = async (): Promise<UserAccount | null> => {
  try {
    const users = await getAllUsers();
    return users.find((u) => u.role === 'admin') || null;
  } catch (error) {
    console.error('getAdminUser error:', error);
    return null;
  }
};

// 사용자 생성
export const createUser = async (
  nickname: string,
  isAdmin: boolean = false
): Promise<UserAccount> => {
  const usersRef = ref(database, USERS_REF);
  const newUserRef = push(usersRef);

  let code: string = '';
  let attempts = 0;
  const maxAttempts = 10;

  // 고유한 코드 생성
  while (attempts < maxAttempts) {
    code = generateUserCode();
    const existingUser = await getUserByCode(code);
    if (!existingUser) {
      break;
    }
    attempts++;
  }

  if (!code) {
    throw new Error('코드 생성에 실패했습니다.');
  }

  const newUser: UserAccount = {
    id: newUserRef.key!,
    code: code,
    nickname,
    role: isAdmin ? 'admin' : 'user',
    createdAt: Date.now(),
  };

  await set(newUserRef, newUser);
  return newUser;
};

// 코드로 로그인
export const loginWithCode = async (code: string): Promise<UserAccount | null> => {
  // 관리자 코드 확인
  if (code.toUpperCase() === ADMIN_CODE) {
    // 관리자 계정이 있는지 확인
    const adminUser = await getAdminUser();
    if (adminUser) {
      return adminUser;
    }
    // 없으면 관리자 계정 생성
    return await createUser('관리자', true);
  }

  return await getUserByCode(code);
};

// 사용자 삭제 (관리자용)
export const deleteUser = async (id: string): Promise<void> => {
  const userRef = ref(database, `${USERS_REF}/${id}`);
  await set(userRef, null);
};

// 로컬 스토리지에 로그인 정보 저장
const AUTH_STORAGE_KEY = 'mabinogi_auth';

export const saveAuthToLocal = (user: UserAccount): void => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

export const getAuthFromLocal = (): UserAccount | null => {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

export const clearAuthFromLocal = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

// 권한 확인
export const isAdmin = (user: UserAccount | null): boolean => {
  return user?.role === 'admin';
};

export const canEditSchedule = (
  user: UserAccount | null,
  scheduleCreatedBy: string
): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.id === scheduleCreatedBy;
};
