import { ButtonStyle, Message, PermissionFlagsBits } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";
import { tempcallOptions } from "../../components/buttons/buttons.get";
import client from "../../../saphire";
import tempcallRanking from "../../functions/ranking/tempcall/tempcall";

export default {
    name: "tempcall",
    description: "A giant system with count the tempcall of all members",
    aliases: ["tpc"],
    category: "moderation",
    api_data: {
        category: "Moderação",
        synonyms: ["tpc"],
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, args: string[] | undefined) {

        const { member, userLocale: locale, guildId } = message;
        if (!args?.length) return await config();

        if (
            [
                "zurücksetzen",
                "reset",
                "restablecer",
                "réinitialiser",
                "restart",
                "zerar",
                "リセット"
            ].includes(args[0]?.toLowerCase())
        )
            return await config("reset");

        if (
            [
                "ranking",
                "rank",
                "status",
                "stats",
                "top",
                "s"
            ].includes(args[0]?.toLowerCase())
        )
            return await tempcallRanking(message, args);
        
        return await config();

        async function config(param?: "reset") {

            if (!member!.permissions.has(PermissionFlagsBits.Administrator))
                return await message.reply({
                    content: t("tempcall.you_do_not_have_permissions", { e, locale })
                });

            if (param === "reset") return await reset();
            return layout();

            async function reset() {

                const msg = await message.reply({ content: t("tempcall.loading", { e, locale }) });
                const data = (await Database.getGuild(guildId))?.TempCall;

                if (
                    !data
                    || (!data?.members && !data?.membersMuted)
                    || (
                        !Object.values(data?.members || {})?.length
                        && !Object.values(data?.membersMuted || {})?.length
                    )
                )
                    return await msg?.edit({ content: t("tempcall.empty_ranking", { e, locale }) });

                return await msg.edit({
                    content: t("tempcall.do_you_really_want_reset_it", { e, locale }),
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    label: t("keyword_confirm", locale),
                                    custom_id: JSON.stringify({ c: "tempcall", src: "reset" }),
                                    style: ButtonStyle.Danger
                                },
                                {
                                    type: 2,
                                    label: t("keyword_cancel", locale),
                                    custom_id: JSON.stringify({ c: "tempcall", src: "cancel" }),
                                    style: ButtonStyle.Success
                                }
                            ]
                        }
                    ]
                });
            }

            async function layout() {

                const msg = await message.reply({ content: t("tempcall.loading", { e, locale }) });

                const guildData = await Database.getGuild(guildId);

                const data = {
                    enable: guildData?.TempCall?.enable || false,
                    muteTime: guildData?.TempCall?.muteTime || false
                };

                return await msg.edit({
                    content: t("tempcall.content_status", { e, locale, client, status: data.enable ? t("keyword_enable", locale) : t("keyword_disable", locale) }),
                    components: tempcallOptions(data, locale)
                });

            }
        }
    }
};