import { ChatInputCommandInteraction, Message } from "discord.js";
import selectMenu from "./selectMenu";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import info from "./info";

export default async function lauch(
  interaction: ChatInputCommandInteraction | Message
) {

  const { userLocale: locale } = interaction;
  const user = interaction instanceof Message ? interaction.author : interaction.user;

  if (interaction instanceof ChatInputCommandInteraction)
    if (interaction.options.getString("command"))
      return await info(interaction);

  return await interaction.reply({
    content: t("help.choose_an_value", { e, locale }),
    components: [selectMenu(locale, user.id)]
  });

}