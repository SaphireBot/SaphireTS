import "discord.js";
import { APIMessageComponentEmoji } from "discord.js";

declare module "discord.js" {
    interface BaseButtonComponentData {
        emoji?: APIMessageComponentEmoji | string
    }
}