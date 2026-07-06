import { usePostAdminAuthLogin } from "@/api/generated/admin-auth/admin-auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const useAdminLoginForm = () => {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const loginMutation = usePostAdminAuthLogin();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await loginMutation.mutateAsync({
        data: { loginId, password },
      });

      if (response.status !== 200) {
        setError("Invalid login credentials or unauthorized role");
        return;
      }

      router.push("/admin");
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "An error occurred while logging in",
      );
    }
  };

  return {
    loginId,
    setLoginId,
    password,
    setPassword,
    error,
    isPending: loginMutation.isPending,
    handleSubmit,
  };
};
