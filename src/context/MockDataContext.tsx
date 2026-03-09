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

export type MeasureInput = {
  name: string;
  period: "WEEKLY" | "MONTHLY";
  targetValue: number;
};

export type Scoreboard = {
  id: string;
  userId: string; // Added userId to link scoreboard to a user
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
  allScoreboards: Scoreboard[]; // Added to expose all scoreboards
  mockUsers: User[]; // Added to expose mock users for display purposes
  workspaceName: string; // Add workspaceName to the context type
  login: (id: string, pw: string) => Promise<boolean>;
  logout: () => void;
  updateLog: (measureId: string, date: string, value: boolean) => void;
  updateProfile: (nickname: string) => void;
  // Management Features
  createScoreboard: (
    goalName: string,
    lagMeasure: string,
    leadMeasures: MeasureInput[],
  ) => void;
  updateScoreboard: (
    goalName: string,
    lagMeasure: string,
    leadMeasures: MeasureInput[],
  ) => void;
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

const MOCK_USERS: User[] = [
  {
    id: "user_01",
    nickname: "도전자",
    customId: "admin", // Changed customId for 'admin' user
  },
  {
    id: "user_02",
    nickname: "열정맨",
    customId: "passion-man",
  },
  {
    id: "user_03",
    nickname: "성장러",
    customId: "growther",
  },
];

const MOCK_ALL_SCOREBOARDS: Scoreboard[] = [
  {
    id: "sb_01",
    userId: "user_01",
    goalName: "체중을 감량한다",
    lagMeasure: "80kg에서 75kg까지 달성",
    startDate: "2024-03-01",
    endDate: null,
    status: "ACTIVE",
    leadMeasures: [
      {
        id: "lm_01_u1",
        name: "매일 물 2L 마시기",
        targetValue: 7,
        period: "DAILY",
        status: "ACTIVE",
        createdAt: "2024-03-01T00:00:00Z",
        archivedAt: null,
        logs: [
          { id: "log_01_u1_d1", logDate: "2024-03-03", value: true },
          { id: "log_02_u1_d2", logDate: "2024-03-04", value: true },
          { id: "log_03_u1_d3", logDate: "2024-03-05", value: false },
          { id: "log_04_u1_d4", logDate: "2024-03-06", value: true },
          { id: "log_05_u1_d5", logDate: "2024-03-07", value: true },
          { id: "log_06_u1_d6", logDate: "2024-03-08", value: true },
          { id: "log_07_u1_d7", logDate: "2024-03-09", value: false },
        ],
      },
      {
        id: "lm_02_u1",
        name: "주 3회 30분 유산소",
        targetValue: 3,
        period: "WEEKLY",
        status: "ACTIVE",
        createdAt: "2024-03-01T00:00:00Z",
        archivedAt: null,
        logs: [
          { id: "log_08_u1_d1", logDate: "2024-03-02", value: true },
          { id: "log_09_u1_d2", logDate: "2024-03-05", value: true },
          { id: "log_10_u1_d3", logDate: "2024-03-08", value: true },
        ],
      },
    ],
  },
  {
    id: "sb_02",
    userId: "user_02",
    goalName: "새로운 기술 학습",
    lagMeasure: "0개에서 2개의 신기술 완벽 이해",
    startDate: "2024-03-01",
    endDate: null,
    status: "ACTIVE",
    leadMeasures: [
      {
        id: "lm_01_u2",
        name: "매일 1시간 코딩",
        targetValue: 5,
        period: "WEEKLY",
        status: "ACTIVE",
        createdAt: "2024-03-01T00:00:00Z",
        archivedAt: null,
        logs: [
          { id: "log_01_u2_d1", logDate: "2024-03-03", value: true },
          { id: "log_02_u2_d2", logDate: "2024-03-04", value: false },
          { id: "log_03_u2_d3", logDate: "2024-03-05", value: true },
          { id: "log_04_u2_d4", logDate: "2024-03-06", value: true },
          { id: "log_05_u2_d5", logDate: "2024-03-07", value: false },
        ],
      },
      {
        id: "lm_02_u2",
        name: "주 2회 기술 블로그 읽기",
        targetValue: 2,
        period: "WEEKLY",
        status: "ACTIVE",
        createdAt: "2024-03-01T00:00:00Z",
        archivedAt: null,
        logs: [
          { id: "log_06_u2_d1", logDate: "2024-03-04", value: true },
          { id: "log_07_u2_d2", logDate: "2024-03-07", value: true },
        ],
      },
    ],
  },
  {
    id: "sb_03",
    userId: "user_03",
    goalName: "업무 효율성 증대",
    lagMeasure: "일일 보고서 작성 시간 30분 단축",
    startDate: "2024-03-01",
    endDate: null,
    status: "ACTIVE",
    leadMeasures: [
      {
        id: "lm_01_u3",
        name: "매일 아침 10분 계획 세우기",
        targetValue: 5,
        period: "WEEKLY",
        status: "ACTIVE",
        createdAt: "2024-03-01T00:00:00Z",
        archivedAt: null,
        logs: [
          { id: "log_01_u3_d1", logDate: "2024-03-03", value: true },
          { id: "log_02_u3_d2", logDate: "2024-03-04", value: true },
          { id: "log_03_u3_d3", logDate: "2024-03-05", value: true },
          { id: "log_04_u3_d4", logDate: "2024-03-06", value: true },
          { id: "log_05_u3_d5", logDate: "2024-03-07", value: true },
        ],
      },
    ],
  },
];

export const MockDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);
  const [allScoreboards, setAllScoreboards] = useState<Scoreboard[]>([]); // New state for all scoreboards
  const workspaceName = "도토리 독서도임"; // Hardcoded workspace name for the prototype

  // Persistence for prototype
  useEffect(() => {
    const savedUser = localStorage.getItem("wig_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Load all scoreboards and filter the active one for the user
      const userScoreboard = MOCK_ALL_SCOREBOARDS.find(
        (sb) => sb.userId === parsedUser.id && sb.status === "ACTIVE",
      );
      setScoreboard(userScoreboard || null);
    }
    // Initialize all scoreboards
    setAllScoreboards(MOCK_ALL_SCOREBOARDS);
  }, []);

  const login = async (id: string, pw: string) => {
    // Simple mock logic for 'admin'
    if (id === "admin" && pw === "1234") {
      // Assuming 'admin' is the customId for the first user
      const loggedInUser = MOCK_USERS.find((u) => u.customId === id);
      if (loggedInUser) {
        setUser(loggedInUser);
        localStorage.setItem("wig_user", JSON.stringify(loggedInUser));
        // Find the active scoreboard for the logged-in user
        const userScoreboard = MOCK_ALL_SCOREBOARDS.find(
          (sb) => sb.userId === loggedInUser.id && sb.status === "ACTIVE",
        );
        setScoreboard(userScoreboard || null);
        setAllScoreboards(MOCK_ALL_SCOREBOARDS); // Ensure all scoreboards are loaded
        return true;
      }
    }
    // For other mock users, assuming they can't login via the 'admin' path
    // In a real app, this would be more robust
    return false;
  };

  const logout = () => {
    setUser(null);
    setScoreboard(null); // Also clear scoreboard on logout
    localStorage.removeItem("wig_user");
    setAllScoreboards(MOCK_ALL_SCOREBOARDS); // Reset all scoreboards to initial mock state
  };

  const updateLog = (measureId: string, date: string, value: boolean) => {
    if (!scoreboard || !user) return;

    setAllScoreboards((prevAll) =>
      prevAll.map((sb) => {
        if (sb.id === scoreboard.id) {
          const updatedMeasures = sb.leadMeasures.map((lm) => {
            if (lm.id === measureId) {
              const existingLogIndex = lm.logs.findIndex(
                (l) => l.logDate === date,
              );
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
          return { ...sb, leadMeasures: updatedMeasures };
        }
        return sb;
      }),
    );

    // Also update the current user's scoreboard state
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

  const createScoreboard = (
    goalName: string,
    lagMeasure: string,
    leadMeasures: MeasureInput[],
  ) => {
    if (!user) return; // Must be logged in to create a scoreboard

    const newLeadMeasures: LeadMeasure[] = leadMeasures.map((m, i) => ({
      id: `lm_${Date.now()}_${i}_${user.id}`,
      name: m.name,
      targetValue: m.targetValue,
      period: m.period,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      archivedAt: null,
      logs: [],
    }));

    const newScoreboard: Scoreboard = {
      id: `sb_${Date.now()}_${user.id}`,
      userId: user.id, // Assign to current user
      goalName,
      lagMeasure,
      startDate: new Date().toISOString().split("T")[0],
      endDate: null,
      status: "ACTIVE",
      leadMeasures: newLeadMeasures,
    };

    setAllScoreboards((prevAll) => [...prevAll, newScoreboard]);
    setScoreboard(newScoreboard); // Set it as the current active scoreboard
  };

  const updateScoreboard = (
    goalName: string,
    lagMeasure: string,
    leadMeasures: MeasureInput[],
  ) => {
    if (!scoreboard || !user) return;

    const newLeadMeasures: LeadMeasure[] = leadMeasures.map((m, i) => ({
      id: `lm_${Date.now()}_${i}_${user.id}`, // In a real app, you'd preserve IDs
      name: m.name,
      targetValue: m.targetValue,
      period: m.period,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      archivedAt: null,
      logs: [],
    }));

    setAllScoreboards((prevAll) =>
      prevAll.map((sb) =>
        sb.id === scoreboard.id
          ? { ...sb, goalName, lagMeasure, leadMeasures: newLeadMeasures }
          : sb,
      ),
    );

    setScoreboard((prev) =>
      prev
        ? { ...prev, goalName, lagMeasure, leadMeasures: newLeadMeasures }
        : null,
    );
  };

  const archiveScoreboard = () => {
    if (!scoreboard || !user) return;

    setAllScoreboards((prevAll) =>
      prevAll.map((sb) =>
        sb.id === scoreboard.id
          ? { ...sb, status: "ARCHIVED", endDate: new Date().toISOString() }
          : sb,
      ),
    );
    setScoreboard(null);
  };

  const deleteScoreboard = () => {
    if (!scoreboard || !user) return;

    setAllScoreboards((prevAll) =>
      prevAll.filter((sb) => sb.id !== scoreboard.id),
    );
    setScoreboard(null);
  };

  const addLeadMeasure = (
    name: string,
    targetValue: number,
    period: "DAILY" | "WEEKLY" | "MONTHLY" = "DAILY",
  ) => {
    if (!scoreboard || !user) return;

    const newMeasure: LeadMeasure = {
      id: `lm_${Date.now()}_${user.id}`,
      name,
      targetValue,
      period,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      archivedAt: null,
      logs: [],
    };

    setAllScoreboards((prevAll) =>
      prevAll.map((sb) =>
        sb.id === scoreboard.id
          ? { ...sb, leadMeasures: [...sb.leadMeasures, newMeasure] }
          : sb,
      ),
    );

    setScoreboard((prev) =>
      prev
        ? { ...prev, leadMeasures: [...prev.leadMeasures, newMeasure] }
        : null,
    );
  };

  const deleteLeadMeasure = (id: string) => {
    if (!scoreboard || !user) return;

    setAllScoreboards((prevAll) =>
      prevAll.map((sb) =>
        sb.id === scoreboard.id
          ? {
              ...sb,
              leadMeasures: sb.leadMeasures.filter((lm) => lm.id !== id),
            }
          : sb,
      ),
    );

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
    if (!scoreboard || !user) return;

    setAllScoreboards((prevAll) =>
      prevAll.map((sb) =>
        sb.id === scoreboard.id
          ? {
              ...sb,
              leadMeasures: sb.leadMeasures.map((lm) =>
                lm.id === id
                  ? {
                      ...lm,
                      status: "ARCHIVED",
                      archivedAt: new Date().toISOString(),
                    }
                  : lm,
              ),
            }
          : sb,
      ),
    );

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
        allScoreboards,
        mockUsers: MOCK_USERS, // Ensure MOCK_USERS is provided through context
        workspaceName, // Expose workspaceName
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
