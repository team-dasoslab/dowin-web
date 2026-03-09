"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// Types based on docs/dev/2026.03.09-database-schema.md
export type LeadMeasureLog = {
  id: string;
  logDate: string;
  value: boolean;
};

export type LeadMeasure = {
  id: string;
  name: string;
  targetValue: number;
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
  archivedAt: string | null;
  logs: LeadMeasureLog[];
};

export type Scoreboard = {
  id: string;
  goalName: string;
  lagMeasure: string;
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "ARCHIVED";
  leadMeasures: LeadMeasure[];
};

export type User = {
  id: string;
  nickname: string;
  customId: string;
};

interface MockDataContextType {
  user: User | null;
  scoreboard: Scoreboard | null;
  login: (id: string, pw: string) => Promise<boolean>;
  logout: () => void;
  updateLog: (measureId: string, date: string, value: boolean) => void;
  updateProfile: (nickname: string) => void;
  // Management Features
  createScoreboard: (goalName: string, lagMeasure: string) => void;
  updateScoreboard: (goalName: string, lagMeasure: string) => void;
  deleteScoreboard: () => void;
  archiveScoreboard: () => void;
  addLeadMeasure: (
    name: string,
    targetValue: number,
    period: "DAILY" | "WEEKLY" | "MONTHLY",
  ) => void;
  deleteLeadMeasure: (id: string) => void;
  archiveLeadMeasure: (id: string) => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(
  undefined,
);

const MOCK_USER: User = {
  id: "user_01",
  nickname: "도전자",
  customId: "challenger",
};

const MOCK_SCOREBOARD: Scoreboard = {
  id: "sb_01",
  goalName: "체중을 감량한다",
  lagMeasure: "80kg에서 75kg까지 달성",
  startDate: "2024-03-01",
  endDate: null,
  status: "ACTIVE",
  leadMeasures: [
    {
      id: "lm_01",
      name: "매일 물 2L 마시기",
      targetValue: 7,
      period: "DAILY",
      status: "ACTIVE",
      createdAt: "2024-03-01T00:00:00Z",
      archivedAt: null,
      logs: [
        { id: "log_01", logDate: "2024-03-09", value: true },
        { id: "log_02", logDate: "2024-03-10", value: false },
      ],
    },
    {
      id: "lm_02",
      name: "주 3회 30분 유산소",
      targetValue: 3,
      period: "WEEKLY",
      status: "ACTIVE",
      createdAt: "2024-03-01T00:00:00Z",
      archivedAt: null,
      logs: [{ id: "log_03", logDate: "2024-03-09", value: true }],
    },
  ],
};

export const MockDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);

  // Persistence for prototype
  useEffect(() => {
    const savedUser = localStorage.getItem("wig_user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = async (id: string, pw: string) => {
    // Simple mock logic
    if (id === "admin" && pw === "1234") {
      setUser(MOCK_USER);
      localStorage.setItem("wig_user", JSON.stringify(MOCK_USER));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("wig_user");
  };

  const updateLog = (measureId: string, date: string, value: boolean) => {
    if (!scoreboard) return;

    setScoreboard((prev) => {
      if (!prev) return null;
      const updatedMeasures = prev.leadMeasures.map((lm) => {
        if (lm.id === measureId) {
          const existingLogIndex = lm.logs.findIndex((l) => l.logDate === date);
          const newLogs = [...lm.logs];
          if (existingLogIndex >= 0) {
            newLogs[existingLogIndex].value = value;
          } else {
            newLogs.push({ id: `log_${Date.now()}`, logDate: date, value });
          }
          return { ...lm, logs: newLogs };
        }
        return lm;
      });
      return { ...prev, leadMeasures: updatedMeasures };
    });
  };

  const updateProfile = (nickname: string) => {
    if (!user) return;
    const updatedUser = { ...user, nickname };
    setUser(updatedUser);
    localStorage.setItem("wig_user", JSON.stringify(updatedUser));
  };

  const createScoreboard = (goalName: string, lagMeasure: string) => {
    const newScoreboard: Scoreboard = {
      id: `sb_${Date.now()}`,
      goalName,
      lagMeasure,
      startDate: new Date().toISOString().split("T")[0],
      endDate: null,
      status: "ACTIVE",
      leadMeasures: [],
    };
    setScoreboard(newScoreboard);
  };

  const updateScoreboard = (goalName: string, lagMeasure: string) => {
    setScoreboard((prev) => (prev ? { ...prev, goalName, lagMeasure } : null));
  };

  const archiveScoreboard = () => {
    setScoreboard(null); // In mock, we just reset it to allow new creation
  };

  const deleteScoreboard = () => {
    setScoreboard(null);
  };

  const addLeadMeasure = (
    name: string,
    targetValue: number,
    period: "DAILY" | "WEEKLY" | "MONTHLY" = "DAILY",
  ) => {
    if (!scoreboard) return;
    const newMeasure: LeadMeasure = {
      id: `lm_${Date.now()}`,
      name,
      targetValue,
      period,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      archivedAt: null,
      logs: [],
    };
    setScoreboard((prev) =>
      prev
        ? { ...prev, leadMeasures: [...prev.leadMeasures, newMeasure] }
        : null,
    );
  };

  const deleteLeadMeasure = (id: string) => {
    setScoreboard((prev) =>
      prev
        ? {
            ...prev,
            leadMeasures: prev.leadMeasures.filter((lm) => lm.id !== id),
          }
        : null,
    );
  };

  const archiveLeadMeasure = (id: string) => {
    setScoreboard((prev) =>
      prev
        ? {
            ...prev,
            leadMeasures: prev.leadMeasures.map((lm) =>
              lm.id === id
                ? {
                    ...lm,
                    status: "ARCHIVED",
                    archivedAt: new Date().toISOString(),
                  }
                : lm,
            ),
          }
        : null,
    );
  };

  return (
    <MockDataContext.Provider
      value={{
        user,
        scoreboard,
        login,
        logout,
        updateLog,
        updateProfile,
        createScoreboard,
        updateScoreboard,
        deleteScoreboard,
        archiveScoreboard,
        addLeadMeasure,
        deleteLeadMeasure,
        archiveLeadMeasure,
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
};

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error("useMockData must be used within a MockDataProvider");
  }
  return context;
};
