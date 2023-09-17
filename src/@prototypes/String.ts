import { APIMessageComponentEmoji, parseEmoji } from "discord.js";

String.prototype.emoji = function () {
    return parseEmoji(<string>this) as APIMessageComponentEmoji;
};