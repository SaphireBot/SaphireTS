import { APIEmbed, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Collection, Colors, ComponentType, LocaleString, Message, User } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
const emojis = ["🐍", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🙈", "🐵", "🐸", "🐨", "🐒", "🦁", "🐯", "🐮", "🐔", "🐧", "🐦", "🐤", "🦄", "🐴", "🐗", "🐺", "🦇", "🦉", "🦅", "🦤", "🦆", "🐛", "🦋", "🐌", "🐝", "🪳", "🪲", "🦗", "🦂", "🐢"];

export default class BattleRoyale {
    players = {
        all: new Collection<string, string>(),
        dead: new Set<string>(),
        alive: new Set<string>(),
        voted: new Set<string>()
    };
    ids = new Map<string, string>();
    votes = {} as Record<string, number>;
    started = false;
    editing = false;
    emojis = new Set(emojis);
    declare locale: string;
    declare message: Message | undefined;
    declare interaction: ChatInputCommandInteraction<"cached"> | Message<true>;
    declare creator: User;
    declare collector: any;
    declare embed: APIEmbed;
    constructor(interaction: ChatInputCommandInteraction<"cached"> | Message<true>) {
        this.interaction = interaction;
        this.locale = interaction.guild?.preferredLocale || "pt-BR";
        this.creator = "author" in interaction ? interaction.author : interaction.user;
        this.embed = {
            color: Colors.Blue,
            title: t("battleroyale.embed.title", this.locale),
            fields: [
                {
                    name: t("battleroyale.embed.fields.0.name", { e, locale: this.locale }),
                    value: t("battleroyale.embed.fields.0.value", { e, locale: this.locale })
                }
            ]
        };
    }

    async load() {

        this.message = await this.interaction.reply({
            content: t("battleroyale.initing", { e, locale: this.locale, user: this.creator.displayName }),
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("battleroyale.buttons.participate", this.locale),
                            custom_id: "join",
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: t("battleroyale.buttons.leave", this.locale),
                            custom_id: "leave",
                            style: ButtonStyle.Danger
                        },
                        {
                            type: 2,
                            label: t("battleroyale.buttons.start", this.locale),
                            custom_id: "start",
                            style: ButtonStyle.Success
                        }
                    ]
                }
            ],
            fetchReply: true
        }).catch(() => undefined);

        if (!this.message) return;

        const collector = this.message.createMessageComponentCollector({
            filter: () => true,
            time: 1000 * 60,
            componentType: ComponentType.Button
        })
            .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

                const { customId, user } = int;
                const locale = await user.locale() || "en-US";

                if (customId === "join") return await this.join(int, user, locale);
                if (customId === "leave") return await this.leave(int, user, locale);

                if (customId === "start") {

                    if (user.id !== this.creator.id)
                        return await int.reply({
                            content: t("battleroyale.you_cannot_start", { e, locale }),
                            ephemeral: true
                        });

                    collector.stop("ignore");
                    return this.start(int);
                }

                return;
            })
            .on("end", async (_, reason: string): Promise<any> => {
                if (reason === "ignore") return;

                if (["channelDelete", "messageDelete", "guildDelete"].includes(reason))
                    return this.message = undefined;

                if (["limit", "time"].includes(reason)) return await this.start();
                return console.log("unknown reason #12151", reason);
            });

        return;
    }

    async join(int: ButtonInteraction<"cached">, user: User, locale: LocaleString) {

        if (this.players.all.size >= 25) return;

        if (this.players.all.has(user.id))
            return await int.reply({
                content: t("battleroyale.you_already_in", { e, locale }),
                ephemeral: true
            });

        const emoji = Array.from(this.emojis).random();
        this.emojis.delete(emoji);
        this.players.all.set(user.id, emoji);
        this.players.alive.add(user.id);
        this.ids.set(emoji, user.id);
        this.edit(true);
        await int.reply({
            content: t("battleroyale.joined", { e, locale, emoji }),
            ephemeral: true
        });
        if (this.players.all.size >= 25) return await this.start(int);
        return;
    }

    async leave(int: ButtonInteraction<"cached">, user: User, locale: LocaleString) {

        if (!this.players.all.has(user.id))
            return await int.reply({
                content: t("battleroyale.you_are_not_in", { e, locale }),
                ephemeral: true
            });

        const emoji = this.players.all.get(user.id);
        if (emoji) this.emojis.add(emoji);
        this.players.all.delete(user.id);
        this.players.alive.delete(user.id);
        this.ids.delete(user.id);
        this.edit(true);
        return await int.reply({
            content: t("battleroyale.exited", { e, locale }),
            ephemeral: true
        });
    }

    async start(int?: ButtonInteraction<"cached">) {
        if (!this.message || this.started) return;
        this.started = true;

        if (this.players.all.size < 3) {
            const data = { content: t("battleroyale.insufficient_players", { e, locale: this.locale }), embeds: [], components: [] };
            return int ? await int.update(data) : await this.message.edit(data);
        }

        this.description();
        const data = {
            content: null,
            embeds: [this.embed],
            components: this.buttons()
        };

        int ? await int.update(data) : await this.message.edit(data);
        return this.enableCollector();
    }

    description() {
        this.embed.description = t("battleroyale.embed.description", {
            e,
            locale: this.locale,
            table: Array.from(this.players.all.keys())
                .map(id => `${this.players.dead.has(id) ? "☠️" : "😎"} <@${id}>`)
                .join("\n"),
            voted: this.players.voted.size,
            all: this.players.all.size,
            alive: this.players.alive.size
        });
        return;
    }

    buttons() {
        const components = [];

        for (let i = 0; i < this.players.all.size; i += 5)
            components.push({
                type: 1,
                components: Array.from(this.players.all.values())
                    .slice(i, i + 5)
                    .map(id => ({
                        type: 2,
                        emoji: this.players.all.get(id) || "❓",
                        custom_id: id,
                        style: this.players.dead.has(id) ? ButtonStyle.Danger : ButtonStyle.Primary,
                        disabled: this.players.dead.has(id) || this.players.alive.size === 1
                    }))
            });

        return components;
    }

    enableCollector() {
        if (!this.message) return;

        this.collector = this.message.createMessageComponentCollector({
            filter: () => true,
            time: 1000 * 30,
            componentType: ComponentType.Button
        })
            .on("collect", async (int: ButtonInteraction<"cached">) => await this.vote(int))
            .on("end", async (_, reason: string): Promise<any> => {
                if (reason === "time") return await this.eliminate();
                return;
            });
    }

    async vote(int: ButtonInteraction<"cached">): Promise<any> {
        const { customId, user } = int;
        const locale = await user.locale();

        if (!this.players.all.has(user.id))
            return await int.reply({
                content: t("battleroyale.you_are_not_in_this_game", { e, locale }),
                ephemeral: true
            });

        if (this.players.voted.has(user.id))
            return await int.reply({
                content: t("battleroyale.you_already_voted", { e, locale }),
                ephemeral: true
            });

        if (customId === user.id)
            return await int.reply({
                content: t("battleroyale.you_cannot_vote_in_yourself", { e, locale }),
                ephemeral: true
            });

        if (this.players.dead.has(user.id))
            return await int.reply({
                content: t("battleroyale.you_are_dead", { e, locale }),
                ephemeral: true
            });

        this.players.voted.add(user.id);
        this.votes[customId] ? this.votes[customId]++ : this.votes[customId] = 1;

        await int.reply({
            content: t("battleroyale.voted", { e, locale, emoji: this.players.all.get(customId) }),
            ephemeral: true
        });

        if (this.players.voted.size === this.players.alive.size)
            return await this.eliminate();

        return await this.edit();
    }

    async edit(iniciating?: boolean) {

        if (this.editing) return;

        this.editing = true;

        setTimeout(async () => {
            this.editing = false;
            this.description();
            const embed = Object.assign({}, this.embed);
            if (iniciating) delete embed.fields;
            return await this.message?.edit({ embeds: [embed] });
        }, 2000);
        return;
    }

    async eliminate() {
        this.collector?.stop("ignore");
        this.players.voted.clear();

        const votes = Object.entries(this.votes);

        if (!votes?.length)
            return await this.message?.reply({
                content: t("battleroyale.no_votes", { e, locale: this.locale }),
                embeds: [],
                components: []
            });

        const dead = votes.sort((a, b) => b[1] - a[1])?.[0]?.[0];

        this.votes = {};
        this.players.dead.add(dead);
        this.players.alive.delete(dead);

        if (this.players.alive.size === 1)
            return await this.finish();

        if (this.players.alive.size === 2)
            return await this.final();

        this.description();

        await this.message?.edit({
            embeds: [this.embed],
            components: this.buttons()
        });

        return this.enableCollector();
    }

    async final() {
        if (!this.message) return;

        this.embed.fields![0].value = t("battleroyale.embed.fields.0.value_final", {
            e,
            locale: this.locale,
            ...Array.from(this.players.alive).map((userId, i) => ({ [`userId${i}`]: userId }))
        });

        this.message = await this.message?.edit({
            embeds: [{
                color: Colors.Blue,
                title: t("battleroyale.embed.title", this.locale),
                fields: [
                    {
                        name: t("battleroyale.embed.fields.0.name", { e, locale: this.locale }),
                        value: this.embed.fields![0].value
                    }
                ]
            }],
            components: this.buttons()
        });

        return this.message.createMessageComponentCollector({
            filter: () => true,
            time: 1000 * 30,
            componentType: ComponentType.Button
        })
            .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {
                const { customId, user } = int;
                const locale = await user.locale();

                if (!this.players.all.has(user.id))
                    return await int.reply({
                        content: t("battleroyale.you_are_not_in_this_game", { e, locale }),
                        ephemeral: true
                    });

                if (this.players.voted.has(user.id))
                    return await int.reply({
                        content: t("battleroyale.you_already_voted", { e, locale }),
                        ephemeral: true
                    });

                if (customId === user.id)
                    return await int.reply({
                        content: t("battleroyale.you_cannot_vote_in_yourself", { e, locale }),
                        ephemeral: true
                    });

                this.players.voted.add(user.id);
                this.votes[customId] ? this.votes[customId]++ : this.votes[customId] = 1;

                await int.reply({
                    content: t("battleroyale.voted", { e, locale, emoji: this.players.all.get(customId) }),
                    ephemeral: true
                });

                if (this.players.voted.size === this.players.alive.size)
                    return await this.eliminate();

                return await this.edit();
            })
            .on("end", async (_, reason: string): Promise<any> => {
                if (reason === "time") return await this.eliminate();
                return;
            });
    }

    async finish() {
        this.description();
        return await this.message?.edit({
            content: null,
            embeds: [{
                color: Colors.Blue,
                title: t("battleroyale.embed.title", this.locale),
                description: this.embed.description,
                fields: [
                    {
                        name: t("battleroyale.embed.fields.0.name", { e, locale: this.locale }),
                        value: t("battleroyale.embed.fields.0.value", { e, locale: this.locale })
                    }
                ]
            }],
            components: this.buttons()
        });
    }
}