import "discord.js";
import { APIMessageComponentEmoji, GuildMember, LocaleString } from "discord.js";

declare module "discord.js" {
    interface BaseButtonComponentData {
        emoji?: APIMessageComponentEmoji | string
    }

    interface ChatInputCommandInteraction {
        mention: string
    }

    interface User {
        locale: () => Promise<LocaleString | undefined>
    }

    interface BaseInteraction {
        userLocale: LocaleString
    }

    interface Message {
        userLocale: LocaleString
        locale(): Promise<LocaleString>
        getMember(id?: string): Promise<GuildMember | undefined | null>
        getUser(id?: string | string[] | undefined | null): Promise<User | undefined | null>
        getRole(id: string): Promise<Role | undefined | null>

        getMultipleUsers(): Promise<(User | undefined | null)[]>
        getMultipleMembers(): Promise<(GuildMember | undefined | null)[]>

        formatQueries(): string[]
    }

}