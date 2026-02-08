import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserAccount } from '../types';
import * as authService from '../services/authService';

interface AuthContextType {
  user: UserAccount | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  loading: boolean;
  login: (code: string) => Promise<UserAccount | null>;
  loginAsGuest: () => void;
  logout: () => void;
  register: (nickname: string) => Promise<UserAccount>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  // 초기 로드 시 로컬 저장소에서 인증 정보 확인
  useEffect(() => {
    const storedUser = authService.getAuthFromLocal();
    if (storedUser) {
      // 게스트는 서버 확인 불필요
      if (storedUser.role === 'guest') {
        setUser(storedUser);
        setLoading(false);
        return;
      }
      // 서버에서 최신 정보 확인
      authService.getUserById(storedUser.id).then((serverUser) => {
        if (serverUser) {
          setUser(serverUser);
          authService.saveAuthToLocal(serverUser);
        } else {
          // 서버에 없으면 로컬 삭제
          authService.clearAuthFromLocal();
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (code: string): Promise<UserAccount | null> => {
    const loggedInUser = await authService.loginWithCode(code);
    if (loggedInUser) {
      setUser(loggedInUser);
      authService.saveAuthToLocal(loggedInUser);
    }
    return loggedInUser;
  }, []);

  const loginAsGuest = useCallback(() => {
    const guestUser = authService.createGuestUser();
    setUser(guestUser);
    authService.saveAuthToLocal(guestUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    authService.clearAuthFromLocal();
  }, []);

  const register = useCallback(async (nickname: string): Promise<UserAccount> => {
    const newUser = await authService.createUser(nickname, false);
    setUser(newUser);
    authService.saveAuthToLocal(newUser);
    return newUser;
  }, []);

  const refreshUser = useCallback(async () => {
    if (user) {
      const updatedUser = await authService.getUserById(user.id);
      if (updatedUser) {
        setUser(updatedUser);
        authService.saveAuthToLocal(updatedUser);
      }
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin: authService.isAdmin(user),
        isGuest: authService.isGuest(user),
        loading,
        login,
        loginAsGuest,
        logout,
        register,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
