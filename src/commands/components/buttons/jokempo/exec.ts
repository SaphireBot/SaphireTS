import { ButtonStyle, Routes, StringSelectMenuInteraction, messageLink } from "discord.js";
import client from "../../../../saphire/index.js";
import Database from "../../../../database/index.js";
import { e } from "../../../../util/json.js";
import { t } from "../../../../translator/index.js";

/**
 * @param { StringSelectMenuInteraction } interaction
 * @param { { value: number } } commandData
 */
export default async function exec(
    interaction: StringSelectMenuInteraction<"cached">,
    { value, uid }: { c: "jkp", type: "exec", value: number, uid: string },
) {

    const { message, user, channelId, userLocale: locale } = interaction;

    if (user.id !== uid)
        return await interaction.reply({
            content: t("jokempo.disable_you_cannot_use_it", { e, locale }),
            ephemeral: true,
        });

    await interaction.update({ content: t("jokempo.global_validators", { e, locale }), components: [], embeds: [] }).catch(() => { });

    const gamesOpened = await Database.Jokempo.find({ opponentId: user.id });
    if (gamesOpened?.length > 0) {

        for await (const { id, messageId, channelId } of gamesOpened) {
            if (messageId || channelId) {
                let cancel = false;
                await interaction.editReply({ content: t("jokempo.a_game_is_open", { e, locale }) })
                    .catch(async () => {
                        cancel = true;
                        return await revert(null, id);
                    });
                if (cancel) continue;

                const messageUrl = await client.rest.get(Routes.channelMessage(channelId!, messageId!))
                    .then(() => messageLink(channelId!, messageId!))
                    .catch(async () => {
                        await revert(null, id);
                        return null;
                    });
                if (messageUrl) return await hasGameOpen(messageUrl, id);
                continue;
            }
            await revert(null, id);
        }

    }

    const jokempos = await Database.Jokempo.find({ global: true, value });
    const jokempo = jokempos.filter(data => data?.createdBy !== user.id)?.[0];

    if (!jokempo)
        return await interaction.editReply({
            // content: `${e.DenyX} | Nenhum jokempo global foi encontrado no valor **${value.currency()} Safiras**.\n${e.Info} | Se apareceu algum Jokempo disponível, provavelmente é o seu.`,
            content: t("jokempo.any_game_found", {
                e,
                locale,
                value: (value || 0).currency(),
            }),
        }).catch(() => { });

    const betUser = await client.users.fetch(jokempo.createdBy!);
    if (!betUser) return await userNotFound();

    if (!jokempo.opponentId) {
        const userData = await Database.getUser(user.id);
        const balance = userData?.Balance || 0;
        if (balance < value)
            return await interaction.editReply({
                content: t("jokempo.sapphires_enough", { e, locale, value: (value || 0).currency() }),
            }).catch(() => { });
    }

    return await tradeGlobalJokempo().catch(err => revert(err, jokempo.id));

    async function userNotFound() {

        const content = t("jokempo.user_not_found", { e, locale, jokempo });
        await interaction.editReply({ content }).catch(() => message.channel.send({ content }).catch(() => { }));

        await Database.editBalance(
            jokempo.createdBy!,
            {
                createdAt: new Date(),
                keywordTranslate: "jokempo.transactions.refund",
                method: "add",
                mode: "jokempo",
                type: "system",
                value: jokempo.value || 0,
            },
        );

        await Database.Jokempo.deleteOne({ id: jokempo.id });
        return;
    }

    async function tradeGlobalJokempo() {
        if (!jokempo.opponentId) {

            await Database.editBalance(
                user.id,
                {
                    createdAt: new Date(),
                    keywordTranslate: "jokempo.transactions.loss_global",
                    method: "sub",
                    mode: "jokempo",
                    type: "loss",
                    value,
                },
            );

        }
        return await sendMessage();
    }

    async function sendMessage() {
        const msg = await interaction.editReply({
            content: t("jokempo.u_r_in_a_bet", {
                e,
                locale,
                value: (value || 0).currency(),
                betUser,
            }),
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            emoji: e.pedra,
                            custom_id: JSON.stringify({ c: "jkp", type: "play", play: "stone", id: jokempo.id }),
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: 2,
                            emoji: e.tesoura,
                            custom_id: JSON.stringify({ c: "jkp", type: "play", play: "scissors", id: jokempo.id }),
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: 2,
                            emoji: e.papel,
                            custom_id: JSON.stringify({ c: "jkp", type: "play", play: "paper", id: jokempo.id }),
                            style: ButtonStyle.Primary,
                        },
                    ],
                },
            ].asMessageComponents(),
        })
            .catch(async err => {
                await revert(err, jokempo.id);
                return null;
            });

        if (!msg?.id) return;

        await Database.Jokempo.updateOne(
            { id: jokempo.id },
            {
                $set: {
                    opponentId: user.id,
                    channelId: channelId,
                    messageId: msg.id,
                },
            },
        );
        return;
    }

    async function revert(err: any, jokempoId: string) {

        await Database.Jokempo.updateOne(
            { id: jokempoId },
            {
                $unset: {
                    opponentId: true,
                    channelId: true,
                },
            },
        );

        await Database.editBalance(
            user.id,
            {
                createdAt: new Date(),
                keywordTranslate: "jokempo.transactions.refund",
                method: "add",
                mode: "jokempo",
                type: "system",
                value,
            },
        );

        if (!err) return;
        return await interaction.channel!.send({ content: t("jokempo.error_to_iniciate_this_bet", { e, locale, err }) }).catch(() => { });
    }

    async function hasGameOpen(messageUrl: string, id: string) {
        return await interaction.editReply({
            content: t("jokempo.redirect_to_game_or_cancel", { e, locale, user }),
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("jokempo.play", locale),
                            emoji: "🖇️",
                            url: messageUrl,
                            style: ButtonStyle.Link,
                        },
                        {
                            type: 2,
                            label: t("jokempo.disable", locale),
                            emoji: e.Trash,
                            custom_id: JSON.stringify({ c: "jkp", type: "disabled", id, uid: user.id }),
                            style: ButtonStyle.Danger,
                        },
                    ],
                },
            ].asMessageComponents(),
        }).catch(() => { });
    }

}