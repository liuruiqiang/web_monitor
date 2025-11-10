/**
 * History Context - Global state management for warning history
 */

import React, {createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HistoryContext = createContext();

export const HistoryProvider = ({children}) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const historyJson = await AsyncStorage.getItem('warningHistory');
      if (historyJson) {
        const parsedHistory = JSON.parse(historyJson);
        setHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addWarning = async (warning) => {
    try {
      const newWarning = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...warning,
      };

      const newHistory = [newWarning, ...history];

      // Keep only last 100 records
      if (newHistory.length > 100) {
        newHistory.splice(100);
      }

      await AsyncStorage.setItem('warningHistory', JSON.stringify(newHistory));
      setHistory(newHistory);
      return true;
    } catch (error) {
      console.error('Failed to add warning:', error);
      return false;
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('warningHistory');
      setHistory([]);
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  };

  const deleteWarning = async (id) => {
    try {
      const newHistory = history.filter(item => item.id !== id);
      await AsyncStorage.setItem('warningHistory', JSON.stringify(newHistory));
      setHistory(newHistory);
      return true;
    } catch (error) {
      console.error('Failed to delete warning:', error);
      return false;
    }
  };

  const value = {
    history,
    isLoading,
    addWarning,
    clearHistory,
    deleteWarning,
    loadHistory,
  };

  return (
    <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within HistoryProvider');
  }
  return context;
};
