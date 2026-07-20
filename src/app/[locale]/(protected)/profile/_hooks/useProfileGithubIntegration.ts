import {
  useGetIntegrationsGithub,
  usePostIntegrationsGithubDisconnect,
  usePostIntegrationsGithubInstallUrl,
} from "@/api/generated/github-integration/github-integration";
import { useLocale } from "next-intl";
import { useState } from "react";

export function useProfileGithubIntegration() {
  const locale = useLocale() as "ko" | "en";
  const { data, isLoading, refetch } = useGetIntegrationsGithub();

  const [isGettingUrl, setIsGettingUrl] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const { mutateAsync: getInstallUrl } = usePostIntegrationsGithubInstallUrl();
  const { mutateAsync: disconnect } = usePostIntegrationsGithubDisconnect();

  const handleInstallUrl = async () => {
    setIsGettingUrl(true);
    try {
      const res = await getInstallUrl({ data: { locale } });
      if (res.status === 200 && res.data && !("code" in res.data) && res.data.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error("Failed to get install url");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGettingUrl(false);
    }
  };

  const handleDisconnectAccount = async (installationId: string) => {
    setIsDisconnecting(true);
    try {
      await disconnect({ data: { installationId } });
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const status =
    data?.status === 200 && data.data && typeof data.data === "object" && !("code" in data.data)
      ? data.data
      : null;

  return {
    status,
    isLoading,
    isGettingUrl,
    isDisconnecting,
    handleInstallUrl,
    handleDisconnectAccount,
  };
}
