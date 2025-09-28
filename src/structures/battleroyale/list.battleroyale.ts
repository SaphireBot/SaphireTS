import { ButtonInteraction, ButtonStyle, MessageFlags, parseEmoji } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import modals from "../modals";

export default async function battleroyaleList(
  interaction: ButtonInteraction<"cached">,
  data: {
    c: "battleroyale",
    src: "list" | "send" | "my_phrases"
  },
) {
  const { userLocale: locale } = interaction;

  if (data.src === "list")
    return await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: t("battleroyale.list_message", { e, locale }),
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: t("battleroyale.components.send_phrases", locale),
              custom_id: JSON.stringify({ c: "battleroyale", src: "send" }),
              style: ButtonStyle.Primary,
              emoji: parseEmoji("📨"),
            },
            {
              type: 2,
              label: t("battleroyale.components.my_phrases", locale),
              custom_id: JSON.stringify({ c: "battleroyale", src: "my_phrases" }),
              style: ButtonStyle.Primary,
              emoji: parseEmoji("✍️"),
              disabled: true,
            },
          ],
        },
      ] as any[],
    });
  
  if (data.src === "send")
    return await interaction.showModal(
      modals.sendPhraseToBattlaroyale(locale),
    );
}