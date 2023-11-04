import { ChatInputCommandInteraction, Message } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import socket from "../../../services/api/ws";
import Database from "../../../database";
import { NotifierData } from "../../../@types/twitch";
import { cache } from "../../../structures/interaction/autocomplete/streamers";

export default async function disable(
    interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>
) {

    let streamer: string = "";
    const { userLocale: locale, guildId } = interactionOrMessage;

    streamer = interactionOrMessage instanceof ChatInputCommandInteraction
        ? interactionOrMessage.options.getString("streamer") || ""
        : interactionOrMessage.content.split(/ /g)[2] || "";

    if (!streamer)
        return await interactionOrMessage.reply({
            content: t("twitch.no_streamers_found", { e, locale })
        });

    const msg = await interactionOrMessage.reply({ content: t("twitch.loading", { e, locale }), fetchReply: true });
    const channelId = await Database.Twitch.findOne({ streamer })
        ?.then(data => Object.values(data?.notifiers as NotifierData || {}).find(d => d?.guildId === guildId)?.channelId)
        .catch(() => null);

    if (!channelId)
        return await msg.edit({ content: t("twitch.origin_channel_not_found", { e, locale }) });

    const response = await socket.twitch.disable(streamer, channelId);
    if (response) cache.delete(guildId);

    return await msg.edit({
        content: response
            ? t("twitch.disable.success", { e, locale, streamer })
            : t("twitch.disable.fail", { e, locale, streamer })
    });

}