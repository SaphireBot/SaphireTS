import { ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Colors, Guild, GuildMember, GuildTextBasedChannel, LocaleString, Message, Collection, MessageCollector } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import { CollectorReasonEnd } from "../../@types/commands";
import Database from "../../database";
import { ChannelsInGame, KeyOfLanguages } from "../../util/constants";
import client from "../../saphire";

export class Battleroyale {
    players = {
        all: new Collection<string, GuildMember>(),
        alives: new Collection<string, GuildMember>(),
        deads: new Collection<string, GuildMember>(),
    };
    ended = false;
    respaws = 0;
    lowCasesCount = 0;
    kills = {} as Record<string, number>;
    refreshing = false;
    started = false;
    refreshingMessage = false;
    cases = new Collection<number, number>();
    lowCases = new Collection<number, number>();
    embedCases = [] as string[];
    messages = 0;
    declare messageCollector: MessageCollector | undefined;
    declare message: Message<true> | undefined;
    declare guild: Guild;
    declare _locale: LocaleString;
    declare interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>;
    declare channel: GuildTextBasedChannel;
    declare authorId: string;
    declare gameMessage: Message<true> | undefined;

    constructor(interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>) {
        this.interactionOrMessage = interactionOrMessage;
        this.channel = interactionOrMessage.channel!;
        this.guild = interactionOrMessage.guild;
        this.authorId = interactionOrMessage instanceof ChatInputCommandInteraction ? interactionOrMessage.user.id : interactionOrMessage.author.id;
    }

    get locale(): LocaleString {

        if (this._locale) return this._locale;

        if (this.interactionOrMessage instanceof Message)
            for (const arg of this.interactionOrMessage.content?.split(" ") || [] as string[])
                if (KeyOfLanguages[arg as keyof typeof KeyOfLanguages]) {
                    this._locale = KeyOfLanguages[arg as keyof typeof KeyOfLanguages] as LocaleString;
                    return this._locale;
                }

        if (this.interactionOrMessage instanceof ChatInputCommandInteraction) {

            const fromAutocomplete = this.interactionOrMessage.options.getString("language") as LocaleString;
            if (KeyOfLanguages[fromAutocomplete as keyof typeof KeyOfLanguages]) {
                this._locale = KeyOfLanguages[fromAutocomplete as keyof typeof KeyOfLanguages] as LocaleString;
                return this._locale;
            }

            if (KeyOfLanguages[this.interactionOrMessage.guild?.preferredLocale as keyof typeof KeyOfLanguages]) {
                this._locale = KeyOfLanguages[this.interactionOrMessage.guild?.preferredLocale as keyof typeof KeyOfLanguages] as LocaleString;
                return this._locale;
            }

            this._locale = client.defaultLocale as LocaleString;;
            return this._locale;
        }

        this._locale = KeyOfLanguages[
            (
                this.interactionOrMessage.guild?.preferredLocale
                || this.interactionOrMessage.userLocale
                || client.defaultLocale
            ) as keyof typeof KeyOfLanguages
        ] as LocaleString;

        if (!KeyOfLanguages[this._locale as keyof typeof KeyOfLanguages])
            this._locale = client.defaultLocale as "pt-BR";

        return this._locale;
    }

    get lowCasesLength() {
        // @ts-expect-error ignore
        return (t("battleroyale.lowCases", this.locale) as any[])?.length;
    }

