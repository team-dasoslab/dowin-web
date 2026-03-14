import { getDb } from "@/db";
import { AuthService } from "@/domain/auth/services/auth.service";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import { loginSchema } from "@/domain/auth/validation";
import { apiError, apiSuccess } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/with-error-handler";
import { cookies } from "next/headers";

export const POST = withErrorHandler(
  async (request: Request, { env }: { env: CloudflareEnv }) => {
    const db = getDb(env.DB);
    const storage = new AuthStorage(db);
    const service = new AuthService(storage);

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    try {
      const { user, sessionId } = await service.login(
        parsed.data.customId,
        parsed.data.password,
      );

      const cookieStore = await cookies();
      cookieStore.set("wig_sid", sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return apiSuccess({ user });
    } catch (error: any) {
      if (error.message === "아이디 또는 비밀번호가 올바르지 않습니다") {
        return apiError("INVALID_CREDENTIALS");
      }
      throw error;
    }
  },
);
