import { User, APIEmbed, Colors, GuildTextBasedChannel, ChatInputCommandInteraction, Message, ButtonStyle, ButtonInteraction, Collection } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import getButtons from "./getbuttons";
import { Config } from "../../../util/constants";
import Database from "../../../database";
import { randomBytes } from "crypto";
import { ButtonComponentWithCustomId, ButtonObject } from "../../../@types/customId";
export const channelsInGane = new Set<string>();
const emojis = ["<:y_belezura:1129208937812594739>", "🐍", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🙈", "🐵", "🐸", "🐨", "🐒", "🦁", "🐯", "🐮", "🐔", "🐧", "🐦", "🐤", "🦄", "🐴", "🐗", "🐺", "🦇", "🦉", "🦅", "🦤", "🦆", "🐛", "🦋", "🐌", "🐝", "🪳", "🪲", "🦗", "🦂", "🐢"];
const distances = [0.1, 0.4, 0.3, 0.2, 0.1, 0.1, 0.1, 0.5, 0.1];
const dots = [".", "....", "...", "..", ".", ".", ".", ".....", "."];
type playerData = {
    id: string;
    animal: string;
    distance: number;
    dots: string;
};

export default class Race {
    declare channel: GuildTextBasedChannel;
    declare locale: string;
    declare author: User;
    declare interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>;
    declare value: number;
    declare playersMax: number;
    declare limitToReach: number;
    declare message: Message<true> | undefined;
    declare raceMessage: Message<true> | undefined | void;
    declare players: Collection<string, playerData>;
    declare buttons: ButtonObject[];

    DocumentsIdsToDelete = new Set<string>();
    emojis = new Set(emojis.random(25));
    iniciated = false;
    total = 0;
    messagesCollected = 0;
    embed = {
        color: Colors.Blue,
        fields: []
    } as APIEmbed;

    constructor(interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>) {
        this.channel = interactionOrMessage.channel!;

        this.locale = ((interactionOrMessage as any)?.options?.getString("language") as any)
            || (Config.locales.includes(interactionOrMessage.guild.preferredLocale || "")
                ? interactionOrMessage.guild.preferredLocale
                : interactionOrMessage.userLocale || "pt-BR");

        this.author = "author" in interactionOrMessage ? interactionOrMessage.author : interactionOrMessage.user;
        this.interactionOrMessage = interactionOrMessage;

        this.value = "options" in interactionOrMessage
            ? (() => {
                for (const arg of (interactionOrMessage.options.getString("value") || "").split(" "))
                    if (arg.length < 10) {
                        const num = arg?.toNumber();
                        if (typeof (arg?.toNumber()) === "number" && num > 0)
                            return num;
                    }
                return 0;
            })()
            : (() => {
                for (const arg of interactionOrMessage.content.split(" "))
                    if (arg.length < 10) {
                        const num = arg?.toNumber();
                        if (typeof (arg?.toNumber()) === "number" && num > 0)
                            return num;
                    }
                return 0;
            })();

        this.playersMax = "options" in interactionOrMessage ? (interactionOrMessage.options.getInteger("players") || 0) || 20 : 20;
        this.limitToReach = "options" in interactionOrMessage ? (interactionOrMessage.options.getInteger("distance") || 0) || 10 : 10;
        this.players = new Collection();
        this.buttons = getButtons(Array.from(this.emojis), this.locale);
    }

    async load() {

        if (channelsInGane.has(this.channel.id))
            return await this.interactionOrMessage.reply({
                content: t("race.has_a_game_in_this_channel", { e, locale: this.locale }),
                ephemeral: true
            });

        this.embed = {
            color: Colors.Blue,
            title: t("race.embed.title", { e, username: this.author.username, locale: this.locale }),
            fields: [
                {
                    name: t("race.embed.fields.0.name", { e, locale: this.locale }),
                    value: t("race.embed.fields.0.value", { e, locale: this.locale, value: this.value.currency() })
                },
                {
                    name: t("race.embed.fields.1.name", { e, locale: this.locale }),
                    value: t("race.embed.fields.1.value", { e, locale: this.locale, distance: this.limitToReach.toFixed(1) })
                },
                {
                    name: t("race.embed.fields.2.name", { e, locale: this.locale }),
                    value: t("race.embed.fields.2.value", { e, locale: this.locale })
                }
            ],
            footer: {
                text: t("race.embed.footer", { e, locale: this.locale, players: this.playersMax })
            }
        };

        if (this.value > 0)
            this.embed.description = t("race.embed.description", { e, locale: this.locale, value: this.value.currency() });

        channelsInGane.add(this.channel.id);
        const msg = await this.interactionOrMessage.reply({
            embeds: [this.embed],
            components: this.buttons.asMessageComponents(),
            fetchReply: true
        })
            .catch(async error => {
                channelsInGane.delete(this.channel.id);
                await this.channel.send({ content: t("race.error_to_send_message", { e, locale: this.locale, error }) }).catch(() => { });
                return null;
            });

        if (msg === null) return;

        this.message = msg;
        return this.enableCollector();
    }

    enableCollector() {

        const collector = this.message?.createMessageComponentCollector({
            filter: () => true,
            time: 1000 * 60
        })
            .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

                const { customId, user } = int;
                const locale = await user.locale();

                if (user.id === this.author.id && customId === "start") {
                    this.iniciated = true;
                    collector?.stop();
                    return await this.init();
                }

                if (customId === "start")
                    return await int.reply({
                        content: t("race.you_cannot_click_here", { e, locale }),
                        ephemeral: true
                    });

                if (this.players.has(user.id))
                    return await int.reply({
                        content: t("race.you_already_in", { e, locale }),
                        ephemeral: true
                    });

                const button = this.buttons.map(b => b.components).flat().find((b: any) => b.custom_id === customId) as ButtonComponentWithCustomId;
                const animal = button.emoji!;

                if (!this.emojis.has(animal))
                    return await int.reply({
                        content: t("race.your_emoji_already_choosen", { e, locale }),
                        ephemeral: true
                    });

                this.emojis.delete(animal);

                await int.reply({
                    content: t("race.joining", { e, locale }),
                    ephemeral: true
                });

                if (this.value > 0) {

                    const balance = (await Database.getUser(user.id))?.Balance || 0;

                    if (!balance || balance < this.value) {
                        this.emojis.add(animal);
                        return int.editReply({ content: t("race.you_dont_have_money_enough", { e, locale }) });
                    }

                    await Database.editBalance(
                        user.id,
                        {
                            createdAt: new Date(),
                            keywordTranslate: "race.transactions.join",
                            method: "sub",
                            mode: "race",
                            type: "loss",
                            value: this.value
                        }
                    );

                    const id = randomBytes(15).toString("base64url");
                    this.DocumentsIdsToDelete.add(id);
                    await Database.Race.create({
                        id,
                        userId: user.id,
                        guildId: this.channel.guildId,
                        value: this.value,
                        translateRefundKey: "race.transactions.refund"
                    });

                    this.total += this.value;
                }

                button.disabled = true;
                button.style = ButtonStyle.Primary;

                this.players.set(user.id, {
                    animal,
                    distance: 0.0,
                    dots: "",
                    id: user.id
                });

                if (this.total > 0) this.embed.fields![0].value! = t("race.embed.fields.0.value", { locale: this.locale, value: this.total.currency() });
                this.embed.fields![2].value = this.players.map(data => `${data.animal} <@${data.id}>`).join("\n");
                await int.editReply({
                    content: t("race.you_join_in_the_game", { e, locale })
                });

                if (this.players.size >= this.playersMax) {
                    this.iniciated = true;
                    collector?.stop();
                    return await this.init();
                }

                return await int.message?.edit({ embeds: [this.embed], components: this.buttons.asMessageComponents() });
            })
            .on("end", async (_, reason): Promise<any> => {

                if (this.iniciated) return;
                if (this.players.size >= 2) return await this.init();

                channelsInGane.delete(this.channel.id);

                if (this.value > 0) await this.refund();

                if (["time", "idle"].includes(reason))
                    return await this.message?.edit({
                        content: t("race.cancelled", { e, locale: this.locale }),
                        embeds: [],
                        components: []
                    }).catch(() => { });

                return;
            });

    }

    async refund() {
        if (!this.players.size) return;
        this.DocumentsIdsToDelete.clear();
        for await (const userId of Array.from(this.players.keys()))
            await Database.editBalance(
                userId,
                {
                    createdAt: new Date(),
                    keywordTranslate: "race.transactions.refund",
                    method: "add",
                    mode: "system",
                    type: "system",
                    value: this.value
                }
            );
        return await Database.Race.deleteMany({ id: { $in: Array.from(this.DocumentsIdsToDelete) } });
    }

    async init() {

        const messageCollector = this.channel.createMessageCollector({
            filter: () => true
        }).on("collect", (): any => this.messagesCollected++);

        this.embed.color = Colors.Green;
        this.embed.footer!.text = this.embed.footer!.text + t("race.iniciated", { e, locale: this.locale });

        await this.message?.edit({ embeds: [this.embed], components: [] }).catch(() => { });

        if (this.players.size < 2) {
            channelsInGane.delete(this.channel.id);
            if (this.value > 0) await this.refund();
            messageCollector.stop();
            return this.channel.send({ content: t("race.iniciate_with_less_2_players", { e, locale: this.locale }) });
        }

        const contentFormat = (rank: playerData[]) => rank.map(d => `${d.distance.toFixed(2)} ${d.dots}${d.animal}`).join("\n").limit("MessageContent");

        const initialContent = contentFormat(Array.from(this.players.values()));
        this.raceMessage = await this.channel.send({ content: initialContent })
            .catch(async () => {
                this.raceMessage = await this.channel.send({ content: initialContent })
                    .catch(async () => {
                        messageCollector.stop();
                        clearInterval(interval);
                        this.message?.delete().catch(() => { });
                        await this.refund();
                        return;
                    });
                return;
            });

        const interval: NodeJS.Timeout = setInterval(async () => {

            const players = Array.from(this.players.values());

            players.map(player => {
                const i = Math.floor(Math.random() * distances.length);
                player.distance += distances[i];
                player.dots += dots[i];
                this.players.set(player.id, player);
                return player;
            });

            const rank = players.sort((a, b) => b.distance - a.distance);
            const content = contentFormat(rank);

            if (rank[0].distance >= this.limitToReach) {
                clearInterval(interval);
                messageCollector.stop();
                return await this.newWinner(rank[0], content);
            }

            if (this.messagesCollected > 7) {
                this.messagesCollected = 0;
                await this.raceMessage?.delete().catch(() => { });
            }

            return await this.raceMessage?.edit({ content })
                .catch(async () => {
                    this.raceMessage = await this.channel.send({ content })
                        .catch(async (): Promise<any> => {
                            messageCollector.stop();
                            clearInterval(interval);
                            await this.message?.delete().catch(() => { });
                            await this.refund();
                            return null;
                        });
                    return;
                });

        }, 2000);

        return;
    }

    async newWinner(winner: playerData, resultStringValue: string) {

        this.message?.delete().catch(() => { });
        this.raceMessage?.delete().catch(() => { });
        channelsInGane.delete(this.channel.id);

        if (this.total > 0) {
            await Database.Race.deleteMany({ id: { $in: Array.from(this.DocumentsIdsToDelete) } });
            await Database.editBalance(
                winner.id,
                {
                    createdAt: new Date(),
                    keywordTranslate: "race.transactions.win",
                    method: "add",
                    mode: "race",
                    type: "gain",
                    value: this.total
                }
            );
        }

        this.embed!.fields![2]!.value = Array
            .from(this.players.values())
            .sort((a, b) => b.distance - a.distance)
            .map((player, i) => {
                const crown = player.id === winner.id ? " 👑" : "";
                return `${i + 1}. ${player.animal} <@${player.id}>${crown}`;
            }).join("\n");

        this.embed.fields![3] = {
            name: t("race.embed.fields.0.name", { e, locale: this.locale }),
            value: resultStringValue.limit("EmbedFieldValue")
        };

        this.embed!.footer!.text = t("race.embed.final_footer", { size: this.players.size, locale: this.locale });

        return await this.channel.send({ embeds: [this.embed] });

    }

}