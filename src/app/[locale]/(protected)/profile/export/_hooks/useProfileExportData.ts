"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { useGetWorkspacesWorkspaceIdScoreboardsActive } from "@/api/generated/scoreboard/scoreboard";
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
      retry: (failureCount: number, error: any) =>
        getApiErrorStatus(error) !== 404 && failureCount < 3,
    },
  });
  const workspaceId = workspaceResponse?.status === 200 ? (workspaceResponse.data as any)?.id : "";
  const {
    data: activeScoreboardResponse,
    isLoading: isScoreboardLoading,
    error: scoreboardError,
  } = useGetWorkspacesWorkspaceIdScoreboardsActive(workspaceId, {
    query: {
      retry: (failureCount: number, error: any) =>
        getApiErrorStatus(error) !== 404 && failureCount < 1,
    },
  });

  const user = profileResponse?.status === 200 ? profileResponse.data : null;
  const workspace =
    workspaceResponse?.status === 200 ? workspaceResponse.data as any : null;
  const activeScoreboard =
    activeScoreboardResponse?.status === 200
      ? activeScoreboardResponse.data
      : null;

  const exportMeasureOptions = useMemo(
    () =>
      (activeScoreboard?.leadMeasures ?? [])
        .filter((measure: any) => measure.status === "ACTIVE")
        .map((measure: any) => ({
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
