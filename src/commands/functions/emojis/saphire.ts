import { APIEmbed, ButtonInteraction, ChatInputCommandInteraction, Colors, Message } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { buttonsPagination } from "../../../util/constants";
import { APIApplicationEmojis } from "../../../@types/commands";
import client from "../../../saphire";

export default async function list(
  interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached"> | Message<true>
) {

  const { userLocale: locale, guild } = interaction;
  const user = "user" in interaction ? interaction.user : interaction.author;
  const building = {
    content: t("emojis.list.building", { e, locale }),
    components: [],
    fetchReply: true
  };

  const msg = interaction instanceof ButtonInteraction
    ? await interaction.update(building)
    : await interaction.reply(building);

  const response = await fetch(
    `https://discord.com/api/v10/applications/${client.application?.id}/emojis`,
    { headers: { authorization: `Bot ${client.token!}` } }
  )
    .then(res => res.json())
    .catch(() => { }) as APIApplicationEmojis;

  const emojis = response?.items || [];

  if (!emojis?.length)
    return await msg.edit({
      content: t("emojis.list.no_emojis", { e, locale })
    }).catch(() => { });

  const embeds: APIEmbed[] = GenerateEmbeds();

  await msg.edit({
    content: null,
    embeds: [embeds[0]],
    components: embeds.length > 1 ? [buttonsPagination] : []
  }).catch(() => { });

  if (embeds.length <= 1) return;

  let i = 0;
  return msg.createMessageComponentCollector({
    filter: int => int.user.id === user.id,
    idle: (1000 * 60) * 5
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
      const description = current.map(emoji => `\`${emoji.id}\` <:${emoji.name}:${emoji.id}>`).join("\n");
      const pageCount = length > 1 ? ` - ${page}/${length}` : "";

      embeds.push({
        color: Colors.Blue,
        title: `${e.Animated.SaphireDance} Emojis - ${client.user?.username}${pageCount}`,
        description,
        footer: {
          text: `${client.user!.username}'s Application Emojis has ${emojis.length} items`,
          icon_url: guild.iconURL()!
        }
      });

      page++;
      amount += 10;

    }

    return embeds;
  }

}