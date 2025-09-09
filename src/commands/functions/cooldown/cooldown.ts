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

  if (!interaction) return;

  const locale = await user.locale();
  let msg: Message<boolean> | null | undefined;

  const timeout = setTimeout(async () => {
    if (message || !interaction) return;
    msg = interaction instanceof Message
      ? await interaction.reply({ content: t("cooldown.loading", { e, locale }) })
      : await interaction.reply({
        content: t("cooldown.loading", { e, locale }),
        withResponse: true,
      }).then(res => res.resource?.message);
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

  if (msg instanceof Message)
    return await msg.edit({ content: null, embeds: [embed()] })
      .then(checkFutureEdit)
      .catch(() => { });

  if (interaction instanceof ChatInputCommandInteraction)
    return await interaction.reply({
      content: undefined,
      embeds: [embed()],
      withResponse: true,
    })
      .then(res => res.resource?.message)
      .then(checkFutureEdit)
      .catch(() => { });

  if (interaction instanceof Message)
    return await interaction.reply({ content: undefined, embeds: [embed()] })
      .then(checkFutureEdit)
      .catch(() => { });

  async function checkFutureEdit(msg: Message<boolean> | null | undefined) {
    if (!msg) return;
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