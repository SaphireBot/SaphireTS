import { APIEmbed, CategoryChannel, ChatInputCommandInteraction, Colors, ForumChannel, Message, NewsChannel, PrivateThreadChannel, PublicThreadChannel, ReactionCollector, StageChannel, TextChannel, VoiceChannel } from "discord.js";
// import Database from "../../../../database";
import { e } from "../../../../util/json";
import enableButtonCollector from "./enableCollectors";
import { GiveawayCollectorData, RoleGiveaway } from "../../../../@types/commands";
import { GiveawayType } from "../../../../@types/models";
import { GiveawayManager } from "../../../../managers";
import { t } from "../../../../translator";

export default async function collectReactionAndStartGiveawayConfiguration(
    interaction: ChatInputCommandInteraction<"cached">,
    configurationMessage: Message<true>,
    giveawayMessage: Message<true>,
    embed: APIEmbed,
    channel: CategoryChannel | NewsChannel | StageChannel | TextChannel | PrivateThreadChannel | PublicThreadChannel<boolean> | VoiceChannel | ForumChannel | null | undefined,
    GiveawayResetedData?: GiveawayType,
    color?: number | undefined
) {

    const locale = interaction.userLocale;
    const guildLocale = interaction.guildLocale;
    const collectorData: GiveawayCollectorData = {
        reaction: "🎉",
        AllowedRoles: <string[]>[],
        LockedRoles: <string[]>[],
        AllowedMembers: <string[]>[],
        LockedMembers: <string[]>[],
        AddRoles: <string[]>[],
        MultJoinsRoles: new Map<string, RoleGiveaway>(),
        RequiredAllRoles: true
    };

    const giveawayReactionCollector: ReactionCollector = giveawayMessage.createReactionCollector({ filter: () => false, time: 1000 * 60 * 5 });
    const configurationReactionCollector: ReactionCollector = configurationMessage.createReactionCollector({ filter: (_, User) => User.id === interaction.user.id, time: 1000 * 60 * 5 });

    giveawayReactionCollector.once("end", giveawayReactionCollectorEnd);
    configurationReactionCollector.once("end", configurationReactionCollectorEnd);

    configurationReactionCollector.on("collect", async (reaction) => {
        configurationMessage.reactions.removeAll().catch(() => { });
        collectorData.reaction = reaction.emoji.id || reaction.emoji.name || collectorData.reaction;
        giveawayReactionCollector.stop("ignore");
        configurationReactionCollector.stop();
        await enableButtonCollector(interaction, configurationMessage, giveawayMessage, embed, collectorData, channel, GiveawayResetedData, color);
        return;
    });

    async function configurationReactionCollectorEnd(_: any, reason: string) {
        if (["user", "ignore"].includes(reason)) return;

        if (reason === "channelDelete") {
            giveawayReactionCollector.stop("ignore");
            GiveawayManager.deleteGiveawayFromDatabase(giveawayMessage.id, interaction.guildId);
            if (giveawayMessage?.channel)
                return giveawayMessage.channel.send({
                    content: t("giveaway.channel_deleted", { e, locale: guildLocale })
                }).catch(() => { });
        }

        if (reason === "messageDelete") {
            giveawayReactionCollector.stop("ignore");
            GiveawayManager.deleteGiveawayFromDatabase(giveawayMessage.id, interaction.guildId);
            giveawayMessage.delete().catch(() => { });
            return await interaction.channel?.send({
                content: t("giveaway.original_message_deleted", { e, locale })
            }).catch(() => { });
        }

        if (["time", "idle", "limit"].includes(reason)) {
            giveawayReactionCollector.stop("ignore");
            GiveawayManager.deleteGiveawayFromDatabase(giveawayMessage.id, interaction.guildId);
            giveawayMessage.delete().catch(() => { });
            configurationMessage.reactions.removeAll().catch(() => { });
            embed.color = Colors.Red;
            embed.description = t("giveaway.once_upon_a_time", guildLocale);

            if (embed.fields) {
                embed.fields[0].value = t("giveaway.emoji_not_choosen", guildLocale);
                embed.fields.push({
                    name: t("giveaway.a_long_time", guildLocale),
                    value: t("giveaway.a_long_time_ago", { e, locale: guildLocale })
                });
            }

            return configurationMessage.edit({ content: null, embeds: [embed] }).catch(() => { });
        }

        return console.log("End Reason Collector Listener Event in giveaway not used", reason);
    }

    async function giveawayReactionCollectorEnd(_: any, reason: string) {
        if (["user", "ignore"].includes(reason)) return;

        if (reason === "channelDelete") {
            configurationReactionCollector.stop("ignore");
            GiveawayManager.deleteGiveawayFromDatabase(giveawayMessage.id, interaction.guildId);
            if (configurationMessage?.channel)
                return configurationMessage.edit({
                    content: t("giveaway.giveaways_channel_vooosh", { e, locale }),
                    embeds: [], components: []
                }).catch(() => { });
        }

        if (reason === "messageDelete") {
            configurationReactionCollector.stop("ignore");
            GiveawayManager.deleteGiveawayFromDatabase(giveawayMessage.id, interaction.guildId);
            if (configurationMessage?.channel)
                return configurationMessage.edit({
                    content: t("giveaway.giveaways_message_deleted", { e, locale }),
                    embeds: [], components: []
                }).catch(() => { });
        }

        if (["time", "idle", "limit"].includes(reason)) return;

        return console.log("End Reason Collector Listener Event in giveaway not used", reason);
    }
}