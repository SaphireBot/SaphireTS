import { ButtonInteraction, ButtonStyle, Colors, User } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import client from "../../../../saphire";
import Database from "../../../../database";
import { connect4Cache } from "./play";
import deleteConnect4Game from "../../../functions/connect4/delete";

export default async function init(
    interaction: ButtonInteraction<"cached">,
    data: { c: "connect", src: "init" | "cancel" | "play" | "info", userId: string, authorId: string },
    author: User
) {

    const { user, userLocale: locale } = interaction;
    const authorLocale = await author.locale() || locale;

    if (data.userId !== user.id)
        return await interaction.reply({
            content: t("connect4.you_cannot_click_here", { e, locale }),
            ephemeral: true
        });

    const message = await interaction.update({
        content: authorLocale === locale
            ? t("connect4.loading", { e, locale })
            : `${t("connect4.loading", { e, locale })}` + `\n${t("connect4.loading", { e, locale: authorLocale })}`,
        embeds: [],
        components: [],
        fetchReply: true
    }).catch(() => { });

    const lines = new Array(7).fill(new Array(7).fill(e.white));
    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣"];
    const playNow = [data.authorId, data.userId].random();
    const components = [{ type: 1, components: [] as any[] }, { type: 1, components: [] }];

    for (let i = 0; i <= 3; i++)
        components[0].components.push({
            type: 2,
            emoji: emojis[i],
            custom_id: JSON.stringify({ c: "connect", src: "play", i: i }),
            style: ButtonStyle.Secondary
        });

    for (let i = 4; i <= 6; i++)
        components[1].components.push({
            type: 2,
            emoji: emojis[i],
            custom_id: JSON.stringify({ c: "connect", src: "play", i: i }),
            style: ButtonStyle.Secondary
        });

    components[1].components.push({
            type: 2,
            emoji: "✖️",
            custom_id: JSON.stringify({ c: "connect", src: "cancel", userId: data.userId, authorId: author.id }),
            style: ButtonStyle.Danger
        });

    const emojiPlayer = {
        [playNow === data.authorId ? data.userId : data.authorId]: e.red,
        [playNow === data.authorId ? data.authorId : data.userId]: e.yellow
    };

    const game = await new Database.Connect4({
        id: message!.id,
        emojiPlayer,
        history: {
            [data.authorId]: [],
            [data.userId]: []
        },
        lines,
        players: [data.authorId, data.userId],
        playNow
    }).save();

    connect4Cache.set(message!.id, game.toObject());

    return await interaction.editReply({
        content: authorLocale === locale
            ? t("connect4.awaiting_player", { e, locale, playNow, emoji: emojiPlayer[playNow] })
            : `${t("connect4.awaiting_player", { e, locale, playNow, emoji: emojiPlayer[playNow] })}` + `\n${t("connect4.awaiting_player", { e, locale, playNow, emoji: emojiPlayer[playNow] })}`,
        embeds: [{
            color: Colors.Blue,
            title: `${client.user!.username}'s Connect4`,
            fields: [
                {
                    name: t("connect4.fields.0.name", locale),
                    value: lines.map(line => line.join("|")).join("\n") + `\n${emojis.join("|")}`
                },
                {
                    name: t("connect4.fields.1.name", locale),
                    value: t("connect4.fields.1.value", locale)
                }
            ]
        }],
        components
    })
        .catch(async err => {
            if (err.code === 10062)
                return await interaction.channel?.send({ content: t("connect4.error_data", { e, user, locale }) }).catch(() => { });

            deleteConnect4Game(message!.id);
            await interaction.message.delete().catch(() => { });
            return await interaction.channel?.send({ content: t("connect4.error_to_init", { e, locale, err }) }).catch(() => { });
        });
}