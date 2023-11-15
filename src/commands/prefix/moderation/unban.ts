import { Message, APIUser, PermissionFlagsBits, Routes, User } from "discord.js";
import { DiscordPermissons } from "../../../util/constants";
import permissionsMissing from "../../functions/permissionsMissing";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import client from "../../../saphire";
import { bans } from "../../../structures/interaction/autocomplete/unban";
import list from "../../functions/unban/list";
import Database from "../../../database";
const aliases = ["desbanir", "entbannen", "解封", "アンバン", "débannir"];

export default {
    name: "unban",
    description: "Unban a user from guild",
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
    execute: async function (message: Message<true>, args: string[] | undefined) {

        const { author, guild, member, userLocale: locale } = message;

        if (!member?.permissions.has(PermissionFlagsBits.BanMembers, true))
            return await permissionsMissing(message, [DiscordPermissons.BanMembers], "Discord_you_need_some_permissions");

        if (!member?.permissions.has(PermissionFlagsBits.BanMembers, true))
            return await permissionsMissing(message, [DiscordPermissons.BanMembers], "Discord_you_need_some_permissions");

        if (!args?.[0])
            return await message.reply({
                content: t("unban.empty_content", {
                    e,
                    locale,
                    id: author.id,
                    prefix: (await Database.getPrefix(guild.id)).random()
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

        const msg = await message.reply({ content: t("unban.loading", { e, locale }) });
        const user = bans.get(guild.id)
            ? bans.get(guild.id)?.find(ban => ban.user.username.toLowerCase().includes(args[0]?.toLowerCase())
                || ban.user.id.includes(args[0]?.toLowerCase())
                || ban.reason?.toLowerCase().includes(args[0]?.toLowerCase()))?.user
            : await client.rest.get(Routes.user(args[0])).catch(() => null) as APIUser | User | null;
        const reason = args?.slice(1)?.join(" ")?.limit(100) || t("unban.no_reason_given", guild.preferredLocale || "en-US");

        if (!user) return await msg.edit({ content: t("unban.no_user_found", { e, locale }) });

        const unban = await guild.bans.remove(user?.id, `${user.username}: ${reason.limit(100)}`)
            .catch(err => err?.code as number) as User | null | number | string;

        if (unban === null)
            return await msg.edit({ content: t("unban.no_response", { e, locale, user }) });

        if (
            typeof unban === "number"
            || typeof unban === "string"
        ) {

            // User not banned
            if (unban === 10026)
                return await msg.edit({ content: t("unban.user_is_not_banned", { e, locale, user }) });

            if (unban === "BanResolveId")
                return await msg.edit({ content: t("unban.no_user_unban", { e, locale }) });

            return await msg.edit({ content: t("unban.fail", { e, locale, unban, user }) });
        }

        const bansCached = bans.get(guild.id);

        if (bansCached?.length) {
            bansCached.filter(ban => ban.user.id !== unban.id);
            bans.set(guild.id, bansCached);
        }

        return await msg.edit({ content: t("unban.success", { e, locale, user: unban, reason }) });

    }
};