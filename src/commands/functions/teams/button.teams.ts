import { ButtonInteraction, MessageFlags } from "discord.js";
import teamsJoin from "./join.teams";
import teamsLeave from "./leave.teams";
import giveawayTeams from "./giveaway.teams";
import { e } from "../../../util/json";
import { t } from "../../../translator";

export default async function buttonTeam(
  interaction: ButtonInteraction<"cached">,
  data: {
    c: "teams",
    src: "join" | "leave" | "giveaway" | "cancel",
    id: string
  },
) {

  if (data?.src === "cancel") {

    if (data?.id !== interaction.user.id)
      return await interaction.reply({
        content: t("teams.only_author", { e, locale: interaction.userLocale, authorId: data?.id }),
        flags: [MessageFlags.Ephemeral],
      });

    return await interaction.message.delete().catch(() => { });
  }

  if (data?.src === "giveaway") {

    if (data?.id !== interaction.user.id)
      return await interaction.reply({
        content: t("teams.only_author", { e, locale: interaction.userLocale, authorId: data?.id }),
        flags: [MessageFlags.Ephemeral],
      });

    return await giveawayTeams(interaction);
  }

  if (data?.src === "join")
    return await teamsJoin(interaction);

  if (data?.src === "leave")
    return await teamsLeave(interaction);

}