import { ButtonInteraction } from "discord.js";
import { JokempoSchemaType } from "../../../../database/schemas/jokempo";
import { JokempoNames } from "../../../../@types/commands";
import client from "../../../../saphire";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import webhookJokempo from "./webhook";
import { Config } from "../../../../util/constants";
import { t } from "../../../../translator";

export default async function win(
    interaction: ButtonInteraction<"cached">,
    jokempo: JokempoSchemaType
) {

    const { user, channel, guild, userLocale: locale } = interaction;
    const creator = await client.getUser(jokempo.createdBy!).catch(() => { });
    const emojis = { stone: "👊", paper: "🤚", scissors: "✌️" };
    const value = t("jokempo.sapphires", { locale, value: (jokempo.value || 0).currency() });
    const creatorOption = emojis[jokempo.clicks[jokempo.createdBy!] as JokempoNames];
    const userOption = emojis[jokempo.clicks[user.id] as JokempoNames];
    const prize = t("jokempo.sapphires", { locale, value: Number((jokempo.value || 0) * 2).currency() });

    const content = t("jokempo.global_win", {
        e,
        locale,
        userOption,
        creatorOption,
        creator_username: creator?.username || "Not Found",
        created_by: jokempo.createdBy,
        value,
        prize
    });
    await interaction.update({ content, components: [] })
        .catch(() => channel!.send({ content }).catch(() => { }));

    await Database.editBalance(
        user.id,
        {
            createdAt: new Date(),
            keywordTranslate: "jokempo.transactions.gain_global",
            method: "add",
            mode: "jokempo",
            type: "gain",
            value: (jokempo.value || 0) * 2,
            userIdentify: `${creator?.username || "??"} \`${jokempo.createdBy}\``
        }
    );

    const webhook = await webhookJokempo(jokempo.channelOrigin, jokempo.webhookUrl);

    if (webhook) {
        const creatorLocale = (await Database.getUser(jokempo.createdBy!))?.locale;
        return webhook
            .send({
                content: t("jokempo.global_win_webhook", {
                    e,
                    locale: creatorLocale,
                    jokempo,
                    creatorOption,
                    user,
                    userOption,
                    guild,
                    value
                }),
                username: "Saphire Jokempo Global System",
                avatarURL: Config.WebhookJokempoIcon
            })
            .catch(err => console.log(err));
    }
    return;
}