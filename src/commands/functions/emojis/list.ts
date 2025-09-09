import { APIEmbed, ButtonInteraction, ChatInputCommandInteraction, Colors, GuildEmoji, Message } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { buttonsPagination } from "../../../util/constants";

export default async function list(
  interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached"> | Message<true>,
) {

  const { userLocale: locale, guild } = interaction;
  const user = "user" in interaction ? interaction.user : interaction.author;

  let msg: Message<boolean> | undefined | null;
  const content = t("emojis.list.building", { e, locale });

  if (interaction instanceof ButtonInteraction)
    msg = await interaction.update({ content, components: [], withResponse: true }).then(res => res.resource?.message);

  if (interaction instanceof ChatInputCommandInteraction)
    msg = await interaction.reply({ content, components: [], withResponse: true }).then(res => res.resource?.message);

  if (interaction instanceof Message)
    msg = await interaction.reply({ content, components: [] });

  if (!msg) return;

  const emojis = await guild.emojis.fetch().catch(() => null);

  if (!emojis || !emojis.size)
    return await msg.edit({
      content: t("emojis.list.no_emojis", { e, locale }),
    });

  const embeds: APIEmbed[] = GenerateEmbeds();

  await msg.edit({
    content: null,
    embeds: [embeds[0]],
    components: embeds.length > 1 ? [buttonsPagination] : [],
  }).catch(() => { });

  if (embeds.length <= 1) return;

  let i = 0;
  return msg.createMessageComponentCollector({
    filter: int => int.user.id === user.id,
    idle: (1000 * 60) * 5,
  })
    .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

      const { customId } = int;

      if (customId === "zero") i = 0;
      if (customId === "preview") i = i <= 0 ? embeds.length - 1 : i - 1;
      if (customId === "next") i = i >= (embeds.length - 1) ? 0 : i + 1;
      if (customId === "last") i = embeds.length - 1;

      return await int.update({ embeds: [embeds[i]] }).catch(() => { });
    })
    .on("end", async (): Promise<any> => {
      return await msg.edit({ components: [] }).catch(() => { });
    });

  function GenerateEmbeds() {

    const array = Array.from(emojis!.values());
    let amount = 10;
    let page = 1;
    const embeds: APIEmbed[] = [];
    const length = array.length / 10 <= 1 ? 1 : parseInt((array.length / 10).toFixed(0));

    for (let i = 0; i < array.length; i += 10) {

      const current = array.slice(i, amount);
      const description = current.map(emoji => `${emoji.toString()} \`${format(emoji)}\``).join("\n");
      const pageCount = length > 1 ? ` - ${page}/${length}` : "";

      embeds.push({
        color: Colors.Blue,
        title: `${t("emojis.list.embed.title", {
          e,
          locale,
          emoji: emojis!.random()!,
          guildName: guild.name,
        })}${pageCount}`,
        description,
        footer: {
          text: t("emojis.list.embed.footer", { locale, guildName: guild.name, emojis: emojis!.size }),
          icon_url: guild.iconURL()!,
        },
      });

      page++;
      amount += 10;

    }

    return embeds;
  }

  function format(emoji: GuildEmoji) {
    return `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
  }
}