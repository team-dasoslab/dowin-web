import { NotFoundError } from "@/lib/server/errors";
import {
  ProfileRecord,
  UpdateProfileInput,
} from "@/domain/profile/storage/profile.storage";

type ProfileStoragePort = {
  findProfileByUserId(userId: number): Promise<ProfileRecord | null>;
  updateProfile(userId: number, input: UpdateProfileInput): Promise<ProfileRecord | null>;
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
}
