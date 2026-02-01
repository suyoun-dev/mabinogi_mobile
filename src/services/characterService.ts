import {
  ref,
  push,
  set,
  get,
  remove,
  update,
} from 'firebase/database';
import { database } from '../config/firebase';
import type { Character, JobClass } from '../types';

const CHARACTERS_REF = 'characters';

// 로컬 스토리지 키
const LOCAL_SELECTED_KEY = 'mabinogi_selected_character';

// 사용자의 캐릭터 목록 조회 (Firebase)
export const getCharactersByUserId = async (userId: string): Promise<Character[]> => {
  try {
    const charsRef = ref(database, `${CHARACTERS_REF}/${userId}`);
    const snapshot = await get(charsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const characters: Character[] = [];
    snapshot.forEach((child) => {
      characters.push({
        ...child.val(),
        id: child.key,
      } as Character);
    });

    return characters.sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    console.error('getCharactersByUserId error:', error);
    return [];
  }
};

// 캐릭터 생성 (Firebase)
export const createCharacterForUser = async (
  userId: string,
  nickname: string,
  jobs: JobClass[]
): Promise<Character> => {
  const charsRef = ref(database, `${CHARACTERS_REF}/${userId}`);
  const newCharRef = push(charsRef);

  const newCharacter: Character = {
    id: newCharRef.key!,
    ownerId: userId,
    nickname,
    jobs,
    createdAt: Date.now(),
  };

  await set(newCharRef, newCharacter);
  return newCharacter;
};

// 캐릭터 수정 (Firebase)
export const updateCharacterForUser = async (
  userId: string,
  characterId: string,
  updates: Partial<Pick<Character, 'nickname' | 'jobs'>>
): Promise<Character | null> => {
  try {
    const charRef = ref(database, `${CHARACTERS_REF}/${userId}/${characterId}`);
    const snapshot = await get(charRef);

    if (!snapshot.exists()) {
      return null;
    }

    const current = snapshot.val() as Character;
    const updated = { ...current, ...updates };

    await update(charRef, updates);
    return updated;
  } catch (error) {
    console.error('updateCharacterForUser error:', error);
    return null;
  }
};

// 캐릭터 삭제 (Firebase)
export const deleteCharacterForUser = async (
  userId: string,
  characterId: string
): Promise<boolean> => {
  try {
    const charRef = ref(database, `${CHARACTERS_REF}/${userId}/${characterId}`);
    await remove(charRef);
    return true;
  } catch (error) {
    console.error('deleteCharacterForUser error:', error);
    return false;
  }
};

// 특정 캐릭터 조회 (Firebase)
export const getCharacterById = async (
  userId: string,
  characterId: string
): Promise<Character | null> => {
  try {
    const charRef = ref(database, `${CHARACTERS_REF}/${userId}/${characterId}`);
    const snapshot = await get(charRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      ...snapshot.val(),
      id: snapshot.key,
    } as Character;
  } catch (error) {
    console.error('getCharacterById error:', error);
    return null;
  }
};

// 선택된 캐릭터 ID 로컬 저장/불러오기
export const setSelectedCharacterId = (characterId: string | null): void => {
  if (characterId) {
    localStorage.setItem(LOCAL_SELECTED_KEY, characterId);
  } else {
    localStorage.removeItem(LOCAL_SELECTED_KEY);
  }
};

export const getSelectedCharacterId = (): string | null => {
  return localStorage.getItem(LOCAL_SELECTED_KEY);
};

// 모든 사용자의 캐릭터 조회 (관리자용)
export const getAllCharacters = async (): Promise<Character[]> => {
  try {
    const charsRef = ref(database, CHARACTERS_REF);
    const snapshot = await get(charsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const characters: Character[] = [];
    snapshot.forEach((userChars) => {
      userChars.forEach((charSnapshot) => {
        characters.push({
          ...charSnapshot.val(),
          id: charSnapshot.key,
        } as Character);
      });
    });

    return characters;
  } catch (error) {
    console.error('getAllCharacters error:', error);
    return [];
  }
};

// ============================================
// 하위 호환성을 위한 레거시 함수들 (로컬 스토리지)
// ============================================

const STORAGE_KEY = 'mabinogi_user_profile';

interface UserProfile {
  selectedCharacterId: string | null;
  characters: Character[];
}

// 로컬 스토리지에서 프로필 가져오기
export const getUserProfile = (): UserProfile => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { selectedCharacterId: null, characters: [] };
    }
  }
  return { selectedCharacterId: null, characters: [] };
};

// 프로필 저장
const saveUserProfile = (profile: UserProfile): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
};

// 레거시: 캐릭터 생성
export const createCharacter = (
  nickname: string,
  jobs: JobClass[]
): Character => {
  const profile = getUserProfile();

  const newCharacter: Character = {
    id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nickname,
    jobs,
    createdAt: Date.now(),
  };

  profile.characters.push(newCharacter);

  // 첫 번째 캐릭터면 자동 선택
  if (profile.characters.length === 1) {
    profile.selectedCharacterId = newCharacter.id;
  }

  saveUserProfile(profile);
  return newCharacter;
};

// 레거시: 캐릭터 수정
export const updateCharacter = (
  id: string,
  updates: Partial<Pick<Character, 'nickname' | 'jobs'>>
): Character | null => {
  const profile = getUserProfile();
  const index = profile.characters.findIndex((c) => c.id === id);

  if (index === -1) return null;

  profile.characters[index] = {
    ...profile.characters[index],
    ...updates,
  };

  saveUserProfile(profile);
  return profile.characters[index];
};

// 레거시: 캐릭터 삭제
export const deleteCharacter = (id: string): boolean => {
  const profile = getUserProfile();
  const initialLength = profile.characters.length;
  profile.characters = profile.characters.filter((c) => c.id !== id);

  if (profile.characters.length === initialLength) return false;

  // 삭제된 캐릭터가 선택된 캐릭터였다면 초기화
  if (profile.selectedCharacterId === id) {
    profile.selectedCharacterId =
      profile.characters.length > 0 ? profile.characters[0].id : null;
  }

  saveUserProfile(profile);
  return true;
};

// 레거시: 캐릭터 목록 조회
export const getCharacters = (): Character[] => {
  return getUserProfile().characters;
};

// 레거시: 선택된 캐릭터 설정
export const setSelectedCharacter = (id: string | null): void => {
  const profile = getUserProfile();
  profile.selectedCharacterId = id;
  saveUserProfile(profile);
};

// 레거시: 선택된 캐릭터 가져오기
export const getSelectedCharacter = (): Character | null => {
  const profile = getUserProfile();
  if (!profile.selectedCharacterId) return null;
  return (
    profile.characters.find((c) => c.id === profile.selectedCharacterId) || null
  );
};
