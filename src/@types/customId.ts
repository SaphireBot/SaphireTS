import { LocaleString } from "discord.js";

export interface BaseComponentCustomId {
    c: string
    uid?: string
    src?: string
}

export interface SetLangButtonCustomId extends BaseComponentCustomId {
    lang: LocaleString
    uid: string
}

export interface ReminderButtonDispare extends BaseComponentCustomId {
    c: "rmd"
    src: "snooze" | "revalidate" | "delete"
    uid: string
}