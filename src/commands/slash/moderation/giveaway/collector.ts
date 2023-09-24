import { APIEmbed, CategoryChannel, ChatInputCommandInteraction, Colors, ForumChannel, Message, NewsChannel, PrivateThreadChannel, PublicThreadChannel, ReactionCollector, StageChannel, TextChannel, VoiceChannel } from "discord.js";
// import Database from "../../../../database";
import { e } from "../../../../util/json";
import enableButtonCollector from "./enableCollectors";
import { GiveawayCollectorData, RoleGiveaway } from "../../../../@types/commands";
import { GiveawayType } from "../../../../@types/models";
import { GiveawayManager } from "../../../../managers";

export default async function collectReactionAndStartGiveawayConfiguration(
    interaction: ChatInputCommandInteraction<"cached">,
    configurationMessage: Message<true>,
    giveawayMessage: Message<true>,
    embed: APIEmbed,
    channel: CategoryChannel | NewsChannel | StageChannel | TextChannel | PrivateThreadChannel | PublicThreadChannel<boolean> | VoiceChannel | ForumChannel | null | undefined,
    GiveawayResetedData?: GiveawayType,
    color?: number | undefined
) {

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

    configurationReactionCollector.on("collect", (reaction) => {
        configurationMessage.reactions.removeAll().catch(() => { });
        collectorData.reaction = reaction.emoji.id || reaction.emoji.name || collectorData.reaction;
        giveawayReactionCollector.stop("ignore");
        enableButtonCollector(interaction, configurationMessage, giveawayMessage, embed, collectorData, channel, GiveawayResetedData, color);
        return configurationReactionCollector.stop();
    });

    async function configurationReactionCollectorEnd(_: any, reason: string) {
        if (["user", "ignore"].includes(reason)) return;

        if (reason === "channelDelete") {
            giveawayReactionCollector.stop("ignore");
            GiveawayManager.deleteGiveawayFromDatabase(giveawayMessage.id, interaction.guildId);
            if (giveawayMessage?.channel)
                return giveawayMessage.channel.send({
                    content: `${e.SaphireWhat} | O canal inteiro onde o sorteio estava sendo montado, **SUMIU**${e.Animated.SaphirePanic}. Só vim aqui dizer que o sorteio que estava sendo montado foi cancelado, ok?${e.Animated.SaphireCry}`
                }).catch(() => { });
        }

        if (reason === "messageDelete") {
            giveawayReactionCollector.stop("ignore");
            GiveawayManager.deleteGiveawayFromDatabase(giveawayMessage.id, interaction.guildId);
            giveawayMessage.delete().catch(() => { });
            return interaction.channel?.send({
                content: `${e.Animated.SaphireCry} | A mensagem original foi deletada e eu nunca mais vou conseguir completar o sorteio.`
            }).catch(() => { });
        }

        if (["time", "idle", "limit"].includes(reason)) {
            giveawayReactionCollector.stop("ignore");
            GiveawayManager.deleteGiveawayFromDatabase(giveawayMessage.id, interaction.guildId);
            giveawayMessage.delete().catch(() => { });
            configurationMessage.reactions.removeAll().catch(() => { });
            embed.color = Colors.Red;
            embed.description = "Beleza, estava tudo certo até aqui";

            if (embed.fields) {
                embed.fields[0].value = `${e.DenyX} Emoji não escolhido`;
                embed.fields.push({
                    name: "⏱️ O Tempo Passou",
                    value: `Se passou muitas eras e eu cai em um sono profundo...\n${e.Animated.SaphireSleeping} Cancelei o sorteio, beleza?`
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
                    content: `${e.SaphireWhat} | O canal onde o sorteio foi enviado SUMIU. Ele foi deletado, então, eu cancelei o sorteio.`,
                    embeds: [], components: []
                }).catch(() => { });
        }

        if (reason === "messageDelete") {
            configurationReactionCollector.stop("ignore");
            GiveawayManager.deleteGiveawayFromDatabase(giveawayMessage.id, interaction.guildId);
            if (configurationMessage?.channel)
                return configurationMessage.edit({
                    content: `${e.SaphireWhat} | A mensagem original do sorteio foi deletada. Que coisinha chata...`,
                    embeds: [], components: []
                }).catch(() => { });
        }

        if (["time", "idle", "limit"].includes(reason)) return;

        return console.log("End Reason Collector Listener Event in giveaway not used", reason);
    }
}
