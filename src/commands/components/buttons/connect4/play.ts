import { APIEmbed, ButtonInteraction, Colors } from "discord.js";
import Database from "../../../../database";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import check from "./check";
import client from "../../../../saphire";
import { ButtonStyle } from "discord.js";
import { Connect4SchemaSchemaType } from "../../../../database/schemas/connnect4";
import deleteConnect4Game from "../../../functions/connect4/delete";
export const connect4Cache = new Map<string, Connect4SchemaSchemaType>();

export default async function play(
    interaction: ButtonInteraction<"cached">,
    commandData: any
) {

    const { message, user, userLocale: locale } = interaction;
    const data = connect4Cache.get(message.id) || await Database.Connect4.findOne({ id: message.id }) as Connect4SchemaSchemaType;

    if (!connect4Cache.has(message.id))
        connect4Cache.set(message.id, (data as any)?.toObject() as any);

    if (!data)
        return await interaction.update({
            content: t("connect4.game_not_found", { e, locale }),
            embeds: [], components: []
        }).catch(() => { });

    if (!data?.players.includes(user.id))
        return await interaction.reply({
            content: t("connect4.you_cannot_click_here", { e, locale }),
            ephemeral: true
        });

    const { i } = commandData;
    const { playNow: userId, emojiPlayer } = data;
    const emojiNumbers = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣"];
    let lines = data.lines.reverse() as unknown as Record<number, string>[];

    if (userId !== user.id)
        return await interaction.reply({
            content: t("connect4.keep_calm_is_not_your_turn", { e, locale }),
            ephemeral: true
        });

    const emoji = emojiPlayer[userId];

    for (const line of lines)
        if (line[i] === e.white) {
            line[i] = emoji;
            break;
        } else continue;

    lines = lines.reverse();

    data.history[userId].push(emojiNumbers[i]);
    const emojiWinner = check(lines);
    if (emojiWinner) return newWinner();

    return await buildEmbedAndUpdate();
    async function buildEmbedAndUpdate() {

        const components = buildComponents();

        if ([...components[0].components, ...components[1].components].every(button => (button as any).disabled))
            return await draw();

        const playNow = data?.playNow === data?.players[0]
            ? data?.players[1]
            : data?.players[0];

        refresh({
            $set: {
                players: data?.players,
                lines,
                playNow,
                emojiPlayer: data?.emojiPlayer,
                history: data?.history
            }
        });

        const userLocale = await (await client.users.fetch(playNow || "")?.catch(() => { }))?.locale();
        return await interaction.update({
            content: userLocale === locale
                ? t("connect4.awaiting_player", { e, locale, playNow, emoji: emojiPlayer[playNow!] })
                : `${t("connect4.awaiting_player", { e, locale, playNow, emoji: emojiPlayer[playNow!] })}` + `\n${t("connect4.awaiting_player", { e, locale, playNow, emoji: emojiPlayer[playNow!] })}`,
            embeds: [{
                color: Colors.Blue,
                title: `${client.user!.username}'s Connect4`,
                fields: [
                    {
                        name: t("connect4.fields.0.name", locale),
                        value: lines.map(line => (line as any).join("|")).join("\n") + `\n${emojiNumbers.join("|")}`,
                    },
                    {
                        name: t("connect4.fields.1.name", userLocale),
                        value: Object.entries(data?.history || {}).map(([id, array]) => `<@${id}> ${(array as any).join(" ")}`).join("\n") || "Nada por aqui"
                    }
                ]
            }],
            components
        })
            .catch(async err => {
                if (err.code === 10062)
                    return await interaction.channel?.send({ content: t("connect4.error_data", { e, user, locale }) }).catch(() => { });

                deleteConnect4Game(message.id);
                await interaction.message.delete().catch(() => { });
                return await interaction.channel?.send({ content: t("connect4.error_to_init", { e, locale, err }) }).catch(() => { });
            });
    }

    async function refresh(data: any) {
        const call = await Database.Connect4.findOneAndUpdate(
            { id: message.id },
            data,
            { upsert: true, new: true }
        );

        if (call?.id)
            connect4Cache.set(message.id, call?.toObject());
        return;
    }

    function isComplete(index: number) {

        for (let i = 0; i <= 6; i++)
            if (lines[i][index] === e.white) return false;

        return true;
    }

    function buildComponents() {

        const components = [{ type: 1, components: [] as any[] }, { type: 1, components: [] as any[] }];

        for (let i = 0; i <= 3; i++)
            components[0].components.push({
                type: 2,
                emoji: emojiNumbers[i],
                custom_id: JSON.stringify({ c: "connect", src: "play", i: i }),
                style: ButtonStyle.Secondary,
                disabled: isComplete(i)
            });

        for (let i = 4; i <= 6; i++)
            components[1].components.push({
                type: 2,
                emoji: emojiNumbers[i],
                custom_id: JSON.stringify({ c: "connect", src: "play", i: i }),
                style: ButtonStyle.Secondary,
                disabled: isComplete(i)
            });

        components[1].components.push({
            type: 2,
            emoji: "✖️",
            custom_id: JSON.stringify({ c: "connect", src: "cancel", userId: data?.players?.[0], authorId: data?.players?.[1] }),
            style: ButtonStyle.Danger
        });

        return components;
    }

    async function newWinner() {

        deleteConnect4Game(message.id);
        const emojiData = Object.entries(emojiPlayer);
        const winnerId = emojiData.find(data => data?.[1] === emojiWinner)?.[0];
        const embed = interaction.message.embeds[0]?.data as APIEmbed;

        if (!embed)
            return await interaction.update({
                content: `${e.Deny} | Embed não encontrada.`,
                components: []
            }).catch(() => { });

        embed.color = emojiWinner === e.red ? 0xdd2e44 : 0xfdcb58;
        if (!embed.fields || !Array.isArray(embed.fields)) embed.fields = [];

        embed.fields[0].value = lines.map(line => (line as any).join("|")).join("\n") + `\n${emojiNumbers.join("|")}`;
        embed.fields[1].value = Object.entries((data as any).history).map(([id, array]) => `<@${id}> ${(array as any).join(" ")}`).join("\n") || "Nada por aqui";
        embed.description = `👑 <@${winnerId}> ganhou com as peças ${emojiWinner}`;

        return await interaction.update({ content: null, embeds: [embed], components: [] }).catch(() => { });

    }

    async function draw() {

        deleteConnect4Game(message.id);
        const embed = interaction.message.embeds[0]?.data as APIEmbed;

        if (!embed)
            return await interaction.update({
                content: t("connect4.embed_not_found", { e, locale }),
                components: []
            }).catch(() => { });

        embed.color = 0xe6e7e8;
        if (!embed.fields || !Array.isArray(embed.fields)) embed.fields = [];

        embed.fields[0].value = lines.map(line => (line as any).join("|")).join("\n") + `\n${emojiNumbers.join("|")}`;
        embed.fields[1].value = Object.entries((data as any).history).map(([id, array]) => `<@${id}> ${(array as any).join(" ")}`).join("\n") || "Nada por aqui";
        embed.description = "🏳️🏳️ Empate 🏳️🏳️";

        return await interaction.update({ content: null, embeds: [embed], components: [] }).catch(() => { });

    }

}