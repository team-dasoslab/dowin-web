import { TeamCheckinSettings, Workspace } from "@/api/generated/dowin.schemas";
import {
  getGetWorkspacesWorkspaceIdTeamCheckinsSettingsQueryKey,
  usePutWorkspacesWorkspaceIdTeamCheckinsSettings,
} from "@/api/generated/team-checkins/team-checkins";
import {
  getGetWorkspacesMeQueryKey,
  getGetWorkspacesQueryKey,
  usePutWorkspacesId,
} from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

export const useWorkspaceSettingsActions = (
  workspaceId: string | undefined,
  checkinSettings: TeamCheckinSettings | null,
  workspace: Workspace | null,
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const checkinT = useTranslations("TeamCheckin");
  const updateSettings = usePutWorkspacesWorkspaceIdTeamCheckinsSettings();
  const updateWorkspace = usePutWorkspacesId();

  const handleToggleCheckin = async (checked: boolean) => {
    if (!workspaceId || !checkinSettings) return;
    try {
      await updateSettings.mutateAsync({
        workspaceId,
        data: {
          ...checkinSettings,
          enabled: checked,
        },
      });
      queryClient.invalidateQueries({
        queryKey:
          getGetWorkspacesWorkspaceIdTeamCheckinsSettingsQueryKey(workspaceId),
      });
      showToast(
        "success",
        checked ? checkinT("enabledToast") : checkinT("disabledToast"),
      );
    } catch {
      showToast("error", checkinT("updateFailedToast"));
    }
  };

  const handleChangeCheckinSendTime = async (time: string) => {
    if (!workspaceId || !checkinSettings) return;
    const [hour] = time.split(":").map(Number);
    try {
      await updateSettings.mutateAsync({
        workspaceId,
        data: {
          ...checkinSettings,
          sendHour: hour,
        },
      });
      queryClient.invalidateQueries({
        queryKey:
          getGetWorkspacesWorkspaceIdTeamCheckinsSettingsQueryKey(workspaceId),
      });
      showToast("success", checkinT("sendTimeChangedToast"));
    } catch {
      showToast("error", checkinT("updateFailedToast"));
    }
  };

  const handleTogglePastDailyLogEdit = async (checked: boolean) => {
    if (!workspaceId || !workspace) return;
    try {
      await updateWorkspace.mutateAsync({
        id: workspaceId,
        data: {
          name: workspace.name ?? "",
          allowPastDailyLogEdit: checked,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: getGetWorkspacesMeQueryKey(),
      });
      await queryClient.invalidateQueries({
        queryKey: getGetWorkspacesQueryKey(),
      });
      showToast(
        "success",
        checked
          ? "과거 기록 수정이 허용되었습니다."
          : "과거 기록 수정이 제한되었습니다.",
      );
    } catch {
      showToast("error", "설정 변경에 실패했습니다.");
    }
  };

  return {
    handleToggleCheckin,
    handleChangeCheckinSendTime,
    handleTogglePastDailyLogEdit,
    isUpdateSettingsPending: updateSettings.isPending,
    isUpdateWorkspacePending: updateWorkspace.isPending,
  };
};
