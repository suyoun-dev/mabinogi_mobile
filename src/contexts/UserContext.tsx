import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Character, JobClass } from '../types';
import * as characterService from '../services/characterService';
import { useAuth } from './AuthContext';

interface UserContextType {
  characters: Character[];
  selectedCharacter: Character | null;
  loading: boolean;
  createCharacter: (nickname: string, jobs: JobClass[]) => Promise<Character>;
  updateCharacter: (id: string, updates: Partial<Pick<Character, 'nickname' | 'jobs'>>) => Promise<Character | null>;
  deleteCharacter: (id: string) => Promise<boolean>;
  selectCharacter: (id: string | null) => void;
  refreshCharacters: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCharacters = useCallback(async () => {
    if (!user) {
      setCharacters([]);
      setSelectedCharacter(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const chars = await characterService.getCharactersByUserId(user.id);
      setCharacters(chars);

      // 선택된 캐릭터 복원
      const selectedId = characterService.getSelectedCharacterId();
      if (selectedId) {
        const selected = chars.find(c => c.id === selectedId);
        setSelectedCharacter(selected || (chars.length > 0 ? chars[0] : null));
      } else if (chars.length > 0) {
        setSelectedCharacter(chars[0]);
        characterService.setSelectedCharacterId(chars[0].id);
      } else {
        setSelectedCharacter(null);
      }
    } catch (error) {
      console.error('Failed to load characters:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCharacters();
  }, [refreshCharacters]);

  const createCharacter = useCallback(async (nickname: string, jobs: JobClass[]) => {
    if (!user) throw new Error('로그인이 필요합니다.');

    const newChar = await characterService.createCharacterForUser(user.id, nickname, jobs);

    // 첫 번째 캐릭터면 자동 선택
    setCharacters(prev => [...prev, newChar]);
    if (characters.length === 0) {
      setSelectedCharacter(newChar);
      characterService.setSelectedCharacterId(newChar.id);
    }

    return newChar;
  }, [user, characters.length]);

  const updateCharacter = useCallback(async (id: string, updates: Partial<Pick<Character, 'nickname' | 'jobs'>>) => {
    if (!user) throw new Error('로그인이 필요합니다.');

    const updated = await characterService.updateCharacterForUser(user.id, id, updates);
    if (updated) {
      setCharacters(prev => prev.map(c => c.id === id ? updated : c));
      if (selectedCharacter?.id === id) {
        setSelectedCharacter(updated);
      }
    }
    return updated;
  }, [user, selectedCharacter]);

  const deleteCharacter = useCallback(async (id: string) => {
    if (!user) throw new Error('로그인이 필요합니다.');

    const result = await characterService.deleteCharacterForUser(user.id, id);
    if (result) {
      setCharacters(prev => {
        const newChars = prev.filter(c => c.id !== id);

        // 삭제된 캐릭터가 선택된 캐릭터였다면 다른 캐릭터 선택
        if (selectedCharacter?.id === id) {
          const newSelected = newChars.length > 0 ? newChars[0] : null;
          setSelectedCharacter(newSelected);
          characterService.setSelectedCharacterId(newSelected?.id || null);
        }

        return newChars;
      });
    }
    return result;
  }, [user, selectedCharacter]);

  const selectCharacter = useCallback((id: string | null) => {
    if (id === null) {
      setSelectedCharacter(null);
      characterService.setSelectedCharacterId(null);
    } else {
      const char = characters.find(c => c.id === id);
      if (char) {
        setSelectedCharacter(char);
        characterService.setSelectedCharacterId(id);
      }
    }
  }, [characters]);

  return (
    <UserContext.Provider
      value={{
        characters,
        selectedCharacter,
        loading,
        createCharacter,
        updateCharacter,
        deleteCharacter,
        selectCharacter,
        refreshCharacters,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
