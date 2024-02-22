import {
    APIActionRowComponent,
    APIEmbed,
    APIMessageActionRowComponent,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    Collection,
    Colors,
    ComponentType,
    Embed,
    GuildMember,
    GuildTextBasedChannel,
    InteractionCollector,
    Message,
    MessageCollector
} from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import loadButtons from "./buttons.load";
import { ButtonComponentWithCustomId } from "../../@types/customId";
import loadingButtons from "./buttons.loading";
export const lastclickChannelsInGame = new Set<string>();
type editDataPayload = { content?: string | undefined, embeds?: (Embed | APIEmbed)[], components?: APIActionRowComponent<APIMessageActionRowComponent>[] };

export default class Lastclick {

    players = {
        all: new Map<string, GuildMember>(),
        in: new Set<string>(),
        out: new Set<string>()
    };
    clicks = [] as string[];
    payload = {} as any;
    refreshing = false;
    underEdit = false;
    choosenAnimals = new Collection<string, string>(); // <animal, userId>
    customIds = new Set<string>();
    started = false;
    messagesSended = 0;

    declare interval: NodeJS.Timeout;
    declare initialCollector: InteractionCollector<ButtonInteraction<"cached">> | undefined;
    declare animalsCollector: InteractionCollector<ButtonInteraction<"cached">> | undefined;
    declare errorMessage: Message<true> | undefined;
    declare messageCollector: MessageCollector | undefined;
    declare authorId: string;
    declare channel: GuildTextBasedChannel | null;
    declare message: Message<true> | undefined;
    declare locale: string;
    declare interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>;
    constructor(interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>) {
        this.interactionOrMessage = interactionOrMessage;
        this.channel = interactionOrMessage.channel;
        this.locale = interactionOrMessage.guild.preferredLocale;
        this.authorId = interactionOrMessage instanceof ChatInputCommandInteraction ? interactionOrMessage.user.id : interactionOrMessage.author.id;
    }

    load() {
        if (!this.channel?.id) return;

        this.interval = setInterval(async () => await this.execute(), 1500);

        lastclickChannelsInGame.add(this.channel.id);
        return this.edit({
            embeds: [this.embed],
            components: loadButtons(this)
        });
    }

