import type { DowinDatabase } from "@/db";
import { ProfileService } from "./services/profile.service";
import { ProfileStorage } from "./storage/profile.storage";

export function createProfileService(db: DowinDatabase): ProfileService {
  return new ProfileService(new ProfileStorage(db));
}
