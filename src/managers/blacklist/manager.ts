import { GlobalStaffManager } from "..";
import Database from "../../database";
import { blacklistType } from "../../@types/database";

export default class BlacklistManager {

  blacklisted = new Map<string, blacklistType | null>();

  constructor() { }

  async isBlacklisted(userId: string): Promise<blacklistType | null> {

    const data = this.blacklisted.get(userId);
    if (data === null) return null;

    if (data === undefined) {
      const res = await Database.getUser(userId);
      return await this.verifyBlacklistData(userId, res.auditory?.blacklist);
    }

    if (
      (
        data.date
        && this.isTimeBlacklisted(data.date)
      ) || (
        data.reason?.length
        && data?.executorId
      )
    ) return data;

    const res = await Database.getUser(userId);
    return await this.verifyBlacklistData(userId, res.auditory?.blacklist);
  }

  async setBlacklist(userId: string, data: blacklistType): Promise<blacklistType | null> {

    if (!GlobalStaffManager.isMod(data.executorId)) return null;

    const verifiedData = await this.verifyBlacklistData(userId, data);
    if (!verifiedData) return null;

    await Database.Users.updateOne(
      { id: userId },
      { $set: { "auditory.blacklist": data } },
      { upsert: true },
    );

    return data;
  }

  async removeBlacklist(userId: string): Promise<null> {

    this.blacklisted.set(userId, null);

    await Database.Users.updateOne(
      { id: userId },
      { $unset: { "auditory.blacklist": true } },
      { upsert: true },
    );

    return null;
  }

  async getBlacklist(userId: string): Promise<blacklistType | null> {
    const data = await Database.getUser(userId);
    return await this.verifyBlacklistData(userId, data?.auditory?.blacklist);
  }

  private isTimeBlacklisted(date: Date): boolean {
    return Date.now() < date.getTime();
  }

  private async verifyBlacklistData(userId: string, data: blacklistType | undefined): Promise<blacklistType | null> {
    if (!userId || !data) return null;

    if (data.date && !this.isTimeBlacklisted(data.date))
      return await this.removeBlacklist(userId);

    if (
      !data?.reason?.length
      || !data?.executorId
    ) return await this.removeBlacklist(userId);

    if (data.reason?.length && data.executorId) {
      this.blacklisted.set(userId, data);
      return data;
    }

    return await this.removeBlacklist(userId);
  }

}