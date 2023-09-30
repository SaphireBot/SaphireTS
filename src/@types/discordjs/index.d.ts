import "discord.js";
import { APIMessageComponentEmoji, LocaleString } from "discord.js";

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
    }
}