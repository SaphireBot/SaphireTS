import { ButtonInteraction } from "discord.js";
import Database from "../../../database";
import { TeamsData } from "../../../@types/commands";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { buttonsTeams } from "./constants.teams";

export default async function teamsLeave(interaction: ButtonInteraction<"cached">) {

  const { user, message, userLocale: locale, guildId } = interaction;
  const data = await Database.Games.get(`Teams.${guildId}.${message.id}`) as TeamsData | undefined;

  if (!data)
    return await message.delete().catch(() => { });

  if (!data.participants.includes(user.id))
    return await interaction.reply({
      content: t("teams.you_already_out", { e, locale }),
      ephemeral: true
    });

  try {

    const set = (await Database.Games.set(`Teams.${guildId}.${message.id}.participants`,
      Array.from(
        new Set(
          (data.participants || []).filter(id => id !== user.id)
        )
      )
    ) as any) as Record<string, Record<string, TeamsData>>;
    const participants = set?.[guildId]?.[message.id]?.participants || [];

    const embed = message.embeds?.[0]?.toJSON() || {};
    const str = participants?.map(userId => `<@${userId}>`)?.join(", ")?.limit("EmbedDescription");
    embed.description = str?.length ? `👥 ${str}` : t("teams.no_participants", { e, locale });

    await interaction.update({
      embeds: [embed],
      components: buttonsTeams(locale, set?.[guildId]?.[message.id]?.authorId, participants.length < set?.[guildId]?.[message.id]?.roles.length)
    });

    return await interaction.followUp({
      content: t("teams.you_out", { e, locale }),
      ephemeral: true
    });

  } catch (_) {
    return await message.delete().catch(() => { });
  }
}