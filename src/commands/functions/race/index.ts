import { User, APIEmbed, Colors, GuildTextBasedChannel, ChatInputCommandInteraction, Message, ButtonStyle } from "discord.js";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import getButtons from "./getbuttons";
import { Config } from "../../../util/constants";
export const emojis = ["🐍", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🙈", "🐵", "🐸", "🐨", "🐒", "🦁", "🐯", "🐮", "🐔", "🐧", "🐦", "🐤", "🦄", "🐴", "🐗", "🐺", "🦇", "🦉", "🦅", "🦤", "🦆", "🐛", "🦋", "🐌", "🐝", "🪳", "🪲", "🦗", "🦂", "🐢"];
const channelsInGane = new Set<string>();

export default class Race {
    declare channel: GuildTextBasedChannel;
    declare locale: string;
    declare author: User;
    declare interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>;
    declare value: number;
    declare playersMax: number;
    declare limitToReach: number;
    iniciated = false;
    total = 0;
    buttons = getButtons();

    constructor(interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>) {
        this.channel = interactionOrMessage.channel!;
        this.locale = Config.locales.includes(interactionOrMessage.guild.preferredLocale || "") ? interactionOrMessage.guild.preferredLocale : interactionOrMessage.userLocale || "pt-BR";
        this.author = "author" in interactionOrMessage ? interactionOrMessage.author : interactionOrMessage.user;
        this.interactionOrMessage = interactionOrMessage;
        this.value = "options" in interactionOrMessage ? interactionOrMessage.options.getInteger("value") || 0 : interactionOrMessage.content.toNumber() || 0;
        this.playersMax = "options" in interactionOrMessage ? interactionOrMessage.options.getInteger("players") || 0 : 20;
        this.limitToReach = "options" in interactionOrMessage ? interactionOrMessage.options.getInteger("distance") || 0 : 10;
    }

    async load() {

        if (channelsInGane.has(this.channel.id))
            return await this.interactionOrMessage.reply({
                content: t("race.has_a_game_in_this_channel", { e, locale: this.locale }),
                ephemeral: true
            });

        const embed: APIEmbed = {
            color: Colors.Blue,
            title: t("race.embed.iniciate", { e, username: this.author.username, locale: this.locale }),
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
            embed.description = t("race.embed.description", { e, locale: this.locale, value: this.value });

        channelsInGane.add(this.channel.id);
        return await this.interactionOrMessage.reply({
            embeds: [embed],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: t("race.buttons.join", { e, locale: this.locale }),
                            custom_id: "join",
                            emoji: "🏃‍♂️",
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: t("race.buttons.leave", { e, locale: this.locale }),
                            custom_id: "leave",
                            emoji: "🏳️",
                            style: ButtonStyle.Danger
                        },
                        {
                            type: 2,
                            label: t("race.buttons.start", { e, locale: this.locale }),
                            custom_id: "start",
                            emoji: "🏁",
                            style: ButtonStyle.Success
                        }
                    ]
                }
            ].asMessageComponents()
        });
    }

    get allButtons() {
        return [
            this.buttons[0].components[0],
            this.buttons[0].components[1],
            this.buttons[0].components[2],
            this.buttons[0].components[3],
            this.buttons[0].components[4],
            this.buttons[1].components[0],
            this.buttons[1].components[1],
            this.buttons[1].components[2],
            this.buttons[1].components[3],
            this.buttons[1].components[4],
            this.buttons[2].components[0],
            this.buttons[2].components[1],
            this.buttons[2].components[2],
            this.buttons[2].components[3],
            this.buttons[2].components[4],
            this.buttons[3].components[0],
            this.buttons[3].components[1],
            this.buttons[3].components[2],
            this.buttons[3].components[3],
            this.buttons[3].components[4],
            this.buttons[4].components[0],
            this.buttons[4].components[1],
            this.buttons[4].components[2],
            this.buttons[4].components[3],
            this.buttons[4].components[4]
        ];
    }
}