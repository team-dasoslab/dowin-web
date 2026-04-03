import bcrypt from "bcryptjs";
import { ForbiddenError, NotFoundError, BadRequestError } from "@/lib/server/errors";
import {
  ProfileDeletionContext,
  ProfileRecord,
  UpdateProfileInput,
} from "@/domain/profile/storage/profile.storage";

type ProfileStoragePort = {
  findProfileByUserId(userId: number): Promise<ProfileRecord | null>;
  updateProfile(userId: number, input: UpdateProfileInput): Promise<ProfileRecord | null>;
  findDeletionContextByUserId(userId: number): Promise<ProfileDeletionContext | null>;
  countWorkspaceAdmins(workspaceId: number): Promise<number>;
  deleteUser(userId: number): Promise<void>;
};

export class ProfileService {
  constructor(private storage: ProfileStoragePort) {}

  async getMyProfile(userId: number): Promise<ProfileRecord> {
    const profile = await this.storage.findProfileByUserId(userId);

    if (!profile) {
      throw new NotFoundError("NOT_FOUND");
    }

    return profile;
  }

  async updateProfile(userId: number, input: UpdateProfileInput): Promise<ProfileRecord> {
    const profile = await this.storage.updateProfile(userId, input);

    if (!profile) {
      throw new NotFoundError("NOT_FOUND");
    }

    return profile;
  }

  async deleteMyAccount(userId: number, currentPassword: string): Promise<void> {
    const context = await this.storage.findDeletionContextByUserId(userId);

    if (!context) {
      throw new NotFoundError("NOT_FOUND");
    }

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      context.passwordHash,
    );
    if (!isPasswordMatch) {
      throw new BadRequestError("WRONG_PASSWORD");
    }

    if (context.membership?.role === "ADMIN") {
      const adminCount = await this.storage.countWorkspaceAdmins(
        context.membership.workspaceId,
      );

      if (adminCount <= 1) {
        throw new ForbiddenError("LAST_ADMIN_ACCOUNT_DELETION_FORBIDDEN");
      }
    }

    await this.storage.deleteUser(userId);
  }
}
