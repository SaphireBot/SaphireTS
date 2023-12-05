import { LocaleString, ButtonStyle, ComponentType } from "discord.js";

export interface ButtonComponentWithCustomId {
    type: ComponentType.Button,
    emoji?: string
    label?: string
    custom_id: string
    style: ButtonStyle.Danger | ButtonStyle.Primary | ButtonStyle.Secondary | ButtonStyle.Success
    disabled?: boolean
}

export interface ButtonComponentWithUrl {
    type: ComponentType.Button,
    emoji?: string
    label?: string
    url: string
    style: ButtonStyle.Link
}

export interface ButtonObject {
    type: ComponentType.ActionRow,
    components: (ButtonComponentWithCustomId | ButtonComponentWithUrl)[]
}

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
    src: "snooze" | "revalidate" | "delete" | "move"
    uid: string
    rid: string | undefined
}