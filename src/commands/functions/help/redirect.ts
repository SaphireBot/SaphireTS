import { MessageFlags, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import slash from "./slash";
import prefix from "./prefix";
import apps from "./apps";
import global from "./global";
import info from "./info";

export default async function redirect(
  interaction: StringSelectMenuInteraction,
  data: { c: "help", uid: string, src?: "info" },
) {

  const { values, user, userLocale: locale } = interaction;

  if (user.id !== data.uid)
    return await interaction.reply({
      content: t("help.you_cannot_use_this_command", { e, locale }),
      flags: [MessageFlags.Ephemeral],
    });

  const value = values[0];

  if (data?.src === "info") return await info(interaction);
  if (value === "slash") return await slash(interaction);
  if (value === "prefix") return await prefix(interaction);
  if (value === "apps") return await apps(interaction);
  if (value === "global") return await global(interaction);
  if (value === "cancel") return await interaction.message?.delete().catch(() => { });

}