import { EmbedBuilder, ModalSubmitInteraction, embedLength } from "discord.js";
import payload from "./payload";
import isImage from "./image";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default async function footer(
  interaction: ModalSubmitInteraction<"cached">,
) {

  const { userLocale: locale, message, user, fields } = interaction;
  if (!message) return;
  const embed = new EmbedBuilder(message!.embeds?.[0]?.toJSON() || {}).data;
  const current = embedLength(embed);

  const [
    url,
    text,
  ] = [
      fields.getTextInputValue("url"),
      fields.getTextInputValue("text"),
    ];

  if (text) {
    if (embed.footer?.icon_url)
      embed.footer = {
        text,
        icon_url: embed.footer?.icon_url,
      };
    else embed.footer = { text };
  } else delete embed.footer;

  if (url && embed.footer?.text && (await isImage(url))) {
    embed.footer = {
      text: embed.footer?.text,
      icon_url: url,
    };
  } else delete embed.footer?.icon_url;

  await interaction.deferUpdate();

  const total = embedLength(embed);
  if (total > 6000)
    return await interaction.followUp({
      content: t("embed.over_limit", { e, locale, current: current.currency(), total: total.currency() }),
      ephemeral: true,
    });

  return await message!.edit(payload(locale, user.id, message.id, embed));
}