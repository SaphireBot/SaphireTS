import { ChatInputCommandInteraction, Message } from "discord.js";
import Database from "../../../database";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default async function dailySequency(
    interaction: ChatInputCommandInteraction | Message,
) {

    const { userLocale: locale } = interaction;
    const user = interaction instanceof Message ? interaction.author : interaction.user;
    const data = await Database.getUser(user.id);

    return await interaction.reply({ content: t("daily.status", { e, locale, count: data?.DailyCount || 0 }) });

}