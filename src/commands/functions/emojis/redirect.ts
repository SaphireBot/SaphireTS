import { ButtonInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import handler from "../../../structures/commands/handler";
import list from "./list";
import saphire from "./saphire";

export default async function redirect(
  interaction: ButtonInteraction<"cached">,
  data: {
    c: "emojis",
    src: "list" | "saphire",
    uid: string
  }
) {

  const { user, userLocale: locale } = interaction;

  if (user.id !== data?.uid) {
    const command = handler.getCommandMention("emoji");
    return await interaction.reply({
      content: t("emojis.use_your_command", {
        e,
        locale,
        emoji: command || "`/emoji`"
      }),
      ephemeral: true
    });
  }

  if (data?.src === "list")
    return await list(interaction);

  if (data?.src === "saphire")
    return await saphire(interaction);
}