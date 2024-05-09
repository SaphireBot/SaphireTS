import { APIActionRowComponent, APIButtonComponent, ButtonInteraction, ButtonStyle } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { PearlsManager } from "../../../managers";

export default async function alternative(
  interaction: ButtonInteraction<"cached">,
  uid?: string
) {

  const { userLocale: locale, user, message, guild } = interaction;

  if (user.id !== uid)
    return await interaction.reply({
      content: t("tempcall.you_cannot_click_here", { e, locale })
    });

  const msg = await interaction.reply({
    content: t("pearl.react_to_this_message", { e, locale }),
    fetchReply: true,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: t("pearl.components.buttons.cancel_emoji", { locale }),
            custom_id: JSON.stringify({ c: "delete", uid: user.id }),
            style: ButtonStyle.Danger,
            emoji: e.Trash
          }
        ].asMessageComponents()
      }
    ]
  });

  msg.createReactionCollector({
    filter: (_, u) => u.id === user.id,
    idle: 1000 * 60
  })
    .on("collect", async (reaction): Promise<any> => {

      if (!reaction.emoji.id) {
        await PearlsManager.setEmoji(guild.id, reaction.emoji.toString());
        const component = message.components[0].toJSON() as APIActionRowComponent<APIButtonComponent>;
        component.components[0].emoji = reaction.emoji.toString() as any;
        return await message.edit({ components: [component] });
      }

      const emoji = await guild.emojis.fetch(reaction.emoji.id!).catch(() => null);
      if (emoji === null) return await reaction.remove().catch(() => { });

      await PearlsManager.setEmoji(guild.id, reaction.emoji.toString());
      const component = message.components[0].toJSON() as APIActionRowComponent<APIButtonComponent>;
      component.components[0].emoji = reaction.emoji.toString() as any;
      return await message.edit({ components: [component] });
    })
    .on("end", async (): Promise<any> => await msg.delete().catch(() => { }));

  return;
}