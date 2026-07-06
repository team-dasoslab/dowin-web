import { usePostAdminAuthLogout } from "@/api/generated/admin-auth/admin-auth";
import { useRouter } from "next/navigation";

export const useAdminHeaderActions = () => {
  const router = useRouter();
  const logoutMutation = usePostAdminAuthLogout();

  const handleLogout = async () => {
    if (!window.confirm("정말 로그아웃 하시겠습니까?")) return;

    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Ignore
    }
    router.push("/admin/login");
  };

  return {
    handleLogout,
  };
};
