import "discord.js";
import { APIMessageComponentEmoji, LocaleString, APIGuildMember, GuildMember, APIUser } from "discord.js";

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
        getMember(id: string): Promise<GuildMember | APIGuildMember | undefined | null>
        getUser(id: string): Promise<User | APIUser | undefined | null>
        getRole(id: string): Promise<Role | undefined | null>

        getMultipleUsers(): Promise<(User | APIUser | undefined | null)[]>
        getMultipleMembers(): Promise<(GuildMember | APIGuildMember | undefined | null)[]>

        formatIds(): string[]
    }

}