    async load() {
        ChannelsInGame.add(this.channel?.id);

        for (let i = 0; i < ((t("battleroyale.cases"))?.length || 30); i++)
            this.cases.set(i, i);

        for (let i = 0; i < ((t("battleroyale.lowCases"))?.length || 20); i++)
            this.lowCases.set(i, i);

        let error = false;
        this.message = await this.interactionOrMessage.reply({
            embeds: [{
                color: Colors.Blue,
                title: t("battleroyale.embeds.title", this.locale),
                description: t("battleroyale.enter_in_the_battle", { e, locale: this.locale }),
                fields: [
                    {
                        name: t("battleroyale.embeds.players", { e, locale: this.locale, players: 0 }),
                        value: t("battleroyale.any_player_join", { e, locale: this.locale }),
                    },
                ],
            }],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("battleroyale.components.join", this.locale),
                            custom_id: "join",
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: 2,
                            label: t("battleroyale.components.leave", this.locale),
                            custom_id: "leave",
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: 2,
                            label: t("battleroyale.components.start", { locale: this.locale, players: 0 }),
                            custom_id: "start",
                            style: ButtonStyle.Success,
                            disabled: true,
                        },
                        {
                            type: 2,
                            label: t("battleroyale.components.cancel", this.locale),
                            custom_id: "cancel",
                            style: ButtonStyle.Danger,
                        },
                    ],
                },
            ].asMessageComponents(),
            fetchReply: true,
        })
            .catch(() => {
                error = true;
                ChannelsInGame.delete(this.channel.id);
                this.messageCollector?.stop();
                return this.message;
            });

        if (error) return;
        return this.enableCollector();
    }

    enableCollector() {
        const collector = this.message?.createMessageComponentCollector({
            filter: () => true,
            idle: 1000 * 60,
        })
            .on("collect", async (interaction: ButtonInteraction<"cached">): Promise<any> => {

                const { user, userLocale: locale, customId, member } = interaction;
                this.refreshInitialEmbed();

                if (customId === "start") {

                    if (user.id !== this.authorId)
                        return await interaction.reply({
                            content: t("battleroyale.components.you_cannot_start", { e, locale, authorId: this.authorId }),
                            ephemeral: true,
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
                                        .join("\n").limit("EmbedDescription")
                                        || `\n${t("battleroyale.any_player_join", { e, locale: this.locale })}`,
                                },
                            ],
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
                                        disabled: true,
                                    },
                                ],
                            },
                        ],
                    });
                    return collector?.stop("user");
                }

                if (customId === "cancel") {
                    if (user.id !== this.authorId)
                        return await interaction.reply({
                            content: t("battleroyale.components.you_cannot_cancel", { e, locale, authorId: this.authorId }),
                            ephemeral: true,
                        });
                    collector?.stop("cancelled");
                    this.messageCollector?.stop();
                    return await this.message?.delete().catch(() => { });
                }

                if (customId === "join") {
                    if (this.players.all.has(user.id))
                        return await interaction.reply({
                            content: t("battleroyale.components.you_already_in", { e, locale }),
                            ephemeral: true,
                        });

                    this.players.all.set(user.id, member);
                    this.players.alives.set(user.id, member);
                    await interaction.reply({
                        content: t("battleroyale.components.you_just_join", { e, locale }),
                        ephemeral: true,
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
                            ephemeral: true,
                        });

                    this.players.all.delete(user.id);
                    this.players.alives.delete(user.id);
                    await interaction.reply({
                        content: t("battleroyale.components.you_just_leave", { e, locale }),
                        ephemeral: true,
                    });
                    if (this.players.all.size >= 30) {
                        this.started = true;
                        return await this.start();
                    }
                    return;
                }

                return;
            })
            .on("end", async (_, reason: CollectorReasonEnd): Promise<any> => {
                this.started = true;
                if (["time", "idle", "user"].includes(reason)) return await this.start();

                if (reason === "messageDelete")
                    await this.channel.send({
                        content: t("battleroyale.components.someone_deleted_the_message", { e, locale: this.locale }),
                    }).catch(() => { });

                this.messageCollector?.stop();
                return ChannelsInGame.delete(this.channel.id);
            });
        return;
    }

    async refreshInitialEmbed() {

        if (this.ended || this.refreshing || this.started || !this.players.all.size) return;

        this.refreshing = true;
        const fieldPlayerValue = Array.from(
            this.players.all.values(),
        )
            .map(member => `👤 ${member}`)
            .join("\n")
            || `\n${t("battleroyale.any_player_join", { e, locale: this.locale })}`;

        if (this.ended) return;
        return await this.message?.edit({
            embeds: [{
                color: Colors.Blue,
                title: t("battleroyale.embeds.title", this.locale),
                description: `${t("battleroyale.enter_in_the_battle", { e, locale: this.locale })}`,
                fields: [
                    {
                        name: t("battleroyale.embeds.players", { e, locale: this.locale, players: this.players.all.size }),
                        value: fieldPlayerValue,
                    },
                ],
            }],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("battleroyale.components.join", this.locale),
                            custom_id: "join",
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: 2,
                            label: t("battleroyale.components.leave", this.locale),
                            custom_id: "leave",
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: 2,
                            label: t("battleroyale.components.start", { locale: this.locale, players: this.players.all.size > 5 ? 5 : this.players.all.size }),
                            custom_id: "start",
                            style: ButtonStyle.Success,
                            disabled: this.players.all.size < 5,
                        },
                        {
                            type: 2,
                            label: t("battleroyale.components.cancel", this.locale),
                            custom_id: "cancel",
                            style: ButtonStyle.Danger,
                        },
                    ],
                },
            ].asMessageComponents(),
        })
            .then((): any => setTimeout(() => {
                this.refreshing = false;
                this.refreshInitialEmbed();
            }, 3000))
            .catch(() => {
                ChannelsInGame.delete(this.channel.id);
                this.messageCollector?.stop();
                return;
            });
    }

    enableMessageCollector() {
        this.messageCollector = this.channel.createMessageCollector({
            filter: () => false,
            time: (1000 * 60) * 2,
        })
            .on("ignore", async (): Promise<any> => {
                if (this.refreshingMessage || this.ended) return;
                this.messages++;

                if (this.messages > 7) {
                    this.refreshingMessage = true;
                    await this.gameMessage?.delete().catch(() => { });
                    this.messages = 0;
                    this.refreshingMessage = false;
                    this.refreshGameMessage();
                    return;
                }
                return;
            });
        return;
    }

    async start() {

        if (this.players.all.size < 5) {
            ChannelsInGame.delete(this.channel.id);
            this.messageCollector?.stop();
            this.message?.delete().catch(() => { });
            this.gameMessage?.delete().catch(() => { });
            if (this.ended) return;
            return await this.channel.send({
                content: t("battleroyale.embeds.where_are_the_players", { e, locale: this.locale }),
                embeds: [], components: [],
            })
                .catch(() => { });
        }

        if (this.ended) return;
        this.gameMessage = await this.channel.send({
            embeds: [{
                color: Colors.Blue,
                title: t("battleroyale.embeds.title", this.locale),
                description: t("battleroyale.embeds.starting", { e, locale: this.locale }),
                fields: [
                    {
                        name: t("battleroyale.embeds.status_lives_and_deads", this.locale),
                        value: t("battleroyale.embeds.lives_and_deads", { lives: this.players.alives.size, deads: this.players.deads.size }),
                    },
                ],
            }],
        })
            .then(msg => {
                this.enableMessageCollector();
                setTimeout(async () => await this.roll(), 3500);
                return msg;
            })
            .catch(() => {
                ChannelsInGame.delete(this.channel.id);
                this.messageCollector?.stop();
                return this.gameMessage;
            });

        return;
    }

    async roll() {
        // Se o jogo já foi finalizado, o ciclo de rolagens é encerrado
        if (this.ended) return;

        if (this.players.alives.size === 1) return await this.finish();

        // Há 3 regras para acontecer uma frase sem morte
        if (
            // Há 30% de chance de uma frase sem morte ser lançada
            (Math.floor(Math.random() * (10 - 1) + 1)) > 6
            // Há um limite de 10 frases sem morte
            && this.lowCasesCount < 10
            // Para acontecer uma frase sem morte, tem que haver pelo menos 3 jogadores vivos
            && this.players.alives.size >= 3
        ) {

            const key = this.lowCases.randomKey()!;
            if (!key) return;
            let text = t(`battleroyale.lowCases.${key}`, this.locale)!;
            this.lowCases.delete(key);

            const players = this.players.alives.clone();
           
            const playerId = players.randomKey()!;
            players.delete(playerId);
           
            const playerId1 = players.randomKey()!;
            players.delete(playerId1);
            
            const playerId2 = players.randomKey()!;

            text = text.replace("{{player}}", `<@${playerId}>`)
                .replace("{{player1}}", `<@${playerId1}>`)
                .replace("{{player2}}", `<@${playerId2}>`);

            this.embedCases.push(text);

            this.lowCasesCount++;
            await this.refreshGameMessage();
            return;
        }

        // Há 3 regras para a Saphire reviver um player
        if (
            // Deve haver mais de 3 mortes
            this.players.deads.size > 3
            // Não pode ultrapassar de 5 players revividos
            && this.respaws < 5
            // Há 40% de chance dela reviver alguém
            && (Math.floor(Math.random() * (10 - 1) + 1)) > 5
        ) {
            const respawer = this.players.deads.random()!;
            this.players.deads.delete(respawer.id);
            this.players.alives.set(respawer.id, respawer);
            this.embedCases.push(t("battleroyale.respawned", { locale: this.locale, respawer: `<@${respawer.id}>` }));
            this.respaws++;
            await this.refreshGameMessage();
            return;
        }

        // O morto é escolhido aleatóriamente dentre os vivos
        const dead = this.players.alives.random()!;
        if (!dead) return;

        // O morto é retirado dos vivos
        this.players.alives.delete(dead.id);
        // O morto é adicionado aos mortos
        this.players.deads.set(dead.id, dead);

        // Frase escolhida aleatóriamente
        const caseKey = this.cases.randomKey();
        if (caseKey === undefined) return;
        // Frase é removida para não ser repetida
        this.cases.delete(caseKey);

        // Pegamos a mensagem original
        const rawText = t(`battleroyale.cases.${caseKey}`, { locale: this.locale, guildName: this.guild.name });
        let text = "";

        // {player1} é um player adicional, ele é quem mata
        if (rawText.includes("{player1}")) {
            const player1 = this.players.alives.random()!;
            text = rawText.replace("{player1}", `${player1?.toString()}`);
            this.kills[player1.user!.id] = (this.kills[player1.user!.id] || 0) + 1;
        }

        // {player} é quem morre
        text = (text || rawText).replace("{player}", dead.toString());
        this.embedCases.push(text);
        // Atualiza a embed e inicia um novo ciclo
        await this.refreshGameMessage();
        return;
    }

    async refreshGameMessage() {
        if (this.refreshingMessage || this.ended) return;
        return await this.gameMessage?.edit(this.messagePayloadData)
            .then(() => setTimeout(() => this.roll(), 4500))
            .catch(async () => {
                if (this.ended) return;
                return await this.channel.send(this.messagePayloadData)
                    .then(msg => {
                        this.gameMessage = msg;
                        return setTimeout(() => this.roll(), 4500);
                    })
                    .catch(() => {
                        ChannelsInGame.delete(this.channel.id);
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
                    ? this.embedCases.slice(-25).join("\n").limit("EmbedDescription")
                    : this.embedCases.join("\n").limit("EmbedDescription"),
                fields: [
                    {
                        name: t("battleroyale.embeds.status_lives_and_deads", this.locale),
                        value: t("battleroyale.embeds.lives_and_deads", { lives: this.players.alives.size, deads: this.players.deads.size }),
                    },
                ],
            }],
        };
    }

    async finish() {
        this.ended = true;

        ChannelsInGame.delete(this.channel.id);
        this.messageCollector?.stop();
        this.message?.delete().catch(() => { });
        this.gameMessage?.delete().catch(() => { });

        await this.channel.send({
            embeds: [
                this.messagePayloadData.embeds[0],
                {
                    color: Colors.Blue,
                    title: t("battleroyale.embeds.title", this.locale),
                    description: t("battleroyale.embeds.finish", { e, locale: this.locale }).limit("EmbedDescription"),
                    fields: [
                        {
                            name: t("battleroyale.embeds.players", { e, locale: this.locale, players: this.players.all.size }),
                            value: Array.from(
                                this.players.all.values(),
                            )
                                .map(member => `${this.players.alives.has(member.id) ? "👑" : "💀"}${member} ${this.kills[member.id] ? ` - ${this.kills[member.id]} Kills` : ""}`)
                                .join("\n")
                                .limit("EmbedDescription")
                                || `\n${t("battleroyale.any_player_join", { e, locale: this.locale })}`,
                        },
                    ],
                },
            ],
        }).catch(() => { });

        return await this.save();
    }

    async save() {

        for await (const player of this.players.all.toJSON())
            await Database.Battleroyale.updateOne(
                { id: player.id },
                {
                    $set: {
                        username: player.user.username || "Name not found",
                    },
                    $inc: {
                        deaths: this.players.deads.has(player.id) ? 1 : 0,
                        kills: (this.kills[player.id] || 0),
                        matches: 1,
                        wins: this.players.alives.has(player.id) ? 1 : 0,
                    },
                },
                { upsert: true },
            );

        return;
    }
}