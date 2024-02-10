import { ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Colors, Guild, GuildMember, GuildTextBasedChannel, LocaleString, Message, Collection, MessageCollector } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import { CollectorEnding } from "../../@types/commands";
import Database from "../../database";

export const channelsInGame = new Set<string>();

export class Battleroyale {
    players = {
        all: new Collection<string, GuildMember>(),
        alives: new Collection<string, GuildMember>(),
        deads: new Collection<string, GuildMember>()
    };
    respaws = 0;
    lowCases = 0;
    kills = {} as Record<string, number>;
    refreshing = false;
    started = false;
    refreshingMessage = false;
    cases = new Collection<number, number>();
    embedCases = [] as string[];
    messages = 0;
    declare messageCollector: MessageCollector | undefined;
    declare message: Message<true>;
    declare guild: Guild;
    declare locale: LocaleString;
    declare interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>;
    declare channel: GuildTextBasedChannel;
    declare authorId: string;
    declare gameMessage: Message<true>;

    constructor(interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>) {
        this.interactionOrMessage = interactionOrMessage;
        this.channel = interactionOrMessage.channel!;
        this.guild = interactionOrMessage.guild;
        this.locale = interactionOrMessage.guild.preferredLocale;
        this.authorId = interactionOrMessage instanceof ChatInputCommandInteraction ? interactionOrMessage.user.id : interactionOrMessage.author.id;
    }

