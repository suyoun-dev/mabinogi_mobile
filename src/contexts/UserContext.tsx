import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Character, JobClass } from '../types';
import * as characterService from '../services/characterService';

interface UserContextType {
  characters: Character[];
  selectedCharacter: Character | null;
  createCharacter: (nickname: string, jobs: JobClass[]) => Character;
  updateCharacter: (id: string, updates: Partial<Pick<Character, 'nickname' | 'jobs'>>) => Character | null;
  deleteCharacter: (id: string) => boolean;
  selectCharacter: (id: string | null) => void;
  refreshCharacters: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const refreshCharacters = useCallback(() => {
    setCharacters(characterService.getCharacters());
    setSelectedCharacter(characterService.getSelectedCharacter());
  }, []);

  useEffect(() => {
    refreshCharacters();
  }, [refreshCharacters]);

  const createCharacter = useCallback((nickname: string, jobs: JobClass[]) => {
    const newChar = characterService.createCharacter(nickname, jobs);
    refreshCharacters();
    return newChar;
  }, [refreshCharacters]);

  const updateCharacter = useCallback((id: string, updates: Partial<Pick<Character, 'nickname' | 'jobs'>>) => {
    const updated = characterService.updateCharacter(id, updates);
    refreshCharacters();
    return updated;
  }, [refreshCharacters]);

  const deleteCharacter = useCallback((id: string) => {
    const result = characterService.deleteCharacter(id);
    refreshCharacters();
    return result;
  }, [refreshCharacters]);

  const selectCharacter = useCallback((id: string | null) => {
    characterService.setSelectedCharacter(id);
    refreshCharacters();
  }, [refreshCharacters]);

  return (
    <UserContext.Provider
      value={{
        characters,
        selectedCharacter,
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
