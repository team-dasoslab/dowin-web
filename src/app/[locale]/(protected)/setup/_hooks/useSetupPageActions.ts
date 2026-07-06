import { useRouter } from "@/i18n/routing";

export const useSetupPageActions = (
  submit: () => Promise<boolean>,
  router: ReturnType<typeof useRouter>,
  workspaceId?: string,
) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit().then((isSuccess) => {
      if (isSuccess) {
        router.push(workspaceId ? `/${workspaceId}/dashboard/my` : "/");
      }
    });
  };

  return { handleSubmit };
};
