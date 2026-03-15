import { NotFoundError } from "@/lib/server/errors";
import { ProfileRecord } from "@/domain/profile/storage/profile.storage";

type ProfileStoragePort = {
  findProfileByUserId(userId: number): Promise<ProfileRecord | null>;
  updateNickname(userId: number, nickname: string): Promise<ProfileRecord | null>;
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

  async updateNickname(userId: number, nickname: string): Promise<ProfileRecord> {
    const profile = await this.storage.updateNickname(userId, nickname);

    if (!profile) {
      throw new NotFoundError("NOT_FOUND");
    }

    return profile;
  }
}
