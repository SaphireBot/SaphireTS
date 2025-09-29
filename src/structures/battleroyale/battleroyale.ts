import {
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    Colors,
    Guild,
    GuildMember,
    GuildTextBasedChannel,
    Message,
    Collection,
    MessageCollector,
    MessageFlags,
} from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import { CollectorReasonEnd } from "../../@types/commands";
import Database from "../../database";
import { ChannelsInGame, KeyOfLanguages, LocaleString } from "../../util/constants";
import client from "../../saphire";
import { BattleroyalePhrasesManager } from "../../managers";

export const phrases = new Set();

export class Battleroyale {
    players = {
        all: new Collection<string, GuildMember>(),
        alives: new Collection<string, GuildMember>(),
        deads: new Collection<string, GuildMember>(),
    };
    ended = false;
    respawns = 0;
    lowCasesCount = 0;
    minPlayers = 5;
    kills = {} as Record<string, number>;
    refreshing = false;
    started = false;
    refreshingMessage = false;
    cases = new Collection<string, string>();
    lowCases = new Collection<string, string>();
    embedCases = [] as string[];
    messages = 0;
    error: boolean = false;
    declare messageCollector: MessageCollector | undefined;
    declare message: Message<boolean> | null | undefined;
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

    async load() {
        ChannelsInGame.add(this.channel?.id);

        const { cases, lowCases } = BattleroyalePhrasesManager.phrases;
        this.cases = cases;
        this.lowCases = lowCases;

        const payload = {
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
            components: this.initialComponents,
        };

        if (this.interactionOrMessage instanceof ChatInputCommandInteraction)
            this.message = await this.interactionOrMessage.reply({
                ...payload,
                withResponse: true,
            })
                .then(res => res.resource?.message)
                .catch(this.catch);

        if (this.interactionOrMessage instanceof Message)
            this.message = await this.interactionOrMessage.reply(payload)
                .catch(this.catch);

        if (this.error) return this.clear();
        return this.enableCollector();
    }

