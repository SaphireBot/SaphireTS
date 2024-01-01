import { ButtonInteraction, WebhookClient } from "discord.js";
import { e } from "../../../../util/json";
import getWebhookURL from "../../../functions/getWebhookURL";
import client from "../../../../saphire";
import { randomBytes } from "crypto";
import Database from "../../../../database";
import { Config } from "../../../../util/constants";
import { t } from "../../../../translator";

export default async function save(
    interaction: ButtonInteraction<"cached">,
    data: { option: "stone" | "scissors" | "paper", value: number }
) {

    const { user, channel, guildId, channelId, userLocale: locale } = interaction;
    const { value, option } = data;

    await interaction.update({
        content: t("jokempo.global_validators", { e, locale }),
        embeds: [], components: []
    }).catch(() => { });

    const webhookUrl = await getWebhookURL(channel!.id);

    if (!webhookUrl) {
        const channelPermissions = channel!.permissionsFor(client.user!, true);
        const permissions = channelPermissions?.serialize();
        if (!permissions?.ManageWebhooks)
            return await interaction.update({
                content: t("jokempo.missing_permissions", { e, locale }),
                embeds: [], components: []
            }).catch(() => { });

        return await interaction.update({
            content: t("jokempo.webhooks_missing_data", { e, locale }),
            embeds: [], components: []
        }).catch(() => { });
    }

    if (typeof webhookUrl !== "string" || !webhookUrl?.isURL())
        return await interaction.message.edit({
            content: t("jokempo.missing_permissions", { e, locale }),
            embeds: [], components: []
        }).catch(() => { });

    const id = randomBytes(10).toString("base64url");

    return new Database.Jokempo({
        createdBy: user.id,
        id,
        value,
        webhookUrl,
        [`clicks.${user.id}`]: option,
        channelId: "",
        global: true,
        guildId,
        channelOrigin: channelId,
        messageId: ""
    })
        .save()
        .then(() => feedback())
        .catch(async error => {

            await Database.editBalance(
                user.id,
                {
                    createdAt: new Date(),
                    keywordTranslate: "jokempo.transactions.refund",
                    method: "add",
                    mode: "system",
                    type: "system",
                    value
                }
            );

            return await interaction.message.edit({
                content: t("jokempo.an_error_appear", { e, locale, error }),
                embeds: [], components: []
            }).catch(() => { });
        });

    async function feedback() {

        await Database.editBalance(
            user.id,
            {
                createdAt: new Date(),
                keywordTranslate: "jokempo.transactions.global_lance",
                method: "sub",
                mode: "jokempo",
                type: "loss",
                value
            }
        );

        const content = t("jokempo.global_bet_saved_but_not_ok", { e, locale, user, value: (value || 0).currency() });
        const emojis = { stone: e.pedra, scissors: e.tesoura, paper: e.papel };
        const translate = {
            stone: t("jokempo.stone", locale),
            scissors: t("jokempo.scissors", locale),
            paper: t("jokempo.paper", locale)
        };

        await interaction.message.delete().catch(() => { });

        return new WebhookClient({ url: webhookUrl! })
            .send({
                content: t("jokempo.global_bet_saved_webhook", {
                    e,
                    locale,
                    user,
                    value: (value || 0).currency()
                }),
                username: "Saphire Jokempo Global System",
                avatarURL: Config.WebhookJokempoIcon
            })
            .then(() => interaction.followUp({
                content: t("jokempo.global_bet_saved_feedback", {
                    e,
                    locale,
                    emoji: emojis[option],
                    emoji_name: translate[option],
                    value: (value || 0).currency()
                }),
                ephemeral: true
            }).catch(() => { }))
            .catch(() => interaction.message.edit({ content }).catch(() => channel!.send({ content }).catch(() => null)));
    }

}