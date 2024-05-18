import { ButtonInteraction } from "discord.js";
import { JokempoSchemaType } from "../../../../database/schemas/jokempo.js";
import Database from "../../../../database/index.js";
import { Config } from "../../../../util/constants.js";
import { e } from "../../../../util/json.js";
import { JokempoEmojis, JokempoNames } from "../../../../@types/commands.js";
import client from "../../../../saphire/index.js";
import webhookJokempo from "./webhook.js";
import { t } from "../../../../translator/index.js";
// import { t } from "../../../../translator/index.js";

export default async function draw(
    interaction: ButtonInteraction<"cached">,
    jokempo: JokempoSchemaType
) {

    const { user, channel, guild, userLocale: locale } = interaction;
    const creator = await client.getUser(jokempo.createdBy!).catch(() => { });
    const emoji = { stone: "👊", paper: "🤚", scissors: "✌️" }[jokempo.clicks[user.id] as JokempoNames] as JokempoEmojis;
    const usersId = [jokempo.createdBy!, jokempo.opponentId!];
    const value = t("jokempo.sapphires", { locale, value: (jokempo.value || 0).currency() });
    const halfValue = t("jokempo.sapphires", { locale, value: Number(((jokempo.value || 0) / 2).toFixed(0)).currency() });

    const content = t("jokempo.its_a_draw", {
        e,
        locale,
        creator,
        emoji,
        value,
        halfValue
    });
    interaction.update({ content, components: [] })
        .catch(() => channel!.send({ content }).catch(() => { }));

    for await (const userId of usersId)
        await Database.editBalance(
            userId,
            {
                createdAt: new Date(),
                keywordTranslate: "jokempo.transactions.gain_global",
                method: "add",
                mode: "jokempo",
                type: "gain",
                value: Number((jokempo.value! / 2).toFixed(0))
            });

    const webhook = await webhookJokempo(jokempo.channelOrigin, jokempo.webhookUrl);

    if (webhook) {
        const creatorLocale = (await Database.getUser(jokempo.createdBy!))?.locale;
        return webhook
            .send({
                content: t("jokempo.its_a_draw_webhook", {
                    e,
                    locale: creatorLocale,
                    jokempo,
                    emoji,
                    user,
                    guild,
                    value,
                    halfValue
                }),
                username: "Saphire Jokempo Global System",
                avatarURL: Config.WebhookJokempoIcon
            })
            .catch(() => { });

    }
    return;
}