    enableButtonCollector(msg: Message<true>) {
        if (this.started) return;
        if (!msg && !this.message) return this.error(new Error("The original message disappear."));
        if (this.initialCollector) this.initialCollector.stop();
        this.initialCollector = (msg || this.message).createMessageComponentCollector({
            filter: () => true,
            idle: 1000 * 30,
            componentType: ComponentType.Button
        })
            .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {
                if (this.started) return this.initialCollector?.stop();
                const { customId, user, userLocale: locale, member } = int;

                if (customId === "start") {
                    if (user.id !== this.authorId)
                        return await int.reply({
                            content: t("lastclick.just_author_can_start", { e, locale, authorId: this.authorId }),
                            ephemeral: true
                        });
                    return await this.start(int);
                }

                if (customId === "cancel") {
                    if (user.id !== this.authorId)
                        return await int.reply({
                            content: t("lastclick.just_author_can_cancel", { e, locale, authorId: this.authorId }),
                            ephemeral: true
                        });
                    this.clear();
                    return await int.update({
                        content: t("lastclick.stopped", { e, locale: this.locale }),
                        embeds: [], components: []
                    }).catch(() => { });
                }

                if (customId === "leave") {

                    if (!this.players.all.has(user.id))
                        return await int.reply({
                            content: t("lastclick.you_already_out", { e, locale }),
                            ephemeral: true
                        });

                    this.players.all.delete(user.id);
                    const animal = this.choosenAnimals.findKey((userId) => userId === user.id);

                    if (!animal)
                        return await int.reply({
                            content: t("lastclick.no_animal_found", { e, locale }),
                            ephemeral: true
                        });

                    this.choosenAnimals.delete(animal);
                    this.refreshInitalEmbedGame();
                    return await int.reply({
                        content: t("lastclick.leave", { e, locale }),
                        ephemeral: true
                    });
                }

                if (this.choosenAnimals.has(customId))
                    return await int.reply({
                        content: t("lastclick.this_button_already_taken", { e, locale }),
                        ephemeral: true
                    });

                let old = "";
                if (this.players.all.has(user.id)) {
                    const animal = this.choosenAnimals.findKey((userId) => userId === user.id);
                    this.choosenAnimals.delete(animal!);
                    old = animal!;
                }

                this.players.all.set(user.id, member);
                this.choosenAnimals.set(customId, user.id);
                this.refreshInitalEmbedGame();

                return await int.reply({
                    content: t(`lastclick.${old ? "changed" : "joined"}`, { e, locale, authorId: this.authorId, animal: customId, old }),
                    ephemeral: true
                });
            })
            .on("end", async (_, reason: string): Promise<any> => {
                this.initialCollector = undefined;
                if (reason === "user" || this.started) return;

                if (reason === "messageDelete") return;

                if (["guildDelete", "channelDelete"].includes(reason))
                    return this.clear();

                if (["idle", "time"].includes(reason)) return await this.start();
                return;
            });
    }

    refreshInitalEmbedGame() {
        if (this.refreshing) return;
        this.refreshing = true;

        setTimeout(() => {
            this.refreshing = false;
            this.editInicialEmbed();
        }, 2000);
        return;
    }

    editInicialEmbed() {

        if (this.started) return;
        const components = [] as any[];
        const rows = this.message?.components || [];
        if (!rows?.length) return;
        for (const row of rows) {
            const buttons: ButtonComponentWithCustomId[] = [];
            for (const button of row.toJSON().components as ButtonComponentWithCustomId[]) {
                const imune = ["leave", "cancel", "start"].includes(button.custom_id);
                const isChoosenAnimal = this.choosenAnimals.has(button.custom_id);

                button.style = imune
                    ? button.style
                    : isChoosenAnimal ? ButtonStyle.Primary : ButtonStyle.Secondary;

                button.disabled = isChoosenAnimal;
                buttons.push(button);
            }
            components.push({ type: 1, components: buttons });
        }

        this.edit({ embeds: [this.embed], components });
        this.refreshing = false;
        return;
    }

    get embed(): APIEmbed {
        return {
            color: Colors.Blue,
            title: t("lastclick.embed.title", { e, locale: this.locale }),
            description: this.choosenAnimals.size
                ? (
                    this.choosenAnimals
                        .map((userId, animal) => `${animal} ${this.players.all.get(userId)}`)
                        .join("\n ")
                    + (
                        this.started
                            ? t("lastclick.select_your_animal", { e, locale: this.locale })
                            : ""
                    )
                )
                    .limit("MessageEmbedDescription")
                : t("lastclick.embed.description_load", { e, locale: this.locale })
        };
    }

    clear() {
        this.players.all.clear();
        this.players.in.clear();
        this.players.out.clear();
        this.choosenAnimals.clear();
        this.customIds.clear();
        this.initialCollector?.stop();
        this.messageCollector?.stop();
        this.animalsCollector?.stop();
        this.started = false;
        this.refreshing = false;
        this.message = undefined;
        lastclickChannelsInGame.delete(this.channel?.id || "");
        clearInterval(this.interval);
        return;
    }

    async start(int?: ButtonInteraction<"cached">) {
        if (this.started) return;
        this.started = true;

        if (this.players.all.size < 2) {
            this.edit({ content: t("lastclick.players_not_enough", { e, locale: this.locale }), embeds: [], components: [] });
            return this.clear();
        }

        this.players.in = new Set(Array.from(this.players.all.keys()));
        const interactionUpdateOptions = {
            embeds: [{
                color: Colors.Blue,
                title: t("lastclick.embed.title", { e, locale: this.locale }),
                description: t("lastclick.shaking", { e, locale: this.locale })
            }],
            components: loadingButtons()
        };

        setTimeout(() => {
            this.initialCollector?.stop();
            this.message = undefined;
            return this.edit({ components: this.shuffle(), embeds: [this.embed] });
        }, 1000 * 6);

        if (int)
            return await int.update(interactionUpdateOptions)
                .catch(err => this.error(err, interactionUpdateOptions));

        return this.edit(interactionUpdateOptions);
    }

    enableAnimalsCollector(msg: Message<true>) {
        if (!msg && !this.message) return this.error(new Error("The original message disappear."));

        if (this.animalsCollector) return;
        this.animalsCollector = (this.message || msg!).createMessageComponentCollector({
            filter: () => true,
            time: 1000 * 15,
            componentType: ComponentType.Button
        })
            .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

                const { user, customId, userLocale: locale } = int;

                if (!this.players.in.has(user.id))
                    return await int.reply({
                        content: t("lastclick.not_in", { e, locale }),
                        ephemeral: true
                    });

                if (this.clicks.includes(user.id))
                    return await int.reply({
                        content: t("lastclick.calm_down_princess", { e, locale }),
                        ephemeral: true
                    });

                if (this.choosenAnimals.get(customId) !== user.id)
                    return await int.reply({
                        content: t("lastclick.wrong_animal", { e, locale }),
                        ephemeral: true
                    });

                this.clicks.push(user.id);
                return await int.reply({
                    content: t("lastclick.right_animal", { e, locale }),
                    ephemeral: true
                });
            })
            .on("end", (_, reason: string): any => {
                this.animalsCollector = undefined;
                if (reason === "user") return;

                if (reason === "time")
                    return this.playersReview();

                if (reason === "messageDelete") return;

                if (["guildDelete", "channelDelete"].includes(reason))
                    return this.clear();

                return;
            });

    }

    newRound() {

        setTimeout(() => {
            this.clicks = [];
            this.initialCollector?.stop();
            this.edit({ components: this.shuffle(), embeds: [this.embed] });
            return this.enableAnimalsCollector(this.message!);
        }, 4000);

        return this.edit({
            embeds: [{
                color: Colors.Blue,
                title: t("lastclick.embed.title", { e, locale: this.locale }),
                description: t("lastclick.shaking", { e, locale: this.locale })
            }],
            components: loadingButtons()
        });

    }

    playersReview() {

        const playersWhoDidntClick = Array.from(this.players.in).filter(userId => !this.clicks.includes(userId));

        for (const userId of playersWhoDidntClick) {
            this.players.in.delete(userId);
            this.players.out.add(userId);
        }

        if (!this.players.in.size || !this.clicks.length) {
            this.edit({ content: t("lastclick.everyone_lose", { e, locale: this.locale }) });
            return this.clear();
        }

        if (this.players.in.size === 1) {
            this.edit({
                content: t("lastclick.congratulations", { e, locale: this.locale, userId: Array.from(this.players.in.values())[0] })
            });
            return this.clear();
        }

        if (playersWhoDidntClick.length) {
            setTimeout(() => this.newRound(), 5000);
            return this.edit({
                content: t("lastclick.playersWhoDidntClick", {
                    e,
                    locale: this.locale,
                    amount: playersWhoDidntClick.length,
                    remaining: this.players.in.size
                })
            });
        }

        const lastClickUserId = this.clicks.at(-1)!;
        this.players.in.delete(lastClickUserId);
        this.players.out.delete(lastClickUserId);

        if (this.players.in.size) {
            setTimeout(() => this.newRound(), 5000);
            return this.edit({
                content: t("lastclick.prepare_to_next_round", {
                    e,
                    locale: this.locale,
                    userId: lastClickUserId
                })
            });
        }

        return;
    }

    shuffle() {

        const customIds = new Set<string>(
            [
                Array.from(this.customIds),
                "<:y_belezura:1129208937812594739>",
                "<:d_dogegun:1087453235062779924>",
                "<a:CoolDoge:884141190507798599>"
            ].flat()
        );
        const rawComponents = [];

        for (let i = 0; i <= 4; i++) {
            const components = {
                type: 1,
                components: [] as any[]
            };

            for (let x = 0; x <= 4; x++) {
                const animal = Array.from(customIds).random() || e.Animated.SaphireDance;
                if (!animal) continue;
                customIds.delete(animal);
                components.components.push({
                    type: 2,
                    emoji: animal,
                    custom_id: animal,
                    style: ButtonStyle.Secondary,
                    disabled: false
                });
            }

            rawComponents.push(components);
        }

        return rawComponents;
    }

    async error(error: Error, data?: editDataPayload): Promise<undefined> {

        // Unknown Message
        if ((error as any).code === 10008 && data) {
            this.message = undefined;
            this.underEdit = false;
            this.payload = false;
            this.initialCollector?.stop();
            this.edit(data);
            return undefined;
        }

        this.errorMessage = await this.channel?.send({
            content: t("lastclick.error", { e, locale: this.locale, error })
        }).catch(() => undefined);
        this.clear();

        setTimeout(async () => {
            await this.errorMessage?.delete().catch(() => { });
            this.errorMessage = undefined;
            return this.load();
        }, 1000 * 7);
        return undefined;
    }

    enableMessageCollector() {
        if (!this.channel?.id) return;
        this.messagesSended = 0;

        if (this.messageCollector) this.messageCollector.stop();

        this.messageCollector = this.channel.createMessageCollector({
            filter: () => true
        })
            .on("collect", message => {
                this.messagesSended += (message.embeds?.length || 0) * 4;
                this.messagesSended += (message.components?.length || 0) * 3;
                this.messagesSended += (message.attachments?.size || 0) * 3;
                this.messagesSended += (message.attachments?.size || 0) * 3;
                if (message.content.isURL()) this.messagesSended += 2;
                else if (message.content.length) this.messagesSended++;
                return;
            })
            .on("end", (): any => {
                this.messageCollector = undefined;
                return;
            });

        return;
    }

    edit(payload?: editDataPayload) {
        this.payload = payload || {} as any;
    }

    async execute(): Promise<void> {

        if (!this.payload || this.errorMessage || this.underEdit) return;
        this.underEdit = true;

        const data = this.payload || {} as any;

        if (data?.content || data?.embeds || data?.components) {
            if (!data.content) data.content = "";
            if (!data.embeds) data.embeds = [];
            if (!data.components) data.components = [];
        }

        if (!data) {
            data.content = this.message?.content || undefined;
            data.embeds = this.message?.embeds;
            data.components = this.message?.components.map(comp => comp.toJSON()) || [];
            if (!data.content && !data.embeds?.length && !data.components.length) return;
        }

        if (
            !this.message
            || !this.message.editable
            || !this.message.deletable
            || this.messagesSended > 7
        ) {
            await this.message?.delete().catch(() => { });
            this.message = undefined;
            this.message = await this.channel?.send(data)
                .then(msg => {
                    this.messagesSended = 0;
                    this.enableMessageCollector();
                    this.started ? this.enableAnimalsCollector(msg) : this.enableButtonCollector(msg);
                    return msg;
                })
                .catch(err => this.error(err, data));
            this.underEdit = false;
            return;
        }

        this.message = await this.message?.edit(data)
            .then(msg => {
                if (this.started) this.enableAnimalsCollector(msg);
                return msg;
            })
            .catch(err => this.error(err, data));
        this.underEdit = false;
        return;
    }

}