import { Message, User, PartialUser, AttachmentBuilder } from "discord.js";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";
import { RankCardBuilder } from "discord-card-canvas";

export default new class Experience {

  timers: Record<string, NodeJS.Timeout> = {};
  xpToAdd: Record<string, number> = {};
  multiplier = 275;
  usersToWarnAboutLevelUp = new Set<string>();

  constructor() { }

  add(userId: string, xp: number) {
    if (!this.xpToAdd[userId]) this.xpToAdd[userId] = 0;
    this.xpToAdd[userId] += xp;
    if (this.timers[userId]) return;
    this.timers[userId] = setTimeout(() => this.check(userId), 1000 * 5);
  }

  async check(userId: string) {
    const { level, xp } = await this.fetch(userId);

    if (xp >= (level * this.multiplier)) {
      const levelsToAdd = parseInt((xp / (level * this.multiplier)).toFixed());
      const xpToRemove = parseInt(((level * this.multiplier) * levelsToAdd).toFixed());
      this.usersToWarnAboutLevelUp.add(userId);
      return await this.levelUp(userId, xpToRemove, levelsToAdd);
    }
  }

  async levelUp(userId: string, xpToRemove: number, levelToAdd: number) {

    this.clear(userId);
    const data = await Database.Users.findOneAndUpdate(
      { id: userId },
      {
        $inc: {
          "Experience.Xp": -xpToRemove,
          "Experience.Level": levelToAdd,
        },
      },
      { upsert: true, new: true },
    );

    if ((data.Experience?.Xp || 0) < 0)
      await Database.Users.updateOne(
        { id: userId },
        { $set: { "Experience.Xp": 1 } },
        { upsert: true },
      );

    return;
  }

  async fetch(userId: string) {
    let data = await Database.getUser(userId);

    if ((data.Xp || 0) > 0) {
      data = await Database.Users.findOneAndUpdate(
        { id: userId },
        {
          $inc: {
            "Experience.Xp": data.Xp || 0,
            "Experience.Level": data.Level || 0,
          },
          $unset: {
            Xp: true,
            Level: true,
          },
        },
        { upsert: true, new: true },
      );
      this.clear(userId);
    }

    return {
      xp: (data.Experience?.Xp || 0) + (this.xpToAdd[userId] || 0),
      level: data.Experience?.Level || 1,
    };
  }

  clear(userId: string) {
    delete this.xpToAdd[userId];
    clearTimeout(this.timers[userId]);
    delete this.timers[userId];
  }

  async warnLevelUp(channel: any, user: User | PartialUser) {
    if (!("send" in channel)) return;

    this.usersToWarnAboutLevelUp.delete(user.id);
    const level = (await this.fetch(user.id)).level.currency();
    const locale = await user.locale();

    return await channel.send({
      content: t("experience.levelup", { e, locale, level, user: user.toString() }),
    })
      .then(async (msg: Message) => setTimeout(async () => await msg.delete().catch(() => { }), 1000 * 15))
      .catch(() => { });
  }

  async renderCard(user: User) {

    let { xp, level } = await this.fetch(user.id);

    if (xp >= (level * this.multiplier)) {
      const levelsToAdd = parseInt((xp / (level * this.multiplier)).toFixed());
      const xpToRemove = parseInt(((level * this.multiplier) * levelsToAdd).toFixed());
      this.usersToWarnAboutLevelUp.add(user.id);
      await this.levelUp(user.id, xpToRemove, levelsToAdd);
      xp -= xpToRemove;
      if (xp < 0) xp = 1;
      level += levelsToAdd;
    }

    const { position } = await this.rank(user.id);

    const canvasRank = await new RankCardBuilder({
      currentLvl: level,
      currentRank: position,
      currentXP: xp,
      requiredXP: level * this.multiplier,
      backgroundColor: { background: "#070d19", bubbles: "#0ca7ff" },
      // backgroundImgURL: 'any_image.png', ( you can also use )
      avatarImgURL: user.displayAvatarURL().replace("webp", "png"),
      nicknameText: { content: user.username, font: "Nunito", color: "#0CA7FF" },
      userStatus: "idle",
    }).build();

    return new AttachmentBuilder(canvasRank.toBuffer(), { name: `ranking.${user.id}.png` });
  }

  async rank(userId: string): Promise<{ level: number, position: number }> {
    if (!userId) return { level: 0, position: 0 };

    const level = await this.getLevel(userId);
    if (!level || level === 0) return { level: 0, position: 0 };

    const position = await Database.Users.countDocuments({
      "Experience.Level": { $gt: level },
    });

    return { level, position: position + 1 };

    // const res = (await Database.Users.aggregate([
    //   // {
    //   //   $set: { Level: { $ifNull: ["$Experience.Level", 1] } },
    //   // },
    //   {
    //     $setWindowFields: {
    //       partitionBy: null,
    //       sortBy: { Level: -1 },
    //       output: { position: { $documentNumber: {} } },
    //     },
    //   },
    //   { $match: { id: userId } },
    //   {
    //     $project: { _id: null, id: true, Level: true, position: true },
    //   },
    // ], Database.agreggatePipelineOptions))[0] || { id: userId, Level: 0, position: 0 };
    // res.Level = res.Level || 1;
    // return res;
  }

  async getLevel(userId: string): Promise<number> {
    return (await Database.getUser(userId))?.Experience?.Level || 1;
  }

};