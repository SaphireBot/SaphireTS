import { ButtonInteraction, ButtonStyle, Colors, ComponentType, MessageFlags, parseEmoji } from "discord.js";
import Database from "../../../database";
import { e } from "../../../util/json";
import { t } from "../../../translator";

export default async function voteReminder(
  interaction: ButtonInteraction<"cached">,
) {

  const { user, userLocale: locale } = interaction;

  const TopGGVotes = (await Database.getUser(user.id))?.TopGGVotes || 0;

  return await interaction.update({
    flags: [MessageFlags.IsComponentsV2],
    components: [
      {
        type: ComponentType.Container,
        accent_color: Colors.Blue,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `# ${e.topgg} Top.GG Bot List`,
          },
          {
            type: ComponentType.TextDisplay,
            content: t("vote.voted", { e, locale }),
          },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                custom_id: JSON.stringify({ c: "vote", src: "reminder", uid: user.id }),
                label: t("vote.reminded", locale),
                emoji: parseEmoji(e.CheckV),
                style: ButtonStyle.Secondary,
                disabled: true,
              },
              {
                type: ComponentType.Button,
                custom_id: "disable",
                disabled: true,
                label: t("vote.count", {
                  e,
                  locale,
                  votes: TopGGVotes,
                }),
                style: ButtonStyle.Primary,
                emoji: parseEmoji("🌟"),
              },
            ],
          },
        ],
      },
    ] as any,
  });
}