    async load() {
        channelsInGame.add(this.channel?.id);

        for (let i = 0; i < ((t("battleroyale.cases"))?.length || 30); i++)
            this.cases.set(i, i);

        let error = false;
        this.message = await this.interactionOrMessage.reply({
            embeds: [{
                color: Colors.Blue,
                title: t("battleroyale.embeds.title", this.locale),
                description: t("battleroyale.enter_in_the_battle", { e, locale: this.locale }),
                fields: [
                    {
                        name: t("battleroyale.embeds.players", { e, locale: this.locale, players: 0 }),
                        value: t("battleroyale.any_player_join", { e, locale: this.locale })
                    }
                ]
            }],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("battleroyale.components.join", this.locale),
                            custom_id: "join",
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: t("battleroyale.components.leave", this.locale),
                            custom_id: "leave",
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: t("battleroyale.components.start", { locale: this.locale, players: 0 }),
                            custom_id: "start",
                            style: ButtonStyle.Success,
                            disabled: true
                        },
                        {
                            type: 2,
                            label: t("battleroyale.components.cancel", this.locale),
                            custom_id: "cancel",
                            style: ButtonStyle.Danger
                        }
                    ]
                }
            ].asMessageComponents(),
            fetchReply: true,
        })
            .catch(() => {
                error = true;
                channelsInGame.delete(this.channel.id);
                this.messageCollector?.stop();
                return this.message;
            });

        if (error) return;
        return this.enableCollector();
    }

    enableCollector() {
        const collector = this.message.createMessageComponentCollector({
            filter: () => true,
            idle: 1000 * 60
        })
            .on("collect", async (interaction: ButtonInteraction<"cached">): Promise<any> => {

                const { user, userLocale: locale, customId, member } = interaction;
                this.refreshInitialEmbed();

                if (customId === "start") {

                    if (user.id !== this.authorId)
                        return await interaction.reply({
                            content: t("battleroyale.components.you_cannot_start", { e, locale, authorId: this.authorId }),
                            ephemeral: true
                        });

                    await interaction.update({
                        embeds: [{
                            color: Colors.Blue,
                            title: t("battleroyale.embeds.title", this.locale),
                            description: `${t("battleroyale.components.start_button_press", { e, locale: this.locale })}`,
                            fields: [
                                {
                                    name: t("battleroyale.embeds.players", { e, locale: this.locale, players: this.players.all.size }),
                                    value: Array.from(this.players.all.values())
                                        .map(member => `👤 ${member}`)
                                        .join("\n").limit("MessageEmbedDescription")
                                        || `\n${t("battleroyale.any_player_join", { e, locale: this.locale })}`
                                }
                            ]
                        }],
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 2,
                                        label: t("battleroyale.components.started", this.locale),
                                        custom_id: "started",
                                        style: ButtonStyle.Secondary,
                                        disabled: true
                                    }
                                ]
                            }
                        ]
                    });
                    return collector.stop("user");
                }

                if (customId === "cancel") {
                    if (user.id !== this.authorId)
                        return await interaction.reply({
                            content: t("battleroyale.components.you_cannot_cancel", { e, locale, authorId: this.authorId }),
                            ephemeral: true
                        });
                    collector.stop("cancelled");
                    this.messageCollector?.stop();
                    return await this.message.delete().catch(() => { });
                }

                if (customId === "join") {
                    if (this.players.all.has(user.id))
                        return await interaction.reply({
                            content: t("battleroyale.components.you_already_in", { e, locale }),
                            ephemeral: true
                        });

                    this.players.all.set(user.id, member);
                    this.players.alives.set(user.id, member);
                    await interaction.reply({
                        content: t("battleroyale.components.you_just_join", { e, locale }),
                        ephemeral: true
                    });
                    if (this.players.all.size >= 30) {
                        this.started = true;
                        return await this.start();
                    }
                    return;
                }

                if (customId === "leave") {
                    if (!this.players.all.has(user.id))
                        return await interaction.reply({
                            content: t("battleroyale.components.you_already_out", { e, locale }),
                            ephemeral: true
                        });

                    this.players.all.delete(user.id);
                    this.players.alives.delete(user.id);
                    await interaction.reply({
                        content: t("battleroyale.components.you_just_leave", { e, locale }),
                        ephemeral: true
                    });
                    if (this.players.all.size >= 30) {
                        this.started = true;
                        return await this.start();
                    }
                    return;
                }

                return;
            })
            .on("end", async (_, reason: CollectorEnding): Promise<any> => {
                this.started = true;
                if (["time", "idle", "user"].includes(reason)) return await this.start();

                if (reason === "messageDelete")
                    await this.channel.send({
                        content: t("battleroyale.components.someone_deleted_the_message", { e, locale: this.locale })
                    }).catch(() => { });

                this.messageCollector?.stop();
                return channelsInGame.delete(this.channel.id);
            });
        return;
    }

    async refreshInitialEmbed() {

        if (this.refreshing || this.started || !this.players.all.size) return;

        this.refreshing = true;
        const fieldPlayerValue = Array.from(
            this.players.all.values()
        )
            .map(member => `👤 ${member}`)
            .join("\n")
            || `\n${t("battleroyale.any_player_join", { e, locale: this.locale })}`;

        return await this.message.edit({
            embeds: [{
                color: Colors.Blue,
                title: t("battleroyale.embeds.title", this.locale),
                description: `${t("battleroyale.enter_in_the_battle", { e, locale: this.locale })}`,
                fields: [
                    {
                        name: t("battleroyale.embeds.players", { e, locale: this.locale, players: this.players.all.size }),
                        value: fieldPlayerValue
                    }
                ]
            }],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("battleroyale.components.join", this.locale),
                            custom_id: "join",
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: t("battleroyale.components.leave", this.locale),
                            custom_id: "leave",
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: t("battleroyale.components.start", { locale: this.locale, players: this.players.all.size > 5 ? 5 : this.players.all.size }),
                            custom_id: "start",
                            style: ButtonStyle.Success,
                            disabled: this.players.all.size < 5
                        },
                        {
                            type: 2,
                            label: t("battleroyale.components.cancel", this.locale),
                            custom_id: "cancel",
                            style: ButtonStyle.Danger
                        }
                    ]
                }
            ].asMessageComponents(),
        })
            .then((): any => setTimeout(() => {
                this.refreshing = false;
                this.refreshInitialEmbed();
            }, 3000))
            .catch(() => {
                channelsInGame.delete(this.channel.id);
                this.messageCollector?.stop();
                return;
            });
    }

    enableMessageCollector() {
        this.messageCollector = this.channel.createMessageCollector({
            filter: () => false,
            time: (1000 * 60) * 2
        })
            .on("ignore", async (): Promise<any> => {
                if (this.refreshingMessage) return;
                this.messages++;

                if (this.messages > 7) {
                    this.refreshingMessage = true;
                    await this.gameMessage.delete().catch(() => { });
                    this.messages = 0;
                    this.refreshingMessage = false;
                    this.refreshGameMessage();
                }
                return;
            });
        return;
    }

    async start() {
        this.enableMessageCollector();

        // if (this.players.all.size < 5) {
        //     channelsInGame.delete(this.channel.id);
        //     this.messageCollector?.stop();
        //     return await this.message.edit({
        //         content: t("battleroyale.embeds.where_are_the_players", { e, locale: this.locale }),
        //         embeds: [], components: []
        //     })
        //         .catch(() => { });
        // }

        this.gameMessage = await this.channel.send({
            embeds: [{
                color: Colors.Blue,
                title: t("battleroyale.embeds.title", this.locale),
                description: t("battleroyale.embeds.starting", { e, locale: this.locale }),
                fields: [
                    {
                        name: t("battleroyale.embeds.status_lives_and_deads", this.locale),
                        value: t("battleroyale.embeds.lives_and_deads", { lives: this.players.alives.size, deads: this.players.deads.size })
                    }
                ]
            }]
        })
            .catch(() => {
                channelsInGame.delete(this.channel.id);
                this.messageCollector?.stop();
                return this.gameMessage;
            });

        setTimeout(async () => await this.roll(), 3500);
        return;
    }

    async roll() {

        if (this.players.alives.size === 1) return await this.finish();

        if (
            (Math.floor(Math.random() * (10 - 1) + 1)) > 6
            && this.lowCases < 5
        ) {
            const lowCase = Math.floor(Math.random() * (5 - 0));
            const playerId = this.players.alives.randomKey()!;
            const players = this.players.alives.clone();
            players.delete(playerId);
            const playerId1 = players.randomKey()!;
            this.embedCases.push(t(`battleroyale.lowCases.${lowCase}`, { locale: this.locale, player: `<@${playerId}>`, player1: `<@${playerId1}>` }));
            this.lowCases++;
            await this.refreshGameMessage();
            return;
        }

        if (
            this.players.deads.size > 3
            && this.respaws < 3
            && (Math.floor(Math.random() * (10 - 1) + 1)) > 6
        ) {
            const respawer = this.players.deads.random()!;
            this.players.deads.delete(respawer.id);
            this.players.alives.set(respawer.id, respawer);
            this.embedCases.push(t("battleroyale.respawned", { locale: this.locale, respawer: `<@${respawer.id}>` }));
            this.respaws++;
            await this.refreshGameMessage();
            return;
        }

        const dead = this.players.alives.random();
        if (!dead) return;

        this.players.alives.delete(dead.id);
        this.players.deads.set(dead.id, dead);

        const caseKey = this.cases.randomKey();
        if (caseKey === undefined) return;
        this.cases.delete(caseKey);

        const rawText = t(`battleroyale.cases.${caseKey}`, { locale: this.locale, guildName: this.guild.name });
        let text = "";

        if (rawText.includes("{player1}")) {
            const player1 = this.players.alives.random()!;
            text = rawText.replace("{player1}", `${player1?.toString()}`);
            this.kills[player1.user!.id] = (this.kills[player1.user!.id] || 0) + 1;
        }

        text = (text || rawText).replace("{player}", dead.toString());
        this.embedCases.push(text);
        await this.refreshGameMessage();
        return;
    }

    async refreshGameMessage() {
        if (this.refreshingMessage) return;
        return await this.gameMessage.edit(this.messagePayloadData)
            .then(() => setTimeout(() => this.roll(), 4500))
            .catch(async () => {
                return await this.channel.send(this.messagePayloadData)
                    .then(msg => {
                        this.gameMessage = msg;
                        return setTimeout(() => this.roll(), 4500);
                    })
                    .catch(() => {
                        channelsInGame.delete(this.channel.id);
                        this.messageCollector?.stop();
                        return;
                    });
            });
    }

    get messagePayloadData() {
        return {
            embeds: [{
                color: Colors.Blue,
                title: t("battleroyale.embeds.title", this.locale),
                description: this.embedCases.length > 20
                    ? this.embedCases.slice(-25).join("\n").limit("MessageEmbedDescription")
                    : this.embedCases.join("\n").limit("MessageEmbedDescription"),
                fields: [
                    {
                        name: t("battleroyale.embeds.status_lives_and_deads", this.locale),
                        value: t("battleroyale.embeds.lives_and_deads", { lives: this.players.alives.size, deads: this.players.deads.size })
                    }
                ]
            }]
        };
    }

    async finish() {

        channelsInGame.delete(this.channel.id);
        this.messageCollector?.stop();
        this.message.delete().catch(() => { });
        this.gameMessage.delete().catch(() => { });

        await this.channel.send({
            embeds: [
                {
                    color: Colors.Blue,
                    title: t("battleroyale.embeds.title", this.locale),
                    description: this.embedCases.length > 20
                        ? this.embedCases.slice(-25).join("\n").limit("MessageEmbedDescription")
                        : this.embedCases.join("\n").limit("MessageEmbedDescription"),
                    fields: [
                        {
                            name: t("battleroyale.embeds.status_lives_and_deads", this.locale),
                            value: t("battleroyale.embeds.lives_and_deads", { lives: this.players.alives.size, deads: this.players.deads.size })
                        }
                    ]
                },
                {
                    color: Colors.Blue,
                    title: t("battleroyale.embeds.title", this.locale),
                    description: t("battleroyale.embeds.finish", { e, locale: this.locale }).limit("MessageEmbedDescription"),
                    fields: [
                        {
                            name: t("battleroyale.embeds.players", { e, locale: this.locale, players: this.players.all.size }),
                            value: Array.from(
                                this.players.all.values()
                            )
                                .map(member => `${this.players.alives.has(member.id) ? "👑" : "💀"}${member} ${this.kills[member.id] ? ` - ${this.kills[member.id]} Kills` : ""}`)
                                .join("\n")
                                .limit("MessageEmbedDescription")
                                || `\n${t("battleroyale.any_player_join", { e, locale: this.locale })}`
                        }
                    ]
                }
            ]
        }).catch(() => { });

        return await this.save();
    }

    async save() {

        for await (const player of this.players.all.toJSON())
            await Database.Battleroyale.updateOne(
                { id: player.id },
                {
                    $set: {
                        username: player.user.username || "Name not found"
                    },
                    $inc: {
                        deaths: this.players.deads.has(player.id) ? 1 : 0,
                        kills: (this.kills[player.id] || 0),
                        matches: 1,
                        wins: this.players.alives.has(player.id) ? 1 : 0
                    }
                },
                { upsert: true }
            );

    }
}