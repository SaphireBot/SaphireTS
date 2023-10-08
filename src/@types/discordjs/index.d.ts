import "discord.js";
import { APIMessageComponentEmoji, LocaleString, GuildMember } from "discord.js";

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
        userLocale: LocaleString | "en-US"
    }

    interface Message {
        userLocale: LocaleString | "en-US"
        getMember(id?: string): Promise<GuildMember | undefined | null>
        getUser(id?: string): Promise<User | undefined | null>
        getRole(id: string): Promise<Role | undefined | null>

        getMultipleUsers(): Promise<(User | undefined | null)[]>
        getMultipleMembers(): Promise<(GuildMember | undefined | null)[]>

        formatQueries(): string[]
    }

}