    get initialComponents() {
        return [
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
                        label: t("battleroyale.components.start", {
                            locale: this.locale,
                            players: this.players.all.size > this.minPlayers ? this.minPlayers : this.minPlayers,
                        }),
                        custom_id: "start",
                        style: ButtonStyle.Success,
                        disabled: this.players.all.size < this.minPlayers,
                    },
                    {
                        type: 2,
                        label: t("battleroyale.components.list", this.locale),
                        custom_id: JSON.stringify({ c: "battleroyale", src: "list" }),
                        style: ButtonStyle.Primary,
                        // disabled: true,
                    },
                    {
                        type: 2,
                        label: t("battleroyale.components.cancel", this.locale),
                        custom_id: "cancel",
                        style: ButtonStyle.Danger,
                    },
                ],
            },
        ].asMessageComponents();
    }

    catch() {
        this.error = true;
        ChannelsInGame.delete(this.channel.id);
        this.messageCollector?.stop();
        return this.message;
    }

    enableCollector() {
        if (this.error) return this.clear();
        const collector = this.message?.createMessageComponentCollector({
            filter: () => true,
            idle: 1000 * 60,
        })
            .on("collect", async (interaction: ButtonInteraction<"cached">): Promise<any> => {

                const { user, userLocale: locale, customId } = interaction;
                this.refreshInitialEmbed();

                if (customId === "start") {

                    if (user.id !== this.authorId)
                        return await interaction.reply({
                            content: t("battleroyale.components.you_cannot_start", { e, locale, authorId: this.authorId }),
                            flags: [MessageFlags.Ephemeral],
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
                            flags: [MessageFlags.Ephemeral],
                        });
                    collector?.stop("cancelled");
                    return this.clear();
                }

                if (customId === "join") return this.joinOrLeave(interaction);

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

    async joinOrLeave(interaction: ButtonInteraction<"cached">) {

        const { user, userLocale: locale, member } = interaction;

        if (this.players.all.has(user.id)) {

            this.players.all.delete(user.id);
            this.players.alives.delete(user.id);
            await interaction.reply({
                content: t("battleroyale.components.you_just_leave", { e, locale }),
                flags: [MessageFlags.Ephemeral],
            });
            if (this.players.all.size >= 30) {
                this.started = true;
                return await this.start();
            }
            return;
        }

        this.players.all.set(user.id, member);
        this.players.alives.set(user.id, member);
        await interaction.reply({
            content: t("battleroyale.components.you_just_join", { e, locale }),
            flags: [MessageFlags.Ephemeral],
        });
        if (this.players.all.size >= 30) {
            this.started = true;
            return await this.start();
        }
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
            components: this.initialComponents,
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

        if (this.players.all.size < this.minPlayers) {
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
        if (this.ended) return await this.clear();

        if (this.players.alives.size === 1) return await this.finish();

        // Há 3 regras para acontecer uma frase sem morte
        if (
            // Há 30% de chance de uma frase sem morte ser lançada
            (Math.floor(Math.random() * (10 - 1) + 1)) > 6
            // Há um limite de 10 frases sem morte
            && this.lowCasesCount < 10
            // Para acontecer uma frase sem morte, tem que haver pelo menos 3 jogadores vivos
            && this.players.alives.size >= 4
        ) {

            const key = this.lowCases.randomKey()!;
            if (!key) return await this.clear();

            const lowCaseText = this.lowCases.get(key)!;
            this.lowCases.delete(key);

            const players = this.players.alives.clone();

            const player = players.random()!;
            players.delete(player?.id);

            const player1 = players.random()!;
            players.delete(player1?.id);

            const player2 = players.random()!;
            players.delete(player2?.id);

            const player3 = players.random()!;
            players.delete(player3?.id);

            const text = lowCaseText
                .replace("{bot}", client.user!.username)
                .replace("{player}", player.toString())
                .replace("{player1}", player1.toString())
                .replace("{player2}", player2.toString())
                .replace("{player3}", player3.toString())
                .replace("{guild}", this.guild.name);

            this.embedCases.push(text);
            this.lowCasesCount++;
            return await this.refreshGameMessage();
        }

        // Há 3 regras para a Saphire reviver um player
        if (
            // Deve haver mais de 3 mortes
            this.players.deads.size > 3
            // Não pode ultrapassar de 5 players revividos
            && this.respawns < 5
            // Há 40% de chance dela reviver alguém
            && (Math.floor(Math.random() * (10 - 1) + 1)) > 5
        ) {
            const respawer = this.players.deads.random()!;
            this.players.deads.delete(respawer.id);
            this.players.alives.set(respawer.id, respawer);
            this.embedCases.push(t("battleroyale.respawned", { locale: this.locale, respawer: respawer.toString() }));
            this.respawns++;
            return await this.refreshGameMessage();
        }

        // O morto é escolhido aleatóriamente dentre os vivos
        const dead = this.players.alives.random()!;
        if (!dead) return await this.clear();

        // O morto é retirado dos vivos
        this.players.alives.delete(dead.id);
        // O morto é adicionado aos mortos
        this.players.deads.set(dead.id, dead);

        // Frase escolhida aleatóriamente
        const randomKey = this.cases.randomKey();
        if (!randomKey) return await this.clear();
        // Frase é removida para não ser repetida
        const rawText = this.cases.get(randomKey)!;
        this.cases.delete(randomKey);

        // Pegamos a mensagem original
        let text = rawText
            .replace("{guild}", this.guild.name)
            .replace("{bot}", client.user?.username || "")

            // {player} é quem morre
            .replace("{player}", dead.toString());;

        // {player1} é um player adicional, ele é quem mata
        if (rawText.includes("{player1}")) {
            const player1 = this.players.alives.random()!;
            text = rawText.replace("{player1}", player1.toString());
            this.kills[player1.user!.id] = (this.kills[player1.user!.id] || 0) + 1;
        }

        // {player} é quem morre
        text = (text || rawText).replace("{player}", dead.toString());
        this.embedCases.push(text);
        // Atualiza a embed e inicia um novo ciclo
        return await this.refreshGameMessage();
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

    async clear() {
        ChannelsInGame.delete(this.channel.id);
        this.messageCollector?.stop();
        await this.message?.delete().catch(() => { });
        await this.gameMessage?.delete().catch(() => { });
    }

    async finish() {
        this.ended = true;
        await this.clear();
        await sleep(1500);

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
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("battleroyale.components.list", this.locale),
                            custom_id: JSON.stringify({ c: "battleroyale", src: "list" }),
                            style: ButtonStyle.Primary,
                            // disabled: true,
                        },
                    ],
                },
            ].asMessageComponents(),
        }).catch(() => { });

        return await this.save();
    }

    async save() {

        for await (const player of this.players.all.toJSON())
            await Database.Battleroyales.updateOne(
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