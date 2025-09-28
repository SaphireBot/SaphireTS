import { Collection } from "discord.js";
import Database from "../../database";
import { LocaleString } from "../../util/constants";
import { BattleroyalePhraseSchemaType } from "../../database/schemas/battleroyale";
import { Types } from "mongoose";

export default class BattleroyaleManagerPhrases {

  withKill = new Collection<string, string>();
  withoutKill = new Collection<string, string>();

  constructor() { }

  async load() {

    const phrases = await this.fetchAllApprovedPhrases();

    for (const phrase of phrases)
      this.setNewPhrase(phrase);

  }

  get phrases() {
    return {
      cases: this.withKill.clone(),
      lowCases: this.withoutKill.clone(),
    };
  }

  async approveNewPhrase(_id: string, phrase: string): Promise<BattleroyalePhraseSchemaType | void | null> {
    const data = await Database.BattleroyalePhrases.findOneAndUpdate(
      { _id },
      { $set: { approved: true, phrase } },
      { new: true },
    ).catch(() => { });

    if (!data) return data;
    this.setNewPhrase(data);
    return data;
  }

  async removePhrase(_id: string | Types.ObjectId) {
    const doc = await Database.BattleroyalePhrases.findOneAndDelete({ _id });
    this.withKill.forEach((value, key) => {
      if (value === doc?.phrase) this.withKill.delete(key);
    });
    this.withoutKill.forEach((value, key) => {
      if (value === doc?.phrase) this.withoutKill.delete(key);
    });
    return doc;
  }

  async newPhrase(phrase: string, userId: string, locale: LocaleString) {
    return new Database.BattleroyalePhrases({
      approved: false,
      phrase,
      user: userId,
      kill: undefined,
      locale,
    })
      .save()
      .catch(() => null);
  }

  setNewPhrase(phrase: BattleroyalePhraseSchemaType): string {
    if (!phrase.approved) return "";
    if (phrase.kill) this.withKill.set(phrase._id.toString(), phrase.phrase);
    else this.withoutKill.set(phrase._id.toString(), phrase.phrase);
    return phrase.phrase;
  }

  async updateKill(_id: string | Types.ObjectId, kill: boolean) {
    const doc = await Database.BattleroyalePhrases
      .findOneAndUpdate(
        { _id },
        { $set: { kill: !kill } },
        { new: true },
      );

    if (doc?.approved)
      this.setNewPhrase(doc);

    return doc;
  }

  async fetchAllApprovedPhrases() {
    return await Database.BattleroyalePhrases.find({ approved: true });
  }

  async fetchAllUnapprovedPhrases() {
    return await Database.BattleroyalePhrases.find({ approved: false })
      .catch(() => []);
  }

  async fetchAllPhrases() {
    return await Database.BattleroyalePhrases.find();
  }

  async fetchPhrasesFromAnUser(userId: string) {
    return await Database.BattleroyalePhrases.find({ user: userId });
  }

}