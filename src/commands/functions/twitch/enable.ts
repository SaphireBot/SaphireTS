import { ButtonInteraction, ChannelType, ChatInputCommandInteraction, Message, Role } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import socket from "../../../services/api/ws";
import Database from "../../../database";
import { getConfirmationButton } from "../../components/buttons/buttons.get";
import { AcceptData } from "../../../@types/twitch";
import accept from "./accept.enable";

export default async function enable(
    interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>,
    args?: string[] | undefined
) {

    let streamers: string[];
    let channel;
    let role: Role | null | undefined;
    let customMessage: string | undefined;
    const user = "user" in interactionOrMessage ? interactionOrMessage.user : interactionOrMessage.author;

    if (interactionOrMessage instanceof ChatInputCommandInteraction) {
        streamers = formatStreamers(interactionOrMessage.options.getString("streamers") || "");
        channel = interactionOrMessage.options.getChannel("channel");
        role = interactionOrMessage.options.getRole("role");
        customMessage = interactionOrMessage.options.getString("message") || undefined;
    } else {
        streamers = Array.isArray(args) ? args.map(str => formatStreamers(str)).flat() : formatStreamers(interactionOrMessage.content);
        channel = interactionOrMessage.mentions.channels.first() || interactionOrMessage.channel;
        role = interactionOrMessage.mentions.roles.first();
    }

    const { userLocale: locale, guild } = interactionOrMessage;

    if (!streamers.length)
        return await interactionOrMessage.reply({
            content: t("twitch.no_streamers_found", { e, locale })
        });

    if (!channel || ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel?.type))
        return await interactionOrMessage.reply({
            content: t("twitch.enable.invalid_channel", { e, locale })
        });

    const msg = await interactionOrMessage.reply({
        content: t("twitch.loading", { e, locale }),
        fetchReply: true
    });

    const availableStreamers = await socket.twitch.checkExistingStreamers(streamers);
    if (!availableStreamers) return await msg.edit({ content: t("twitch.enable.no_available_streamers", { e, locale }) });
    if (typeof availableStreamers === "string") return await msg.edit({ content: `invalid params\n${availableStreamers}` });
    if ("message" in availableStreamers) return await msg.edit({ content: t("twitch.timeout", { e, locale }) }).catch(() => { });
    if (!availableStreamers.length) return await msg.edit({ content: t("twitch.enable.no_available_streamers", { e, locale }) });

    const guildData = await Database.getGuild(guild.id);
    const notifications = guildData?.TwitchNotifications || [];

    const data = availableStreamers.map(str => {
        str.channelId = notifications.find(d => d.streamer === str.login)?.channelId;
        return str;
    });

    const commandData: AcceptData[] = [];

    for (const s of data)
        commandData.push({
            streamer: s.login,
            username: s.display_name,
            channelId: channel.id,
            roleId: role?.id,
            oldChannelId: s.channelId,
            message: customMessage ? customMessage.replace(/\$streamer/g, s.login).replace(/\$role/g, role ? `<@&${role.id}>` : "") : undefined
        });

    const embed = {
        color: 0x9c44fb,
        title: t("twitch.enable.embeds.0.title", { e, locale }),
        description: data.map(s => `👤 [${s.display_name}](${`https://www.twitch.tv/${s.login}`})${s.channelId ? ` -> <#${s.channelId}>` : ""}`).join("\n").limit("EmbedDescription"),
        fields: [
            {
                name: t("twitch.enable.embeds.0.fields.0.name", { e, locale }),
                // value: `Canal de Notificação: ${channel} \`${channel.id}\`\nCargo: ${role ? `${role} \`${role.id}\`` : "Nenhum"}\nMensagem Customizada: ${commandData[0].message ? commandData[0].message : `${e.Notification} **${commandData[0].streamer}** está em live na Twitch.`}`
                value: t("twitch.enable.embeds.0.fields.0.value", {
                    e, locale,
                    channel: `${channel} \`${channel.id}\``,
                    role: role ? `${role} \`${role.id}\`` : t("twitch.anyone", locale),
                    message: commandData[0].message ? commandData[0].message : `${e.Notification} **${commandData[0].streamer}** ${t("twitch.is_live_on_twitch", locale)}`
                })
            }
        ],
        footer: {
            text: `${availableStreamers.length}/${streamers.length} ${t("twitch.valid_streamers", locale)}`
        }
    };

    await msg.edit({ content: null, embeds: [embed], components: getConfirmationButton(locale) });

    return msg.createMessageComponentCollector({
        filter: int => int.user.id === user.id,
        time: 1000 * 60 * 10,
        max: 1
    })
        .on("collect", async (int): Promise<any> => {
            if (int.customId === "accept") return await accept(int as ButtonInteraction<"cached">, commandData);

            if (int.customId === "cancel")
                return await msg.delete().catch(() => { });
        })
        .on("end", (_, reason: string): any => {
            if (reason === "limit") return;
            return msg.delete().catch(() => { });
        });

    function formatStreamers(string: string) {
        return Array.from(
            new Set(
                string
                    .toLowerCase()
                    .split(/(?:(?:https?:\/\/(?:www\.)?(?:m\.)?twitch\.tv\/)|\W+)/)
                    .filter(Boolean)
            )
        )
            .slice(0, 100);
    }
}