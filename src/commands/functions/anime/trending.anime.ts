import { ActionRow, APIEmbed, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Colors, MessageActionRowComponent, parseEmoji } from "discord.js";
import { mapButtons } from "djs-protofy";
import { e } from "../../../util/json";
import { KitsuTrendingItem, KitsuTrendingResponse } from "../../../@types/commands";

let kitsuResponse: KitsuTrendingResponse | undefined = undefined;

export default async function animeTrending(
  interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">,
  customData?: { c: "trend_anime", uid: string },
) {

  let comps: ActionRow<MessageActionRowComponent>[] = [];

  if (interaction instanceof ButtonInteraction) {
    if (interaction.message.partial) await interaction.message.fetch().catch(() => { });
    comps = interaction.message.components;
    const components = mapButtons(comps, button => {
      if (button.style !== ButtonStyle.Primary) return button;
      button.disabled = true;
      if (button.custom_id.includes(customData?.c || "???")) {
        button.emoji = parseEmoji(e.Loading)!;
      } else {
        button.style = ButtonStyle.Secondary;
      }
      return button;
    });
    await interaction.update({ components });
  } else await interaction.deferReply();

  let trending = kitsuResponse?.data;

  if (!trending) {
    const res = await fetch(
      "https://kitsu.io/api/edge/trending/anime",
      {
        headers: {
          "Content-Type": "application/vnd.api+json",
          Accept: "application/vnd.api+json",
        },
      },
    )
      .then(res => res.json())
      .catch(err => {
        console.log(err);
        return err;
      }) as KitsuTrendingResponse | null;

    if (res) {
      kitsuResponse = res;
      trending = res.data;
      setTimeout(() => trending = undefined, (1000 * 60) * 20);
    }
  }

  if (!trending)
    return await interaction.editReply({
      content: `${e.bug} | Kitsu API Requesting Error.`,
      components: comps,
    });

  const embeds: APIEmbed[] = [];

  const firstEmbed: APIEmbed = {
    color: Colors.Blue,
    title: "🏆 Trending Animes",
    description: trending.map((data, i) => `${num(i)}. [${mapper(data.attributes)}](https://kitsu.app${data.links.self})`).join("\n").limit("EmbedDescription"),
    image: {
      url: trending[0].attributes.coverImage.original!,
    },
    footer: {
      text: "♥️ Powered by Kitsu API",
    },
  };

  embeds.push(firstEmbed);

  return await interaction.editReply({
    embeds: [embeds[0]],
    components: comps,
    content: null,
  });

  function mapper(data: KitsuTrendingItem["attributes"]) {
    return `${data.canonicalTitle || data.titles.en || data.titles.en_jp || data.titles.ja_jp || "??"}`;
  }

  function num(num: number) {
    if (num < 10) return `0${num}`;
    return num;
  }
}