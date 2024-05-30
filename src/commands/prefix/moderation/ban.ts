import { Message, PermissionFlagsBits } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../../functions/permissionsMissing";
import add from "../../functions/ban/add";
import { t } from "../../../translator";
import Database from "../../../database";
import { e } from "../../../util/json";
import client from "../../../saphire";
import remove from "../../functions/ban/remove";
import list from "../../functions/ban/list";

const ban = ["banir", "禁止する", "verbannen", "ban"];
const unban = ["desbanir", "entbannen", "解封", "アンバン", "débannir", "撤销封锁", "unban"];
const aliases = [ban, unban].flat();

export default {
    name: "ban",
    description: "Ban and unban users",
    aliases,
    category: "moderation",
    api_data: {
        category: "Moderação",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [DiscordPermissons.BanMembers],
            bot: [DiscordPermissons.BanMembers]
        }
    },
    async execute(message: Message<true>, args: string[] | undefined, command: string) {

        const { guild, userLocale: locale, member, guildId } = message;

        if (!message.member?.permissions.has(PermissionFlagsBits.BanMembers, true))
            return await permissionsMissing(message, [DiscordPermissons.BanMembers], "Discord_you_need_some_permissions");

        if (!guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers, true))
            return await permissionsMissing(message, [DiscordPermissons.BanMembers], "Discord_client_need_some_permissions");

        if (!args?.length)
            return await message.reply({
                content: t(
                    ban.includes(command)
                        ? "ban.add.no_args_mentioned"
                        : "ban.remove.empty_content", {
                    e,
                    locale,
                        prefix: (await Database.getPrefix({ guildId, userId: member!.id })).random()!,
                    member,
                    client,
                    command,
                    list: t("ban.list_key", locale)
                })
            });

        if (
            [
                "lista", "list", "liste", "列表", "リスト",
                "página", "page", "seite", "页面", "ページ",
                "páginas", "pages", "seiten", "页面", "ページ",
                "l", "p", "s"
            ].includes((args?.[0] || "").toLowerCase())
        )
            return await list(message);

        if (ban.includes(command)) return await add(message);
        if (unban.includes(command)) return await remove(message);
    }
};