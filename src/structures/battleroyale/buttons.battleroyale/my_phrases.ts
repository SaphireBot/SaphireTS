import { ButtonInteraction, ButtonStyle, Collection, Colors, ComponentType, ContainerBuilder, MessageFlags, parseEmoji, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder } from "discord.js";
import { BattleroyalePhrasesManager } from "../../../managers";
import { t } from "../../../translator";
import { e } from "../../../util/json";

export default async function battleroyaleMyPhrases(
  interaction: ButtonInteraction<"cached">,
) {

  const { user, userLocale: locale } = interaction;

  const phrases = await BattleroyalePhrasesManager.fetchPhrasesFromAnUser(user.id);
  if (!phrases?.length) return;

  const containers = new Collection<number, ContainerBuilder>();

  for (let i = 0; i < phrases.length; i += 8) {

    const container = new ContainerBuilder({ accent_color: Colors.Blue });
    const sections: SectionBuilder[] = [];

    for (const phrase of phrases.slice(i, 8 + i)) {
      sections.push(
        new SectionBuilder({
          components: [
            {
              content: phrase.kill
                ? `💀 ${phrase.phrase}`
                : phrase.phrase,
              type: ComponentType.TextDisplay,
            },
          ],
          accessory: {
            custom_id: JSON.stringify({ c: "battleroyale", src: "delete", _id: phrase._id.toString() }),
            emoji: parseEmoji(e.Trash)! || "🗑️",
            style: ButtonStyle.Danger,
            type: ComponentType.Button,
            disabled: true,
          },
        }),
      );
    }

    container.addTextDisplayComponents(
      new TextDisplayBuilder({
        content: t("battleroyale.my_phrases_view", locale),
      }),
    )
      .addSectionComponents(sections);

    containers.set(containers.size, container);
  }

  const msg = await interaction.reply({
    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
    components: [containers.first()!],
    withResponse: true,
  }).then(res => res.resource?.message);

  if (containers.size <= 1 || !msg) return;

  return;
  // const collector = msg.createMessageComponentCollector({
  //   componentType: ComponentType.Button,
  //   idle: 1000 * 60,
  // });
}