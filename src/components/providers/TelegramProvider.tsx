'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, TelegramUser } from '@/lib/types';

interface TelegramContextType {
  user: User | null;
  tgUser: TelegramUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;
  showOnboarding: boolean;
  stats: {
    todayChecked: number;
    totalChecked: number;
    classCount: number;
    studentCount: number;
  };
  setShowOnboarding: (show: boolean) => void;
  refreshUser: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
}

const TelegramContext = createContext<TelegramContextType>({
  user: null,
  tgUser: null,
  isLoading: true,
  isAuthenticated: false,
  isNewUser: false,
  showOnboarding: false,
  stats: { todayChecked: 0, totalChecked: 0, classCount: 0, studentCount: 0 },
  setShowOnboarding: () => {},
  refreshUser: async () => {},
  updateUser: () => {},
});

export const useTelegram = () => useContext(TelegramContext);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stats, setStats] = useState({
    todayChecked: 0,
    totalChecked: 0,
    classCount: 0,
    studentCount: 0,
  });

  const authenticate = async () => {
    try {
      setIsLoading(true);

      // Check if running inside Telegram WebApp
      let initData = '';
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        tg.expand();

        initData = tg.initData || '';
        if (tg.initDataUnsafe?.user) {
          setTgUser(tg.initDataUnsafe.user);
        }
      }

      // If empty and dev mode enabled, provide mock initData
      if (!initData) {
        initData = 'dev_mode=' + encodeURIComponent(JSON.stringify({
          user: {
            id: 99999999,
            first_name: "Aziza",
            last_name: "Karimova",
            username: "aziza_teacher",
          },
        }));
      }

      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setUser(data.user);
        setIsNewUser(Boolean(data.isNewUser));
        if (data.isNewUser || !data.user.subject) {
          setShowOnboarding(true);
        }
        await fetchStats();
      } else {
        console.warn('Telegram auth failed:', data.error);
      }
    } catch (err) {
      console.error('Error during Telegram auth initialization:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUser(data.user);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching user profile/stats:', err);
    }
  };

  useEffect(() => {
    authenticate();
  }, []);

  const updateUser = (updated: User) => {
    setUser(updated);
    if (updated.subject) {
      setShowOnboarding(false);
      setIsNewUser(false);
    }
  };

  return (
    <TelegramContext.Provider
      value={{
        user,
        tgUser,
        isLoading,
        isAuthenticated: Boolean(user),
        isNewUser,
        showOnboarding,
        stats,
        setShowOnboarding,
        refreshUser: fetchStats,
        updateUser,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}
