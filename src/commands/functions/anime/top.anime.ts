import { ActionRow, APIEmbed, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Colors, MessageActionRowComponent, parseEmoji } from "discord.js";
import { mapButtons } from "djs-protofy";
import { e } from "../../../util/json";
import { JikanTopAnimeResponse } from "../../../@types/commands";

let jikanResponse: JikanTopAnimeResponse | undefined = undefined;

export default async function topAnimeRanking(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  customData?: { c: "top_anime", uid: string },
) {

  let comps: ActionRow<MessageActionRowComponent>[] = [];

  if (interaction instanceof ButtonInteraction) {
    if (interaction.message.partial) await interaction.message.fetch().catch(() => { });
    comps = interaction.message.components as any;
    const components = mapButtons(comps, button => {
      if (button.style !== ButtonStyle.Primary) return button;
      button.disabled = true;
      if (button.custom_id.includes(customData?.c || "???"))
        button.emoji = parseEmoji(e.Loading)!;
      else button.style = ButtonStyle.Secondary;
      return button;
    });
    await interaction.update({ components });
  } else await interaction.deferReply({ ephemeral: interaction.guildId ? false : true });

  let top = jikanResponse?.data;

  if (!top) {
    const res = await fetch(
      "https://api.jikan.moe/v4/top/anime",
      { headers: { "Content-Type": "application/json" } },
    )
      .then(res => res.json())
      .catch(err => {
        console.log(err);
        return err;
      }) as JikanTopAnimeResponse | null;

    if (res) {
      jikanResponse = res;
      top = res.data;
      setTimeout(() => top = undefined, (1000 * 60) * 20);
    }
  }

  if (!top)
    return await interaction.editReply({
      content: `${e.bug} | Jaikan API Requesting Error.`,
      components: comps,
    });

  const embeds: APIEmbed[] = [];

  embeds.push({
    color: Colors.Blue,
    title: "🏆 Top Animes Ranking",
    description: top.map(data => `${data.rank}. \`[${data.score}]\` [${data.title}](${data.url})`).join("\n").limit("EmbedDescription"),
    image: {
      url: top[0].images.jpg.image_url!,
    },
    footer: {
      text: "♥️ Powered by Jikan API and My Anime List",
    },
  });

  return await interaction.editReply({
    embeds: [embeds[0]],
    components: comps,
    content: null,
  })
    .catch(async () => {
      return await interaction.editReply({
        content: "Permissions Error.",
        embeds: [], components: [],
      });
    });

}