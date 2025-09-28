import { ButtonStyle, MessageFlags, ModalSubmitInteraction, parseEmoji } from "discord.js";
import { BattleroyalePhrasesManager, GlobalStaffManager } from "../../managers";
import { t } from "../../translator";
import { e } from "../../util/json";
import { mapButtons } from "djs-protofy";
import validatePhrases, { validatePhrasesCollectorss } from "../../commands/functions/staff/battleroyale/phrases.validate";

export default async function reviewModel(
  interaction: ModalSubmitInteraction<"cached">,
) {

  const { fields, message, user, userLocale: locale } = interaction;
  const _id = message?.embeds[0]?.footer?.text;

  validatePhrasesCollectorss.get(user.id)?.stop("fromModal");

  await interaction.deferUpdate();

  if (!GlobalStaffManager.isAdmin(user.id))
    return await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: t("staff.perms.admin", { e, locale }),
    });

  if (!_id)
    return await message?.delete()?.catch(() => { });

  const components = mapButtons(message.components, button => {
    if (
      button.style === ButtonStyle.Link
      || button.style === ButtonStyle.Premium
    ) return button;

    button.disabled = true;
    if (button.custom_id === "review")
      button.emoji = parseEmoji(e.Loading)!;

    return button;
  });

  await message.edit({ components });

  const phrase = fields.getTextInputValue("phrase");
  await BattleroyalePhrasesManager.approveNewPhrase(_id, phrase);

  await sleep(1500);
  return await validatePhrases(interaction, {
    c: "staff",
    src: "battleroyale",
    uid: user.id,
  });
}