import { APIEmbed, APIGuild, ButtonInteraction, ButtonStyle, Colors, ComponentType, Guild, InteractionCollector, Message } from "discord.js";
import { ChatInputCommandInteraction } from "discord.js";
import Database from "../../../database";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { ReminderSchemaType } from "../../../database/schemas/reminder";
import { urls } from "../../../util/constants";
import client from "../../../saphire";
import { getPaginationButtons } from "../../components/buttons/buttons.get";
import { BaseMessageOptionsComponent } from "../../../@types/commands";
type CollectorType = InteractionCollector<ButtonInteraction<"cached">>;
export const ReminderViewerCollectors = new Map<string, CollectorType>();

const translateKeys = [
    "reminder.dailyReminder"
];

export default async function view(interactionOrMessage: ChatInputCommandInteraction | Message) {

    let locale = interactionOrMessage.userLocale;
    let key = "";
    const user = "user" in interactionOrMessage
        ? interactionOrMessage.user
        : interactionOrMessage.author;

    const msg = await interactionOrMessage.reply({
        content: t("reminder.view.loading", { e, locale }),
        fetchReply: true
    });

    let data = await Database.Reminders.find({ userId: user.id });
    let embeds: APIEmbed[] = [];
    let components: BaseMessageOptionsComponent[][] = [];
    let index = 0;

    if (!data.length)
        return await nodata();

    await build(data);

    enableButtonCollector();
    await msg.edit({
        content: null,
        embeds: [embeds[0]],
        components: components[0] || []
    });

    if (!embeds?.length) return;

    async function nodata() {
        del();

        key = "";
        enableButtonCollector();
        return await msg.edit({
            content: null,
            embeds: [{
                color: Colors.Blue,
                title: t("reminder.view.info_title", { e, locale, user }),
                image: { url: urls.not_found_image }
            }],
            components: []
        });
    }

    function getButtons(reminderId: string) {

        const components = [{
            type: 1,
            components: [
                {
                    type: 2,
                    label: t("reminder.revalidate", locale),
                    emoji: "📅".emoji(),
                    custom_id: JSON.stringify({ c: "rmd", src: "revalidate", rid: reminderId, uid: user.id }),
                    style: ButtonStyle.Primary
                },
                {
                    type: 2,
                    label: t("reminder.delete", locale),
                    emoji: e.Trash.emoji(),
                    custom_id: JSON.stringify({ c: "rmd", src: "delete", rid: reminderId, uid: user.id }),
                    style: ButtonStyle.Danger
                },
                {
                    type: 2,
                    label: t("reminder.move", locale),
                    emoji: "🔁".emoji(),
                    custom_id: JSON.stringify({ c: "rmd", src: "move", rid: reminderId, uid: user.id }),
                    style: ButtonStyle.Primary
                }
            ]
        }];

        if (data.length > 1)
            components.unshift(getPaginationButtons()[0]);

        return components;
    }

    async function refresh(int?: ButtonInteraction) {
        del();

        int
            ? await int.update({ content: t("reminder.refreshing", { e, locale }) })
            : await msg.edit({ content: t("reminder.refreshing", { e, locale }) });

        data = await Database.Reminders.find({ userId: user.id });
        embeds = [];
        components = [];
        index = 0;

        if (!data?.length) return await nodata();

        await build(data);

        enableButtonCollector();
        return await msg.edit({
            content: null,
            embeds: [embeds[0]],
            components: components[0] || []
        });
    }

    function format(data: ReminderSchemaType, guild: Guild | APIGuild | undefined): string {
        return [
            `🆔 \`${data.id}\``,
            guild ? `🏠 ${guild.name}` : "",
            "📃 " + `${data.sendToDM ? "DM" : data.channelId ? `<#${data.channelId}>` : "DM"}`,
            "💬 " + `${translateKeys.includes(data.message!) ? t(data.message!, locale) : data.message!.limit(30) }`,
            `${new Date() > data.lauchAt! ? `${e.Notification} ` : "⏱️ "}` + Date.toDiscordCompleteTime(data.lauchAt!),
        ]
            .filter(Boolean)
            .join("\n");
    }

    async function build(data: ReminderSchemaType[]) {
        if (!data?.length) return await nodata();

        let i = 1;
        let k = "";
        for await (const d of data) {
            const guild = await client.getGuild(d.guildId!);
            components.push(getButtons(d.id!));
            k += d.id!;
            embeds.push({
                color: Colors.Blue,
                title: t("reminder.view.info_title", { e, locale, user }) + ` ${i}/${data.length}`,
                description: format(d, guild)
            });
            i++;
        }
        key = k;
    }

    function enableButtonCollector() {

        const collector = msg.createMessageComponentCollector({
            filter: int => int.user.id === user.id && (!int.customId.includes("delete") && !int.customId.includes("revalidate") && !int.customId.includes("move")),
            idle: 1000 * 60 * 5,
            componentType: ComponentType.Button
        })
            .on("collect", async (int: ButtonInteraction): Promise<any> => {

                const { customId, user, guild } = int;
                locale = await user.locale() || guild?.preferredLocale || "en-US";

                if (customId === "zero") index = 0;
                if (customId === "left") index = index <= 0 ? embeds.length - 1 : index - 1;
                if (customId === "right") index = index >= embeds.length - 1 ? 0 : index + 1;
                if (customId === "last") index = embeds.length - 1;

                if (!embeds[index])
                    return collector.stop("nodata");

                return await int.update({
                    content: null,
                    embeds: [embeds[index]],
                    components: components[index] || []
                });
            })
            .on("end", async (_, reason: string): Promise<any> => {
                if (reason === "ignore") return;
                del();
                if (reason === "nodata") return await nodata();
                return await msg.edit({ components: [] });
            })
            .on("refresh", async (): Promise<any> => {
                del();
                return await refresh();
            });

        return ReminderViewerCollectors.set(key + user.id, collector as CollectorType);
    }

    function del() {
        for (const [key, collector] of ReminderViewerCollectors)
            if (key.includes(user.id)) {
                ReminderViewerCollectors.delete(key);
                collector.stop("ignore");
            }
    }
}