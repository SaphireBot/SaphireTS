import { ButtonInteraction, ButtonStyle, MessageFlags, parseEmoji } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { BattleroyalePhrasesManager } from "../../../managers";

export default async function sendEphemeralMessageBattleroyaleList(
  interaction: ButtonInteraction<"cached">,
) {

  const { userLocale: locale, user } = interaction;

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    content: t("battleroyale.list_message", { e, locale }),
    components: getButtons(true, 0),
  });

  const phrases = await BattleroyalePhrasesManager.fetchPhrasesFromAnUser(user.id);

  await sleep(1500);
  await interaction.editReply({
    components: getButtons(false, phrases.length),
  });

  function getButtons(loading: boolean, phrasesLength: number) {
    return [
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
            label: phrasesLength > 0
              ? `${t("battleroyale.components.my_phrases", locale)} (${phrasesLength})`
              : t("battleroyale.components.my_phrases", locale),
            custom_id: JSON.stringify({ c: "battleroyale", src: "my_phrases" }),
            style: ButtonStyle.Primary,
            emoji: loading ? parseEmoji(e.Loading) : parseEmoji("✍️"),
            disabled: phrasesLength <= 0,
          },
        ],
      },
    ].asMessageComponents();
  }

}
