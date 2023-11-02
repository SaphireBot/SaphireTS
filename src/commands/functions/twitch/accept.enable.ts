import { ButtonInteraction, Colors, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { AcceptData } from "../../../@types/twitch";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import permissionsMissing from "../permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";
import Database from "../../../database";

export default async function accept(interaction: ButtonInteraction<"cached">, data: AcceptData[]) {

    const { userLocale: locale, member, guild } = interaction;

    if (!member.permissions.has(PermissionsBitField.Flags.Administrator))
        return await interaction.update({
            content: t("twitch.you_must_be_an_administrator", { e, locale }),
            components: [], embeds: []
        });

    await interaction.update({ content: t("twitch.loading", { e, locale }), components: [], embeds: [] });

    const channel = await guild.channels.fetch(data[0].channelId).catch(() => null);
    if (!channel)
        return await interaction.update({ content: t("twitch.channel_not_found", { e, locale }), components: [], embeds: [] });

    if (guild.members.me?.permissions.missing([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])?.length)
        return await permissionsMissing(
            interaction,
            [DiscordPermissons.BanMembers, DiscordPermissons.SendMessages, DiscordPermissons.EmbedLinks,],
            "Discord_client_need_some_permissions"
        );
  
    for await (const d of data)
        await Database.Twitch.updateOne(
            { streamer: d.streamer },
            {
                $set: {
                    [`notifiers.${d.channelId}`]: {
                        channelId: d.channelId,
                        guildId: guild.id,
                        message: d.message,
                        notified: false,
                        roleId: d.roleId
                    }
                }
            },
            { upsert: true }
        );

    return await interaction.editReply({
        content: null,
        components: [],
        embeds: [{
            color: Colors.Blue,
            title: t("twitch.enable.embeds.1.title", { e, locale }),
            description: t("twitch.enable.embeds.1.description", { locale, text: data.map(d => `${e.CheckV} [${d.username}](${`https://www.twitch.tv/${d.streamer}`})`).join("\n") }),
            fields: [
                {
                    name: t("twitch.enable.embeds.1.fields.0.name", { e, locale }),
                    value: t("twitch.enable.embeds.1.fields.0.value", {
                        e, locale,
                        channel: `${channel} \`${channel.id}\``,
                        role: data[0].roleId ? `<@$${data[0].roleId}> \`${data[0].roleId}\`` : t("twitch.anyone", locale),
                        message: data[0].message ? data[0].message : `${e.Notification} **${data[0].streamer}** ${t("twitch.is_live_on_twitch", locale)}`
                    })
                    // value: `Canal de Notificação: ${channel} \`${channel.id}\`\nCargo: ${roleId ? `<@&${roleId}> \`${roleId}\`` : "Nenhum"}\nMensagem Customizada: ${commandData[0].message ? commandData[0].message : `${e.Notification} **${commandData[0].streamer}** está em live na Twitch.`}`
                },
                {
                    name: t("twitch.enable.embeds.1.fields.1.name", { e, locale }),
                    value: t("twitch.enable.embeds.1.fields.1.value", locale)
                }
            ]
        }]
    }).catch(() => { });
}