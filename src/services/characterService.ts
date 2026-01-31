import type { Character, UserProfile, JobClass } from '../types';

const STORAGE_KEY = 'mabinogi_user_profile';

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

// 캐릭터 생성
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

// 캐릭터 수정
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

// 캐릭터 삭제
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

// 캐릭터 목록 조회
export const getCharacters = (): Character[] => {
  return getUserProfile().characters;
};

// 특정 캐릭터 조회
export const getCharacterById = (id: string): Character | null => {
  const profile = getUserProfile();
  return profile.characters.find((c) => c.id === id) || null;
};

// 선택된 캐릭터 설정
export const setSelectedCharacter = (id: string | null): void => {
  const profile = getUserProfile();
  profile.selectedCharacterId = id;
  saveUserProfile(profile);
};

// 선택된 캐릭터 가져오기
export const getSelectedCharacter = (): Character | null => {
  const profile = getUserProfile();
  if (!profile.selectedCharacterId) return null;
  return (
    profile.characters.find((c) => c.id === profile.selectedCharacterId) || null
  );
};
