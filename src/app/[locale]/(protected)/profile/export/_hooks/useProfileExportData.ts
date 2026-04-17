"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { useGetScoreboardsActive } from "@/api/generated/scoreboard/scoreboard";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import { getApiErrorStatus, toNumberId } from "@/lib/client/frontend-api";
import { useMemo } from "react";

export const useProfileExportData = () => {
  const { data: profileResponse, isLoading: isProfileLoading } = useGetUsersMe();
  const {
    data: workspaceResponse,
    isLoading: isWorkspaceLoading,
    error: workspaceError,
  } = useGetWorkspacesMe({
    query: {
      retry: (failureCount, error) =>
        getApiErrorStatus(error) !== 404 && failureCount < 3,
    },
  });
  const {
    data: activeScoreboardResponse,
    isLoading: isScoreboardLoading,
    error: scoreboardError,
  } = useGetScoreboardsActive({
    query: {
      retry: (failureCount, error) =>
        getApiErrorStatus(error) !== 404 && failureCount < 1,
    },
  });

  const user = profileResponse?.status === 200 ? profileResponse.data : null;
  const workspace =
    workspaceResponse?.status === 200 ? workspaceResponse.data : null;
  const activeScoreboard =
    activeScoreboardResponse?.status === 200
      ? activeScoreboardResponse.data
      : null;

  const exportMeasureOptions = useMemo(
    () =>
      (activeScoreboard?.leadMeasures ?? [])
        .filter((measure) => measure.status === "ACTIVE")
        .map((measure) => ({
          id: toNumberId(measure.id),
          name: measure.name,
        }))
        .filter(
          (measure): measure is { id: number; name: string } =>
            measure.id !== null,
        ),
    [activeScoreboard],
  );

  return {
    activeScoreboard,
    exportMeasureOptions,
    hasNoScoreboard: getApiErrorStatus(scoreboardError) === 404,
    hasNoWorkspace: getApiErrorStatus(workspaceError) === 404,
    isLoading: isProfileLoading || isWorkspaceLoading || isScoreboardLoading,
    user,
    workspace,
  };
};
