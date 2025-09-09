import { ChatInputCommandInteraction, Collection, Message, TextChannel } from "discord.js";
import { cache, cleaning, clearData } from "./clear";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { getConfirmationButton } from "../../components/buttons/buttons.get";

export default async function save_options(
    interaction: ChatInputCommandInteraction<"cached"> | Message<true>,
) {

    const { userLocale: locale, guild } = interaction;
    const user = "author" in interaction ? interaction.author : interaction.user;

    let msg: Message<boolean> | null | undefined = null;

    if (interaction instanceof ChatInputCommandInteraction)
        msg = await interaction.reply({
            content: t("clear.loading", { e, locale }),
            withResponse: true,
        }).then(res => res.resource?.message);

    if (interaction instanceof Message)
        msg = await interaction.reply({ content: t("clear.loading", { e, locale }) });

    if (!msg) return;

    const data: clearData = {
        userId: user.id,
        amount: getAmount(),
        channel: undefined,
        members: new Collection(),
        bots: false,
        attachments: false,
        webhooks: false,
        ignoreBots: false,
        ignoreMembers: false,
        ignoreWebhooks: false,
        script: false,
    };

    if (interaction instanceof ChatInputCommandInteraction) {
        data.channel = interaction.options.getChannel("channel") as TextChannel || interaction.channel as TextChannel;

        if (cleaning.has(data.channel?.id))
            return await msg.edit({ content: t("clear.cleaning", { e, locale }) });

        const filter = interaction.options.getString("filter") as "bots" | "attachments" | "webhooks" | "ignoreBots" | "ignoreMembers" | "ignoreWebhooks" | null;
        if (filter) data[filter] = true;

        data.script = interaction.options.getString("script") === "script";

        const queries = (interaction.options.getString("members") || "").split(/ /g);
        await guild.members.smartFetch();
        data.members = guild.members.searchBy(queries);

    }

    if (interaction instanceof Message) {
        data.channel = interaction.mentions.channels.first() as TextChannel || interaction.channel as TextChannel;

        if (cleaning.has(data.channel?.id))
            return await msg.edit({ content: t("clear.cleaning", { e, locale }) });

        if (interaction.content?.includes("script")) data.script = true;
        data.members = await interaction.parseMemberMentions();
    }

    if (!data.channel) data.channel = interaction.channel as TextChannel;

    if (cleaning.has(data.channel?.id))
        return await msg.edit({ content: t("clear.cleaning", { e, locale }) });

    cache.set(
        msg.id,
        data,
    );

    const filterKey = ["bots", "attachments", "webhooks", "ignoreBots", "ignoreMembers", "ignoreWebhooks"];
    return await msg.edit({
        content: t("clear.ask",
            {
                e,
                locale,
                data,
                channel_format: t(
                    data.channel?.id === interaction.channelId ? "clear.in_channel" : "clear.another_channel",
                    {
                        locale,
                        channel: `<#${data.channel?.id}>`,
                    },
                ),
                filters: filterKey.some(str => data[str as keyof typeof data])
                    ? "\n" + t("clear.filters.applied", locale) + "\n" + filterKey
                        .map(str => `${data[str as keyof typeof data] ? e.CheckV : e.DenyX} | ${t(`clear.filters.${str}`, locale)}`)
                        .join("\n")
                    : "",
            }),
        components: getConfirmationButton(
            locale,
            {
                accept: JSON.stringify({ c: "clear" }),
                cancel: JSON.stringify({ c: "delete", uid: user.id }),
            },
        ),
    });

    function getAmount(): number {

        let amount = 0;

        if (interaction instanceof ChatInputCommandInteraction) amount = interaction.options.getInteger("amount") || 0;

        if (interaction instanceof Message)
            for (const str of (interaction.content || "").split(" "))
                if (Number(str)) {
                    amount = Number(str);
                    break;
                }

        if (amount > 1000) amount = 1000;
        if (amount < 0) amount = 0;

        return amount;
    }
}