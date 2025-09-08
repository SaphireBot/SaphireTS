import { APIEmbed, ChatInputCommandInteraction, User, Colors, Message, time } from "discord.js";
import Database from "../../../database";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { User as UserType } from "../../../@types/database";

export default async function cooldown(
  interaction: Message | ChatInputCommandInteraction | undefined,
  user: User,
  message?: Message,
) {

  const locale = await user.locale();
  let msg: Message;

  const timeout = setTimeout(async () => {
    if (message || !interaction) return;
    msg = await interaction.reply({ content: t("cooldown.loading", { e, locale }), fetchReply: true });
  }, 2000);

  const timeouts = ((await Database.getUser(user.id))?.Timeouts || {} as UserType["Timeouts"])!;
  clearTimeout(timeout);

  function embed(): APIEmbed {
    return {
      color: Colors.Blue,
      title: "⏱️ Cooldown",
      description: [
        format(timeouts?.Daily || 0, "Daily"),
        format(timeouts?.Bitcoin || 0, "Bitcoin"),
        format(timeouts?.Porquinho || 0, "Porquinho"),
        format(timeouts?.TopGGVote || 0, "TopGGVote"),
      ].join("\n"),
    };
  }

  if (message)
    return await message.edit({ content: null, embeds: [embed()] })
      .catch(() => { });

  // @ts-expect-error ignore
  if (msg instanceof Message)
    return await msg.edit({ content: null, embeds: [embed()] })
      .then(checkFutureEdit)
      .catch(() => { });

  if (interaction)
    return await interaction.reply({
      content: undefined,
      embeds: [embed()],
      fetchReply: true,
    })
      .then(checkFutureEdit)
      .catch(() => { });

  async function checkFutureEdit(msg: Message) {
    for (const time of Object.values(timeouts)) {
      const res = time - Date.now();
      if (res <= (1000 * 30))
        setTimeout(async () => await cooldown(undefined, user, msg), res);
    }
  }

  function format(cooldown: number, tag: string) {
    const res = cooldown - Date.now();
    if (res <= 1000) return `${t(`cooldown.emojis.${tag}`, { e, locale })} ${t(`cooldown.tags.${tag}`, locale)}: ${t("cooldown.allowed", locale)}`;
    return `${e.Loading} ${t(`cooldown.tags.${tag}`, locale)}: ${time(new Date(Date.now() + res), "R")}`;
  }
}