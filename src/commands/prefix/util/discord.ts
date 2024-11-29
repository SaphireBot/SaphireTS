import { Message, Colors, APIEmbed, ButtonStyle, parseEmoji } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { DiscordSummaryStatus } from "../../../@types/commands";
import { getPaginationButtons } from "../../components/buttons/buttons.get";
import { urls } from "../../../util/constants";

export default {
    name: "discord",
    description: "A short command to see Discord Status",
    aliases: ["dc", "dsc"],
    category: "util",
    api_data: {
        category: "Utilidade",
        synonyms: ["dc", "dcs"],
        tags: [],
        perms: {
            user: [],
            bot: [],
        },
    },
    execute: async function (message: Message, _: string[] | undefined) {

        const { userLocale: locale, author } = message;
        const msg = await message.reply({ content: t("discord.loading", { e, locale }) });

        const data = await fetch("https://discordstatus.com/api/v2/summary.json", { method: "GET" })
            .then(res => res.json())
            .catch(err => ({ error: err })) as DiscordSummaryStatus;

        if (data?.error)
            return await msg.edit({ content: t("discord.errorFetch", { e, locale, data }) });

        const embedsComponents: APIEmbed[] = [];
        const embedsIncidents: APIEmbed[] = [];

        const statusData = {
            operational: {
                emoji: e.green,
                color: Colors.Green,
                translate_content: t("discord.status.operational", locale),
            },
            degraded_performance: {
                emoji: e.yellow,
                color: Colors.Yellow,
                translate_content: t("discord.status.degraded_performance", locale),
            },
            partial_outage: {
                emoji: e.orange,
                color: Colors.Orange,
                translate_content: t("discord.status.partial_outage", locale),
            },
            major_outage: {
                emoji: e.red,
                color: Colors.Red,
                translate_content: t("discord.status.major_outage", locale),
            },
        };

        const embed: APIEmbed = {
            color: Colors.Blue,
            title: t("discord.embed.list_title", { e, locale }),
            url: data.page.url,
            description: data.components.map(v => `**${v.name}**: ${t("discord.embed.fields.0.value", { e, locale, status: statusData[v.status] })}`).join("\n"),
            fields: [
                {
                    name: t("discord.embed.fields.2.name", { e, locale }),
                    value: t("discord.embed.fields.2.value", {
                        locale,
                        updatedTime: Date.toDiscordCompleteTime(new Date(data.page.updated_at!)),
                    }),
                },
            ],
            footer: { text: data.page.id },
        };

        for (const component of data.components) {
            const status = statusData[component.status];
            const embed: APIEmbed = {
                color: status.color,
                title: component.name + ` \`${component.id}\``,
                fields: [
                    {
                        name: t("discord.embed.fields.0.name", { e, locale }),
                        value: t("discord.embed.fields.0.value", { e, locale, status }),
                    },
                    {
                        name: t("discord.embed.fields.1.name", { e, locale }),
                        value: t("discord.embed.fields.1.value", {
                            e,
                            locale,
                            createdTime: Date.toDiscordCompleteTime(new Date(component.created_at!)),
                            startedTime: Date.toDiscordCompleteTime(new Date(component.start_date!)),
                            updatedTime: Date.toDiscordCompleteTime(new Date(component.updated_at!)),
                        }),
                    },
                ],
            };

            if (component.description)
                embed.description = component.description;

            embedsComponents.push(embed);
        }

        const incidentData = {
            resolved: {
                emoji: e.green,
                color: Colors.Green,
                translate_content: t("discord.status.resolved", locale),
            },
            monitoring: {
                emoji: e.yellow,
                color: Colors.Yellow,
                translate_content: t("discord.status.monitoring", locale),
            },
            identified: {
                emoji: e.orange,
                color: Colors.Orange,
                translate_content: t("discord.status.identified", locale),
            },
            investigating: {
                emoji: e.orange,
                color: Colors.Orange,
                translate_content: t("discord.status.identified", locale),
            },
            postmortem: {
                emoji: e.red,
                color: Colors.Red,
                translate_content: t("discord.status.postmortem", locale),
            },
        };

        for (const incident of data.incidents) {
            const embed: APIEmbed = {
                color: {
                    none: Colors.Green,
                    minor: Colors.Yellow,
                    major: Colors.Orange,
                    critical: Colors.Red,
                }[incident.impact],
                title: incident.name + ` \`${incident.id}\``,
                fields: [
                    {
                        name: t("discord.embed.fields.0.name", { e, locale }),
                        value: t("discord.embed.fields.0.value", { e, locale, status: incidentData[incident.status] }),
                    },
                    {
                        name: t("discord.embed.fields.3.name", { e, locale }),
                        value: t("discord.embed.fields.3.value", {
                            e,
                            locale,
                            createdTime: Date.toDiscordCompleteTime(new Date(incident.created_at!)),
                            monitoredTime: Date.toDiscordCompleteTime(new Date(incident.monitoring_at!)),
                            resolvedTime: Date.toDiscordCompleteTime(new Date(incident.resolved_at!)),
                            updatedTime: Date.toDiscordCompleteTime(new Date(incident.updated_at!)),
                        }),
                    },
                ],
            };

            if (incident.shortlink)
                embed.url = incident.shortlink;

            embedsIncidents.push(embed);
        }

        if (!embedsComponents.length) embedsComponents.push({ color: Colors.Blue, title: t("discord.embed.components", locale), image: { url: urls.not_found_image } });
        if (!embedsIncidents.length) embedsIncidents.push({ color: Colors.Blue, title: t("discord.embed.incidents", { e, locale }), image: { url: urls.not_found_image } });

        const buttons = getPaginationButtons();
        const secondComponents = [{
            type: 1,
            components: [
                {
                    type: 2,
                    custom_id: "list",
                    emoji: parseEmoji(e.Commands),
                    style: ButtonStyle.Primary,
                },
                {
                    type: 2,
                    custom_id: "incidents",
                    emoji: parseEmoji(e.bug),
                    style: ButtonStyle.Primary,
                },
                {
                    type: 2,
                    custom_id: "status",
                    emoji: parseEmoji("📃"),
                    style: ButtonStyle.Primary,
                },
                {
                    type: 2,
                    url: "https://discordstatus.com/",
                    emoji: parseEmoji("🔗"),
                    style: ButtonStyle.Link,
                },
            ],
        }].asMessageComponents();

        function getComponents(length: number) {
            if (length <= 1) return [];
            return buttons;
        };

        let index = 0;
        let embeds: APIEmbed[] = embedsComponents;

        await msg.edit({ content: null, embeds: [embed], components: secondComponents });
        return msg.createMessageComponentCollector({
            filter: int => int.user.id === author.id,
            idle: 1000 * 60 * 2,
        })
            .on("collect", async (int): Promise<any> => {

                const { customId } = int;

                switch (customId) {
                    case "zero": index = 0; break;
                    case "left": index = index <= 0 ? embeds.length - 1 : index - 1; break;
                    case "right": index = index >= embeds.length - 1 ? 0 : index + 1; break;
                    case "last": index = embeds.length - 1; break;
                    case "incidents":
                        embeds = embedsIncidents;
                        index = 0;
                        break;
                    case "status":
                        embeds = embedsComponents;
                        index = 0;
                        break;
                    case "list":
                        return await int.update({ embeds: [embed], components: secondComponents });
                    default:
                        break;
                }

                return await int.update({ embeds: [embeds[index]], components: [...getComponents(embeds.length), ...secondComponents] });
            })
            .on("end", async (): Promise<any> => await msg.edit({ components: [] }).catch(() => { }));
    },
};