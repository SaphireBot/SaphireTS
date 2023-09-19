import { LocaleString } from "discord.js";

export interface BaseComponentCustomId {
    c: string
    uid?: string
}

export interface SetLangButtonCustomId extends BaseComponentCustomId {
    lang: LocaleString
    uid: string
}