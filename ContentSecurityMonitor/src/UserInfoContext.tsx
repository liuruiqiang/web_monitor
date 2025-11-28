/**
 * UserInfoContext.tsx
 * Context for managing user information in the Content Security Monitor app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import StorageService, { UserInfo } from './StorageService';

interface UserInfoContextType {
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo) => void;
  clearUserInfo: () => void;
  isUserInfoComplete: boolean;
}

const UserInfoContext = createContext<UserInfoContextType | undefined>(undefined);

export const UserInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null);
  const [isUserInfoComplete, setIsUserInfoComplete] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const savedUserInfo = await StorageService.getUserInfo();
      setUserInfoState(savedUserInfo);
      setIsUserInfoComplete(!!savedUserInfo);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const setUserInfo = async (info: UserInfo) => {
    try {
      await StorageService.saveUserInfo(info);
      setUserInfoState(info);
      setIsUserInfoComplete(true);
    } catch (error) {
      console.error('Error saving user info:', error);
    }
  };

  const clearUserInfo = async () => {
    try {
      await StorageService.clearUserInfo();
      setUserInfoState(null);
      setIsUserInfoComplete(false);
    } catch (error) {
      console.error('Error clearing user info:', error);
    }
  };

  return (
    <UserInfoContext.Provider
      value={{
        userInfo,
        setUserInfo,
        clearUserInfo,
        isUserInfoComplete,
      }}>
      {children}
    </UserInfoContext.Provider>
  );
};

export const useUserInfo = () => {
  const context = useContext(UserInfoContext);
  if (context === undefined) {
    throw new Error('useUserInfo must be used within a UserInfoProvider');
  }
  return context;
};